/**
 * Copilot Checkout API
 * POST /api/copilot/checkout - Create Stripe checkout session for subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@/lib/db/supabase-server';
import { createCheckoutSession } from '@/lib/copilot/subscription-service';
import { CopilotTier, COPILOT_TIERS } from '@/lib/copilot/config';
import { z } from 'zod';

// Result type for Supabase query
interface AgentResult {
  id: string;
}

const checkoutSchema = z.object({
  tier: z.enum(['basic', 'pro', 'agency']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

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

    // Parse request body
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { tier, successUrl, cancelUrl } = parsed.data;

    // Build URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';
    const success = successUrl || `${origin}/dashboard/copilot?success=true`;
    const cancel = cancelUrl || `${origin}/dashboard/copilot?cancelled=true`;

    // Create checkout session
    const checkoutUrl = await createCheckoutSession(agent.id, tier, success, cancel);

    if (!checkoutUrl) {
      throw new Error('Failed to create checkout session');
    }

    return NextResponse.json({
      checkoutUrl,
      tier: COPILOT_TIERS[tier],
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// GET: Get available tiers and pricing
export async function GET() {
  const tiers = Object.values(COPILOT_TIERS).map((tier) => ({
    tier: tier.tier,
    name: tier.name,
    priceMonthly: tier.priceCents / 100,
    priceCents: tier.priceCents,
    bonusVolume: tier.bonusVolume,
    dailyMessageLimit: tier.dailyMessageLimit,
    features: tier.features,
  }));

  return NextResponse.json({ tiers });
}
