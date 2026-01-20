/**
 * Commissions API
 * GET /api/commissions - Get commission data for the authenticated agent
 *
 * Phase 2 - Issue #24: Added pagination to prevent performance issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase-server';
import { getCopilotCommissionSummary } from '@/lib/copilot/commission-service';
import { paginationSchema, createPaginatedResponse } from '@/lib/api/pagination';

interface CommissionRow {
  id: string;
  agent_id: string;
  order_id: string | null;
  type: string;
  retail_amount: number;
  bonus_volume: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
}

/**
 * GET /api/commissions
 * Get commission data for the authenticated agent
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get agent by user_id
    const { data: agent } = await supabase
      .from('agents')
      .select('id, rank')
      .eq('user_id', user.id)
      .single() as unknown as { data: { id: string; rank: string } | null; error: unknown };

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // PHASE 2 FIX - Issue #24: Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const paginationParams = paginationSchema.safeParse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    if (!paginationParams.success) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters', details: paginationParams.error.flatten() },
        { status: 400 }
      );
    }

    const { limit, offset } = paginationParams.data;
    const period = searchParams.get('period') || 'all'; // all, month, week
    const type = searchParams.get('type') || 'all'; // all, personal, override, ai_copilot

    // Build date filter
    let dateFilter: Date | null = null;
    if (period === 'week') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === 'month') {
      dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    }

    // PHASE 2 FIX - Issue #24: Build query with pagination
    let query = supabase
      .from('commissions')
      .select('*', { count: 'exact' })
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply type filter
    if (type === 'personal') {
      query = query.eq('type', 'ai_copilot');
    } else if (type === 'override') {
      query = query.eq('type', 'override');
    } else if (type !== 'all') {
      query = query.eq('type', type);
    }

    // Apply date filter
    if (dateFilter) {
      query = query.gte('created_at', dateFilter.toISOString());
    }

    const { data: commissions, error: commissionsError, count } = await query as unknown as {
      data: CommissionRow[] | null;
      error: unknown;
      count: number | null;
    };

    if (commissionsError) {
      console.error('Error fetching commissions:', commissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch commissions' },
        { status: 500 }
      );
    }

    // Get summary
    const summary = await getCopilotCommissionSummary(agent.id);

    // Calculate period-specific totals
    const periodTotal = (commissions || []).reduce(
      (sum, c) => sum + c.commission_amount,
      0
    );

    const periodPending = (commissions || [])
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + c.commission_amount, 0);

    const periodPaid = (commissions || [])
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + c.commission_amount, 0);

    // PHASE 2 FIX - Issue #24: Return paginated response
    const paginatedResponse = createPaginatedResponse(
      commissions || [],
      count || 0,
      limit,
      offset
    );

    return NextResponse.json({
      ...paginatedResponse,
      summary: {
        ...summary,
        periodTotal,
        periodPending,
        periodPaid,
      },
      agentRank: agent.rank,
    });

  } catch (error) {
    console.error('Error in commissions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
