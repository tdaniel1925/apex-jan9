/**
 * Admin Copilot Subscriptions API
 * GET - List all copilot subscriptions with filtering
 * PATCH - Update subscription status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceClient } from '@/lib/db/supabase-server';

interface SubscriptionRow {
  id: string;
  agent_id: string;
  stripe_subscription_id: string | null;
  tier: string;
  status: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  daily_message_limit: number | null;
  daily_messages_used: number;
  created_at: string;
  updated_at: string;
  agents: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    rank: string;
  };
}

/**
 * GET /api/admin/copilot/subscriptions
 * List all copilot subscriptions with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (you might have a different admin check)
    const { data: agent } = await supabase
      .from('agents')
      .select('role')
      .eq('user_id', user.id)
      .single() as unknown as { data: { role: string } | null; error: unknown };

    if (!agent || agent.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');

    // Use service client for admin queries
    const serviceClient = createServiceClient();

    // Build query
    let query = serviceClient
      .from('copilot_subscriptions')
      .select(`
        *,
        agents:agent_id (
          id,
          first_name,
          last_name,
          email,
          rank
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (tier) {
      query = query.eq('tier', tier);
    }

    const { data: subscriptions, error } = await query as unknown as {
      data: SubscriptionRow[] | null;
      error: unknown;
    };

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    // Filter by search if provided
    let filteredSubscriptions = subscriptions || [];
    if (search && filteredSubscriptions.length > 0) {
      const searchLower = search.toLowerCase();
      filteredSubscriptions = filteredSubscriptions.filter((sub) => {
        const agentName = `${sub.agents?.first_name || ''} ${sub.agents?.last_name || ''}`.toLowerCase();
        const agentEmail = (sub.agents?.email || '').toLowerCase();
        return agentName.includes(searchLower) || agentEmail.includes(searchLower);
      });
    }

    // Calculate stats
    const stats = {
      total: filteredSubscriptions.length,
      active: filteredSubscriptions.filter((s) => s.status === 'active').length,
      trialing: filteredSubscriptions.filter((s) => s.status === 'trialing').length,
      cancelled: filteredSubscriptions.filter((s) => s.status === 'cancelled').length,
      byTier: {
        basic: filteredSubscriptions.filter((s) => s.tier === 'basic').length,
        pro: filteredSubscriptions.filter((s) => s.tier === 'pro').length,
        agency: filteredSubscriptions.filter((s) => s.tier === 'agency').length,
      },
    };

    return NextResponse.json({
      subscriptions: filteredSubscriptions,
      stats,
    });

  } catch (error) {
    console.error('Error in admin subscriptions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/copilot/subscriptions
 * Update a subscription (cancel, extend trial, change tier)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('role')
      .eq('user_id', user.id)
      .single() as unknown as { data: { role: string } | null; error: unknown };

    if (!agent || agent.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subscriptionId, action, data } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: 'subscriptionId and action are required' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'cancel':
        updateData = { status: 'cancelled' };
        break;

      case 'activate':
        updateData = { status: 'active' };
        break;

      case 'extend_trial':
        const days = data?.days || 7;
        const currentSub = await serviceClient
          .from('copilot_subscriptions')
          .select('trial_ends_at')
          .eq('id', subscriptionId)
          .single() as unknown as { data: { trial_ends_at: string | null } | null; error: unknown };

        if (currentSub.data) {
          const currentEnd = currentSub.data.trial_ends_at
            ? new Date(currentSub.data.trial_ends_at)
            : new Date();
          currentEnd.setDate(currentEnd.getDate() + days);
          updateData = {
            trial_ends_at: currentEnd.toISOString(),
            status: 'trialing',
          };
        }
        break;

      case 'change_tier':
        if (!data?.tier) {
          return NextResponse.json(
            { error: 'tier is required for change_tier action' },
            { status: 400 }
          );
        }

        const tierLimits: Record<string, number | null> = {
          basic: 50,
          pro: 200,
          agency: null,
        };

        updateData = {
          tier: data.tier,
          daily_message_limit: tierLimits[data.tier],
        };
        break;

      case 'reset_usage':
        updateData = { daily_messages_used: 0 };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const { data: updatedSub, error: updateError } = await serviceClient
      .from('copilot_subscriptions')
      .update(updateData as never)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: updatedSub,
    });

  } catch (error) {
    console.error('Error in admin subscriptions update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
