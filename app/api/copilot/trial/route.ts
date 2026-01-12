/**
 * Copilot Trial API
 * POST /api/copilot/trial - Start a trial for the authenticated agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@/lib/db/supabase-server';
import { startTrial, getSubscription } from '@/lib/copilot/subscription-service';
import { TRIAL_CONFIG } from '@/lib/copilot/config';

// Result type for Supabase query
interface AgentResult {
  id: string;
}

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

    // Check existing subscription
    const existing = await getSubscription(agent.id);
    if (existing) {
      return NextResponse.json(
        { error: 'You already have an active subscription or trial' },
        { status: 400 }
      );
    }

    // Start trial
    const subscription = await startTrial(agent.id);

    return NextResponse.json({
      success: true,
      subscription: {
        status: subscription.status,
        tier: subscription.tier,
        trialEndsAt: subscription.trial_ends_at,
        dailyMessageLimit: TRIAL_CONFIG.dailyMessageLimit,
      },
      message: `Your ${TRIAL_CONFIG.durationDays}-day trial has started!`,
    });
  } catch (error) {
    console.error('Error starting trial:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start trial' },
      { status: 500 }
    );
  }
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

    const isTrialing = subscription.status === 'trialing';
    const trialExpired = isTrialing && subscription.trial_ends_at
      ? new Date(subscription.trial_ends_at) < new Date()
      : false;

    return NextResponse.json({
      hasSubscription: true,
      status: subscription.status,
      tier: subscription.tier,
      isTrialing,
      trialExpired,
      trialEndsAt: subscription.trial_ends_at,
      currentPeriodEnd: subscription.current_period_end,
    });
  } catch (error) {
    console.error('Error getting trial status:', error);
    return NextResponse.json(
      { error: 'Failed to get trial status' },
      { status: 500 }
    );
  }
}
