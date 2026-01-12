/**
 * Copilot Subscription Service
 * Handles trial management, subscriptions, and usage tracking
 */

import { createServiceClient } from '@/lib/db/supabase-server';
import { stripe, toCents } from '@/lib/stripe';
import { CopilotTier, COPILOT_TIERS, TRIAL_CONFIG, getStripePriceId, getTierFromPriceId } from './config';

// Result types for type assertions with Supabase
interface SubscriptionRow {
  id: string;
  agent_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  tier: CopilotTier;
  bonus_volume: number;
  price_cents: number;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled';
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

interface AgentRow {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  upline_id: string | null;
}

interface UsageRow {
  id: string;
  agent_id: string;
  date: string;
  messages_used: number;
}

/**
 * Start a trial for an agent
 */
export async function startTrial(agentId: string): Promise<SubscriptionRow> {
  const supabase = createServiceClient();

  // Check if agent already has a subscription
  const { data: existing } = await supabase
    .from('copilot_subscriptions')
    .select('*')
    .eq('agent_id', agentId)
    .single() as unknown as { data: SubscriptionRow | null; error: unknown };

  if (existing) {
    throw new Error('Agent already has a subscription');
  }

  // Calculate trial end date
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_CONFIG.durationDays);

  // Create trial subscription
  const { data: subscription, error } = await supabase
    .from('copilot_subscriptions')
    .insert({
      agent_id: agentId,
      tier: 'basic' as CopilotTier, // Trial starts at basic tier
      bonus_volume: COPILOT_TIERS.basic.bonusVolume,
      price_cents: COPILOT_TIERS.basic.priceCents,
      status: 'trialing',
      trial_ends_at: trialEndsAt.toISOString(),
    } as never)
    .select()
    .single() as unknown as { data: SubscriptionRow | null; error: unknown };

  if (error || !subscription) {
    throw new Error('Failed to create trial subscription');
  }

  return subscription;
}

/**
 * Get subscription for an agent
 */
export async function getSubscription(agentId: string): Promise<SubscriptionRow | null> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('copilot_subscriptions')
    .select('*')
    .eq('agent_id', agentId)
    .single() as unknown as { data: SubscriptionRow | null; error: unknown };

  return data;
}

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(
  agentId: string,
  tier: CopilotTier,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const supabase = createServiceClient();

  // Get agent info
  const { data: agent } = await supabase
    .from('agents')
    .select('id, email, first_name, last_name')
    .eq('id', agentId)
    .single() as unknown as { data: AgentRow | null; error: unknown };

  if (!agent) {
    throw new Error('Agent not found');
  }

  // Get or create Stripe customer
  const { data: subscription } = await supabase
    .from('copilot_subscriptions')
    .select('stripe_customer_id')
    .eq('agent_id', agentId)
    .single() as unknown as { data: { stripe_customer_id: string | null } | null; error: unknown };

  let customerId = subscription?.stripe_customer_id;

  if (!customerId) {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: agent.email,
      name: `${agent.first_name} ${agent.last_name}`,
      metadata: {
        agent_id: agentId,
      },
    });
    customerId = customer.id;
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: getStripePriceId(tier),
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      agent_id: agentId,
      tier: tier,
    },
    subscription_data: {
      metadata: {
        agent_id: agentId,
        tier: tier,
        bonus_volume: COPILOT_TIERS[tier].bonusVolume.toString(),
      },
    },
  });

  return session.url || '';
}

/**
 * Handle Stripe subscription created/updated webhook
 */
export async function handleSubscriptionUpdate(
  stripeSubscriptionId: string,
  customerId: string,
  status: string,
  priceId: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  metadata: Record<string, string>
): Promise<void> {
  const supabase = createServiceClient();
  const agentId = metadata.agent_id;

  if (!agentId) {
    throw new Error('Missing agent_id in subscription metadata');
  }

  const tier = getTierFromPriceId(priceId) || (metadata.tier as CopilotTier) || 'basic';
  const tierConfig = COPILOT_TIERS[tier];

  // Map Stripe status to our status
  const subscriptionStatus = mapStripeStatus(status);

  // Update or insert subscription
  const { error } = await supabase
    .from('copilot_subscriptions')
    .upsert({
      agent_id: agentId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: customerId,
      tier: tier,
      bonus_volume: tierConfig.bonusVolume,
      price_cents: tierConfig.priceCents,
      status: subscriptionStatus,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    } as never, {
      onConflict: 'agent_id',
    });

  if (error) {
    throw new Error(`Failed to update subscription: ${JSON.stringify(error)}`);
  }

  // If subscription is active, update agent's copilot tier
  if (subscriptionStatus === 'active') {
    await supabase
      .from('agents')
      .update({
        ai_copilot_tier: tier,
        ai_copilot_subscribed_at: new Date().toISOString(),
      } as never)
      .eq('id', agentId);
  }
}

/**
 * Handle subscription cancellation
 */
export async function handleSubscriptionCancelled(
  stripeSubscriptionId: string
): Promise<void> {
  const supabase = createServiceClient();

  // Find subscription
  const { data: subscription } = await supabase
    .from('copilot_subscriptions')
    .select('agent_id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .single() as unknown as { data: { agent_id: string } | null; error: unknown };

  if (!subscription) {
    return; // Already cancelled or doesn't exist
  }

  // Update subscription status
  await supabase
    .from('copilot_subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('stripe_subscription_id', stripeSubscriptionId);

  // Update agent's copilot tier
  await supabase
    .from('agents')
    .update({
      ai_copilot_tier: 'none',
    } as never)
    .eq('id', subscription.agent_id);
}

/**
 * Get today's usage for an agent
 */
export async function getTodayUsage(agentId: string): Promise<number> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('copilot_usage')
    .select('messages_used')
    .eq('agent_id', agentId)
    .eq('date', today)
    .single() as unknown as { data: { messages_used: number } | null; error: unknown };

  return data?.messages_used || 0;
}

/**
 * Increment usage and check limits
 */
export async function incrementUsage(agentId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabase = createServiceClient();

  // Get subscription
  const subscription = await getSubscription(agentId);

  if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trialing')) {
    return { allowed: false, used: 0, limit: 0 };
  }

  // Calculate limit
  let limit: number;
  if (subscription.status === 'trialing') {
    limit = TRIAL_CONFIG.dailyMessageLimit;
  } else {
    const tierConfig = COPILOT_TIERS[subscription.tier];
    limit = tierConfig.dailyMessageLimit || Infinity;
  }

  // Get current usage
  const currentUsage = await getTodayUsage(agentId);

  if (limit !== Infinity && currentUsage >= limit) {
    return { allowed: false, used: currentUsage, limit };
  }

  // Increment usage using database function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('increment_copilot_usage', {
    p_agent_id: agentId,
  }) as { data: number | null; error: unknown };

  const newUsage = data || currentUsage + 1;

  return { allowed: true, used: newUsage, limit };
}

/**
 * Map Stripe subscription status to our status
 */
function mapStripeStatus(stripeStatus: string): 'trialing' | 'active' | 'past_due' | 'cancelled' {
  switch (stripeStatus) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'cancelled':
    case 'incomplete':
    case 'incomplete_expired':
      return 'cancelled';
    default:
      return 'active';
  }
}

/**
 * Check if trial is expired
 */
export function isTrialExpired(subscription: SubscriptionRow): boolean {
  if (subscription.status !== 'trialing') return false;
  if (!subscription.trial_ends_at) return false;

  return new Date(subscription.trial_ends_at) < new Date();
}

/**
 * Get agents with expiring trials (for reminder emails)
 */
export async function getExpiringTrials(daysBeforeExpiry: number): Promise<Array<{ agent_id: string; trial_ends_at: string }>> {
  const supabase = createServiceClient();

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysBeforeExpiry);

  const { data } = await supabase
    .from('copilot_subscriptions')
    .select('agent_id, trial_ends_at')
    .eq('status', 'trialing')
    .lte('trial_ends_at', futureDate.toISOString())
    .gt('trial_ends_at', new Date().toISOString()) as unknown as {
      data: Array<{ agent_id: string; trial_ends_at: string }> | null;
      error: unknown
    };

  return data || [];
}
