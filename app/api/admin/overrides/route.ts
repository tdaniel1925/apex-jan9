/**
 * Admin Overrides API
 * GET - List all overrides with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';

// Query result type for stats
interface OverrideStatRow {
  override_amount: number | null;
  status: string;
  generation: number;
}

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  agent_id: z.string().uuid().optional(), // Agent receiving override
  source_agent_id: z.string().uuid().optional(), // Agent who made sale
  commission_id: z.string().uuid().optional(),
  generation: z.coerce.number().min(1).max(6).optional(),
  status: z.enum(['pending', 'paid', 'reversed']).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
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

    const { limit, offset, agent_id, source_agent_id, commission_id, generation, status, from_date, to_date } = parseResult.data;

    // Build query with joins
    let query = supabase
      .from('overrides')
      .select(`
        *,
        agent:agents!overrides_agent_id_fkey(id, first_name, last_name, agent_code, rank),
        source_agent:agents!overrides_source_agent_id_fkey(id, first_name, last_name, agent_code),
        commission:commissions(id, policy_number, carrier, premium_amount, commission_amount)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    if (source_agent_id) {
      query = query.eq('source_agent_id', source_agent_id);
    }

    if (commission_id) {
      query = query.eq('commission_id', commission_id);
    }

    if (generation) {
      query = query.eq('generation', generation);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (from_date) {
      query = query.gte('created_at', from_date);
    }

    if (to_date) {
      query = query.lte('created_at', to_date);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Overrides fetch error:', error);
      return serverErrorResponse();
    }

    // Calculate summary stats
    const { data: statsData } = await supabase
      .from('overrides')
      .select('override_amount, status, generation');

    const statsRows = (statsData || []) as OverrideStatRow[];
    const stats = {
      totalOverrides: statsRows.length,
      totalAmount: statsRows.reduce((sum, o) => sum + (o.override_amount || 0), 0),
      pendingCount: statsRows.filter(o => o.status === 'pending').length,
      pendingAmount: statsRows.filter(o => o.status === 'pending').reduce((sum, o) => sum + (o.override_amount || 0), 0),
      paidCount: statsRows.filter(o => o.status === 'paid').length,
      reversedCount: statsRows.filter(o => o.status === 'reversed').length,
      byGeneration: {
        1: statsRows.filter(o => o.generation === 1).reduce((sum, o) => sum + (o.override_amount || 0), 0),
        2: statsRows.filter(o => o.generation === 2).reduce((sum, o) => sum + (o.override_amount || 0), 0),
        3: statsRows.filter(o => o.generation === 3).reduce((sum, o) => sum + (o.override_amount || 0), 0),
        4: statsRows.filter(o => o.generation === 4).reduce((sum, o) => sum + (o.override_amount || 0), 0),
        5: statsRows.filter(o => o.generation === 5).reduce((sum, o) => sum + (o.override_amount || 0), 0),
        6: statsRows.filter(o => o.generation === 6).reduce((sum, o) => sum + (o.override_amount || 0), 0),
      },
    };

    return NextResponse.json({
      overrides: data || [],
      total: count || 0,
      limit,
      offset,
      stats,
    });
  } catch (error) {
    console.error('Admin overrides GET error:', error);
    return serverErrorResponse();
  }
}
