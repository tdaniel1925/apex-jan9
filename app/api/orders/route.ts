/**
 * Orders API
 * GET /api/orders - List orders for current agent
 *
 * Phase 2 - Issue #24: Added pagination to prevent performance issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { paginationSchema, createPaginatedResponse } from '@/lib/api/pagination';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent record
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: any; error: any };

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
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

    // PHASE 2 FIX - Issue #24: Fetch orders with pagination
    const { data: orders, error: ordersError, count } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          bonus_volume,
          downloads_remaining,
          product:products (
            id,
            name,
            description,
            image_url,
            digital_asset_url,
            download_limit
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1) as { data: any; error: any; count: number | null };

    if (ordersError) {
      throw ordersError;
    }

    // PHASE 2 FIX - Issue #24: Return paginated response
    return NextResponse.json(
      createPaginatedResponse(orders || [], count || 0, limit, offset)
    );
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
