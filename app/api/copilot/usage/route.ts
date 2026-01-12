/**
 * Copilot Usage API
 * GET /api/copilot/usage - Get usage statistics
 * POST /api/copilot/usage - Increment usage (called when sending a message)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@/lib/db/supabase-server';
import { getSubscription, getTodayUsage, incrementUsage } from '@/lib/copilot/subscription-service';
import { getDailyMessageLimit } from '@/lib/copilot/config';

// Result type for Supabase query
interface AgentResult {
  id: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get agent
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as unknown as { data: AgentResult | null; error: unknown };

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get subscription
    const subscription = await getSubscription(agent.id);

    if (!subscription) {
      return NextResponse.json({
        hasAccess: false,
        used: 0,
        limit: 0,
        remaining: 0,
      });
    }

    // Get usage
    const todayUsage = await getTodayUsage(agent.id);
    const dailyLimit = getDailyMessageLimit({
      status: subscription.status,
      tier: subscription.tier,
    });

    const isUnlimited = dailyLimit === Infinity;
    const remaining = isUnlimited ? Infinity : Math.max(0, dailyLimit - todayUsage);
    const hasAccess = subscription.status === 'active' || subscription.status === 'trialing';

    return NextResponse.json({
      hasAccess,
      status: subscription.status,
      tier: subscription.tier,
      used: todayUsage,
      limit: isUnlimited ? 'unlimited' : dailyLimit,
      remaining: isUnlimited ? 'unlimited' : remaining,
      percentUsed: isUnlimited ? 0 : Math.round((todayUsage / dailyLimit) * 100),
    });
  } catch (error) {
    console.error('Error getting usage:', error);
    return NextResponse.json(
      { error: 'Failed to get usage' },
      { status: 500 }
    );
  }
}

// Increment usage (returns whether the message is allowed)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get agent
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as unknown as { data: AgentResult | null; error: unknown };

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Increment usage
    const result = await incrementUsage(agent.id);

    if (!result.allowed) {
      return NextResponse.json({
        allowed: false,
        message: result.limit === 0
          ? 'You need an active subscription to use the copilot'
          : 'Daily message limit reached. Upgrade for more messages.',
        used: result.used,
        limit: result.limit,
      }, { status: 429 }); // Too Many Requests
    }

    const isUnlimited = result.limit === Infinity;

    return NextResponse.json({
      allowed: true,
      used: result.used,
      limit: isUnlimited ? 'unlimited' : result.limit,
      remaining: isUnlimited ? 'unlimited' : Math.max(0, result.limit - result.used),
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}
