/**
 * Admin Commissions API
 * GET - List all commissions with filters
 * POST - Create a single commission (triggers workflow)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { onCommissionCreated } from '@/lib/workflows/on-commission-created';
import type { Commission, Agent } from '@/lib/types/database';

// Query result type for stats
interface CommissionStatRow {
  commission_amount: number | null;
  status: string;
}

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  agent_id: z.string().uuid().optional(),
  carrier: z.string().optional(),
  status: z.enum(['pending', 'paid', 'reversed']).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  search: z.string().optional(),
});

// Create commission schema
const createCommissionSchema = z.object({
  agent_id: z.string().uuid(),
  carrier: z.string(),
  policy_number: z.string().min(1),
  premium_amount: z.number().positive(),
  commission_rate: z.number().min(0).max(1),
  commission_amount: z.number().positive(),
  policy_date: z.string(),
  status: z.enum(['pending', 'paid', 'reversed']).default('pending'),
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

    const { limit, offset, agent_id, carrier, status, from_date, to_date, search } = parseResult.data;

    // Build query with agent join
    let query = supabase
      .from('commissions')
      .select('*, agents(id, first_name, last_name, email, agent_code)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    if (carrier) {
      query = query.eq('carrier', carrier);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (from_date) {
      query = query.gte('policy_date', from_date);
    }

    if (to_date) {
      query = query.lte('policy_date', to_date);
    }

    if (search) {
      query = query.or(`policy_number.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Commissions fetch error:', error);
      return serverErrorResponse();
    }

    // Calculate summary stats
    const { data: statsData } = await supabase
      .from('commissions')
      .select('commission_amount, status');

    const statsRows = (statsData || []) as CommissionStatRow[];
    const stats = {
      totalCommissions: statsRows.length,
      totalAmount: statsRows.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
      pendingCount: statsRows.filter(c => c.status === 'pending').length,
      paidCount: statsRows.filter(c => c.status === 'paid').length,
    };

    return NextResponse.json({
      commissions: data || [],
      total: count || 0,
      limit,
      offset,
      stats,
    });
  } catch (error) {
    console.error('Admin commissions GET error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = createCommissionSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const commissionData = parseResult.data;

    // Verify agent exists
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', commissionData.agent_id)
      .single();

    if (agentError || !agentData) {
      return badRequestResponse('Agent not found');
    }

    const agent = agentData as Agent;

    // Create commission
    const { data: commission, error: createError } = await supabase
      .from('commissions')
      .insert(commissionData as never)
      .select()
      .single();

    if (createError) {
      console.error('Commission create error:', createError);
      return serverErrorResponse();
    }

    // Trigger the commission workflow
    const workflowResult = await onCommissionCreated({
      commission: commission as Commission,
      agent,
    });

    return NextResponse.json({
      commission,
      workflow: workflowResult,
    }, { status: 201 });
  } catch (error) {
    console.error('Admin commissions POST error:', error);
    return serverErrorResponse();
  }
}
