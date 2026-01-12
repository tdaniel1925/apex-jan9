/**
 * Admin Payouts API
 * GET - List all payouts with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';

// Query result type for stats
interface PayoutStatRow {
  amount: number | null;
  net_amount: number | null;
  fee: number | null;
  status: string;
  method: string;
}

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  agent_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  method: z.enum(['ach', 'wire', 'check']).optional(),
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

    const { limit, offset, agent_id, status, method, from_date, to_date } = parseResult.data;

    // Build query
    let query = supabase
      .from('payouts')
      .select('*, agents(id, first_name, last_name, email, agent_code)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (method) {
      query = query.eq('method', method);
    }

    if (from_date) {
      query = query.gte('created_at', from_date);
    }

    if (to_date) {
      query = query.lte('created_at', to_date);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Payouts fetch error:', error);
      return serverErrorResponse();
    }

    // Calculate summary stats
    const { data: statsData } = await supabase
      .from('payouts')
      .select('amount, net_amount, fee, status, method');

    const statsRows = (statsData || []) as PayoutStatRow[];
    const stats = {
      totalPayouts: statsRows.length,
      totalAmount: statsRows.reduce((sum, p) => sum + (p.amount || 0), 0),
      totalFees: statsRows.reduce((sum, p) => sum + (p.fee || 0), 0),
      totalNetAmount: statsRows.reduce((sum, p) => sum + (p.net_amount || 0), 0),
      pendingCount: statsRows.filter(p => p.status === 'pending').length,
      pendingAmount: statsRows.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0),
      processingCount: statsRows.filter(p => p.status === 'processing').length,
      completedCount: statsRows.filter(p => p.status === 'completed').length,
      failedCount: statsRows.filter(p => p.status === 'failed').length,
      byMethod: {
        ach: statsRows.filter(p => p.method === 'ach').length,
        wire: statsRows.filter(p => p.method === 'wire').length,
        check: statsRows.filter(p => p.method === 'check').length,
      },
    };

    return NextResponse.json({
      payouts: data || [],
      total: count || 0,
      limit,
      offset,
      stats,
    });
  } catch (error) {
    console.error('Admin payouts GET error:', error);
    return serverErrorResponse();
  }
}
