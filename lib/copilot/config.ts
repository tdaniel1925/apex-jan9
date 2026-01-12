/**
 * Copilot Configuration
 * Pricing tiers, limits, and Stripe product configuration
 */

export type CopilotTier = 'basic' | 'pro' | 'agency';

export interface CopilotTierConfig {
  tier: CopilotTier;
  name: string;
  priceCents: number;
  bonusVolume: number;
  dailyMessageLimit: number | null; // null = unlimited
  features: string[];
}

export const COPILOT_TIERS: Record<CopilotTier, CopilotTierConfig> = {
  basic: {
    tier: 'basic',
    name: 'Basic',
    priceCents: 2900, // $29/month
    bonusVolume: 20,
    dailyMessageLimit: 50,
    features: [
      'AI-powered insurance assistant',
      '50 messages per day',
      'Product recommendations',
      'Client communication templates',
    ],
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    priceCents: 7900, // $79/month
    bonusVolume: 60,
    dailyMessageLimit: 200,
    features: [
      'Everything in Basic',
      '200 messages per day',
      'Advanced product matching',
      'Policy comparison tools',
      'Priority support',
    ],
  },
  agency: {
    tier: 'agency',
    name: 'Agency',
    priceCents: 19900, // $199/month
    bonusVolume: 150,
    dailyMessageLimit: null, // Unlimited
    features: [
      'Everything in Pro',
      'Unlimited messages',
      'Team collaboration',
      'Custom training',
      'Dedicated support',
      'API access',
    ],
  },
};

// Trial configuration
export const TRIAL_CONFIG = {
  durationDays: 7,
  dailyMessageLimit: 20,
};

// Get Stripe Price ID for a tier
export function getStripePriceId(tier: CopilotTier): string {
  const priceIds: Record<CopilotTier, string | undefined> = {
    basic: process.env.STRIPE_COPILOT_BASIC_PRICE_ID,
    pro: process.env.STRIPE_COPILOT_PRO_PRICE_ID,
    agency: process.env.STRIPE_COPILOT_AGENCY_PRICE_ID,
  };

  const priceId = priceIds[tier];
  if (!priceId) {
    throw new Error(`Missing Stripe price ID for tier: ${tier}`);
  }

  return priceId;
}

// Get tier config from Stripe Price ID
export function getTierFromPriceId(priceId: string): CopilotTier | null {
  if (priceId === process.env.STRIPE_COPILOT_BASIC_PRICE_ID) return 'basic';
  if (priceId === process.env.STRIPE_COPILOT_PRO_PRICE_ID) return 'pro';
  if (priceId === process.env.STRIPE_COPILOT_AGENCY_PRICE_ID) return 'agency';
  return null;
}

// Calculate daily message limit based on subscription status
export function getDailyMessageLimit(
  subscription: { status: string; tier: CopilotTier } | null
): number {
  if (!subscription) {
    return 0; // No subscription = no access
  }

  if (subscription.status === 'trialing') {
    return TRIAL_CONFIG.dailyMessageLimit;
  }

  if (subscription.status === 'active') {
    const tierConfig = COPILOT_TIERS[subscription.tier];
    return tierConfig.dailyMessageLimit ?? Infinity;
  }

  return 0; // past_due or cancelled
}
