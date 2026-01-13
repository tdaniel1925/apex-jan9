/**
 * Admin Agents API
 * GET - List all agents with filters
 * POST - Create a new agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { RANKS, Rank } from '@/lib/config/ranks';
import { onAgentRegistered } from '@/lib/workflows/on-agent-registered';
import type { Agent, AgentInsert } from '@/lib/types/database';

// Query result type for stats
interface AgentStatRow {
  status: string;
  rank: Rank;
}

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  rank: z.enum(RANKS as unknown as [string, ...string[]]).optional(),
  status: z.enum(['pending', 'active', 'inactive', 'terminated']).optional(),
  sponsor_id: z.string().uuid().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'rank', 'premium_90_days', 'first_name']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Create agent schema
const createAgentSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional(),
  sponsor_id: z.string().uuid().optional(),
  rank: z.enum(RANKS as unknown as [string, ...string[]]).default('pre_associate'),
  status: z.enum(['pending', 'active', 'inactive', 'terminated']).default('pending'),
});

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return badRequestResponse('Invalid query parameters', parseResult.error.flatten());
    }

    const { limit, offset, rank, status, sponsor_id, search, sort_by, sort_order } = parseResult.data;

    // Build query - use simple select without explicit FK name
    let query = supabase
      .from('agents')
      .select('*, sponsor:sponsor_id(id, first_name, last_name, agent_code)', { count: 'exact' })
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (rank) {
      query = query.eq('rank', rank);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (sponsor_id) {
      query = query.eq('sponsor_id', sponsor_id);
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,agent_code.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Agents fetch error:', error);
      return serverErrorResponse();
    }

    // Get summary stats
    const { data: statsData } = await supabase
      .from('agents')
      .select('status, rank');

    const statsRows = (statsData || []) as AgentStatRow[];
    const stats = {
      total: statsRows.length,
      active: statsRows.filter(a => a.status === 'active').length,
      pending: statsRows.filter(a => a.status === 'pending').length,
      inactive: statsRows.filter(a => a.status === 'inactive').length,
      terminated: statsRows.filter(a => a.status === 'terminated').length,
    };

    return NextResponse.json({
      agents: data || [],
      total: count || 0,
      limit,
      offset,
      stats,
    });
  } catch (error) {
    console.error('Admin agents GET error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = createAgentSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const agentData = parseResult.data;

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('agents')
      .select('id')
      .eq('email', agentData.email)
      .single();

    if (existingEmail) {
      return badRequestResponse('An agent with this email already exists');
    }

    // Generate unique agent code
    const agentCode = await generateAgentCode(supabase);

    // Generate username from email
    const username = agentData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    // Create auth user first (with random password that must be reset)
    const tempPassword = generateTempPassword();
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: agentData.email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth user create error:', authError);
      return badRequestResponse('Failed to create user account', authError.message);
    }

    // Create agent record
    const insertData: AgentInsert = {
      user_id: authUser.user.id,
      email: agentData.email,
      first_name: agentData.first_name,
      last_name: agentData.last_name,
      phone: agentData.phone || null,
      username,
      agent_code: agentCode,
      sponsor_id: agentData.sponsor_id || null,
      rank: agentData.rank as Rank,
      status: agentData.status,
    };

    const { data: agent, error: createError } = await supabase
      .from('agents')
      .insert(insertData as never)
      .select()
      .single();

    if (createError) {
      console.error('Agent create error:', createError);
      // Clean up auth user if agent creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return serverErrorResponse();
    }

    // Trigger registration workflow
    const workflowResult = await onAgentRegistered({
      agent: agent as Agent,
      sponsorId: agentData.sponsor_id || null,
    });

    return NextResponse.json({
      agent,
      temp_password: tempPassword, // Send this securely to the agent
      workflow: workflowResult,
    }, { status: 201 });
  } catch (error) {
    console.error('Admin agents POST error:', error);
    return serverErrorResponse();
  }
}

// Helper to generate unique agent code
async function generateAgentCode(supabase: ReturnType<typeof createAdminClient>): Promise<string> {
  const prefix = 'APX';
  let code: string;
  let exists = true;

  while (exists) {
    const random = Math.floor(100000 + Math.random() * 900000);
    code = `${prefix}${random}`;

    const { data } = await supabase
      .from('agents')
      .select('id')
      .eq('agent_code', code)
      .single();

    exists = !!data;
  }

  return code!;
}

// Helper to generate temp password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
