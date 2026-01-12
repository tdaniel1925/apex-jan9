/**
 * Copilot Subscription API
 * GET /api/copilot/subscription - Get current subscription status
 * DELETE /api/copilot/subscription - Cancel subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@/lib/db/supabase-server';
import { getSubscription, getTodayUsage, isTrialExpired } from '@/lib/copilot/subscription-service';
import { COPILOT_TIERS, TRIAL_CONFIG, getDailyMessageLimit } from '@/lib/copilot/config';
import { stripe } from '@/lib/stripe';

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
        hasSubscription: false,
        canStartTrial: true,
        trialDuration: TRIAL_CONFIG.durationDays,
      });
    }

    // Get usage
    const todayUsage = await getTodayUsage(agent.id);
    const dailyLimit = getDailyMessageLimit({
      status: subscription.status,
      tier: subscription.tier,
    });

    // Get tier details
    const tierConfig = COPILOT_TIERS[subscription.tier];

    // Check if trial is expired
    const trialExpired = isTrialExpired(subscription);

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        tier: subscription.tier,
        tierName: tierConfig.name,
        priceCents: subscription.price_cents,
        bonusVolume: subscription.bonus_volume,
        isTrialing: subscription.status === 'trialing',
        trialExpired,
        trialEndsAt: subscription.trial_ends_at,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
      },
      usage: {
        today: todayUsage,
        limit: dailyLimit === Infinity ? 'unlimited' : dailyLimit,
        remaining: dailyLimit === Infinity ? 'unlimited' : Math.max(0, dailyLimit - todayUsage),
      },
      features: tierConfig.features,
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}

// Cancel subscription
export async function DELETE(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // If it's a trial, just cancel it
    if (subscription.status === 'trialing' || !subscription.stripe_subscription_id) {
      const { error } = await supabase
        .from('copilot_subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', subscription.id);

      if (error) {
        throw new Error('Failed to cancel subscription');
      }

      return NextResponse.json({
        success: true,
        message: 'Trial cancelled',
      });
    }

    // Cancel Stripe subscription at period end
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current period',
      cancelAt: subscription.current_period_end,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
