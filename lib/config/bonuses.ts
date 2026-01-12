/**
 * Bonus Configuration
 * All bonus types, amounts, and phase requirements
 */

import { Rank } from './ranks';

// Company phases based on agent count
export const PHASES = [
  { phase: 1, minAgents: 0, maxAgents: 100 },
  { phase: 2, minAgents: 100, maxAgents: 250 },
  { phase: 3, minAgents: 250, maxAgents: 500 },
  { phase: 4, minAgents: 500, maxAgents: Infinity },
] as const;

export type Phase = 1 | 2 | 3 | 4;

export function getCurrentPhase(agentCount: number): Phase {
  if (agentCount < 100) return 1;
  if (agentCount < 250) return 2;
  if (agentCount < 500) return 3;
  return 4;
}

// ============================================
// FAST START BONUS (90 Days) - Phase 1+
// ============================================
export interface FastStartTier {
  premiumThreshold: number;
  repBonus: number;
  sponsorBonus: number;
}

export const FAST_START_TIERS: FastStartTier[] = [
  { premiumThreshold: 10000, repBonus: 50, sponsorBonus: 25 },
  { premiumThreshold: 25000, repBonus: 100, sponsorBonus: 50 },
  { premiumThreshold: 50000, repBonus: 200, sponsorBonus: 75 },
  { premiumThreshold: 100000, repBonus: 400, sponsorBonus: 150 },
];

export const FAST_START_MAX_REP = 750;
export const FAST_START_MAX_SPONSOR = 300;
export const FAST_START_WINDOW_DAYS = 90;

// ============================================
// RANK ADVANCEMENT BONUS - Phase 2+
// ============================================
export interface RankAdvancementBonus {
  rank: Rank;
  amount: number;
  payoutMonths: number; // 0 = immediate, 3 = over 3 months, etc.
  minPhase: Phase;
}

export const RANK_ADVANCEMENT_BONUSES: RankAdvancementBonus[] = [
  { rank: 'associate', amount: 25, payoutMonths: 0, minPhase: 2 },
  { rank: 'sr_associate', amount: 50, payoutMonths: 0, minPhase: 2 },
  { rank: 'agent', amount: 100, payoutMonths: 0, minPhase: 2 },
  { rank: 'sr_agent', amount: 200, payoutMonths: 0, minPhase: 2 },
  { rank: 'mga', amount: 500, payoutMonths: 0, minPhase: 2 },
  { rank: 'associate_mga', amount: 1000, payoutMonths: 3, minPhase: 3 },
  { rank: 'senior_mga', amount: 2000, payoutMonths: 3, minPhase: 3 },
  { rank: 'regional_mga', amount: 3500, payoutMonths: 6, minPhase: 3 },
  { rank: 'national_mga', amount: 5000, payoutMonths: 12, minPhase: 4 },
  { rank: 'executive_mga', amount: 10000, payoutMonths: 12, minPhase: 4 },
  { rank: 'premier_mga', amount: 20000, payoutMonths: 12, minPhase: 4 },
];

// ============================================
// AI COPILOT ADOPTION BONUSES - Phase 1+
// ============================================
export interface AICopilotBonus {
  achievement: string;
  id: string;
  amount: number;
  description: string;
}

export const AI_COPILOT_BONUSES: AICopilotBonus[] = [
  {
    id: 'personal_subscription',
    achievement: 'Personal Subscription',
    amount: 10,
    description: '$10 credit for subscribing to AI Copilot',
  },
  {
    id: 'refer_subscriber',
    achievement: 'Refer Subscribed Rep',
    amount: 25,
    description: '$25 for each recruited rep who subscribes',
  },
  {
    id: 'team_5_subscribed',
    achievement: 'Team 5+ Subscribed',
    amount: 50,
    description: '$50 when 5+ team members subscribed',
  },
  {
    id: 'downline_10_subscribed',
    achievement: '10 Downline Subscribed',
    amount: 200,
    description: '$200 when 10 downline agents subscribed',
  },
  {
    id: 'downline_25_subscribed',
    achievement: '25 Downline Subscribed',
    amount: 500,
    description: '$500 when 25 downline agents subscribed',
  },
];

// ============================================
// MATCHING BONUS - Phase 3+
// ============================================
export interface MatchingBonusConfig {
  rank: Rank;
  matchPercentage: number;
  monthlyCap: number;
  minPhase: Phase;
}

export const MATCHING_BONUS_CONFIG: MatchingBonusConfig[] = [
  { rank: 'sr_agent', matchPercentage: 0.03, monthlyCap: 300, minPhase: 3 },
  { rank: 'mga', matchPercentage: 0.05, monthlyCap: 400, minPhase: 3 },
  { rank: 'associate_mga', matchPercentage: 0.05, monthlyCap: 500, minPhase: 3 },
  { rank: 'senior_mga', matchPercentage: 0.05, monthlyCap: 500, minPhase: 3 },
  { rank: 'regional_mga', matchPercentage: 0.05, monthlyCap: 500, minPhase: 3 },
  { rank: 'national_mga', matchPercentage: 0.05, monthlyCap: 500, minPhase: 3 },
  { rank: 'executive_mga', matchPercentage: 0.05, monthlyCap: 500, minPhase: 3 },
  { rank: 'premier_mga', matchPercentage: 0.05, monthlyCap: 500, minPhase: 3 },
];

// ============================================
// CAR BONUS - Phase 4 (500+ agents)
// ============================================
export interface CarBonusConfig {
  rank: Rank;
  monthlyAmount: number;
}

export const CAR_BONUS_CONFIG: CarBonusConfig[] = [
  { rank: 'regional_mga', monthlyAmount: 300 },
  { rank: 'national_mga', monthlyAmount: 500 },
  { rank: 'executive_mga', monthlyAmount: 750 },
  { rank: 'premier_mga', monthlyAmount: 1000 },
];

export const CAR_BONUS_MIN_PHASE: Phase = 4;

// ============================================
// LEADERSHIP POOL - Phase 4 (500+ agents)
// ============================================
// 1% of AI Copilot revenue distributed by shares

export interface LeadershipPoolShares {
  rank: Rank;
  shares: number;
}

export const LEADERSHIP_POOL_SHARES: LeadershipPoolShares[] = [
  { rank: 'regional_mga', shares: 1 },
  { rank: 'national_mga', shares: 2 },
  { rank: 'executive_mga', shares: 3 },
  { rank: 'premier_mga', shares: 4 },
];

export const LEADERSHIP_POOL_PERCENTAGE = 0.01; // 1% of AI Copilot revenue
export const LEADERSHIP_POOL_MIN_PHASE: Phase = 4;

// ============================================
// CONTESTS
// ============================================
export interface ContestConfig {
  type: 'monthly' | 'quarterly';
  prizes: { place: number; amount: number }[];
  minPhase: Phase;
}

export const CONTEST_CONFIG: ContestConfig[] = [
  {
    type: 'monthly',
    prizes: [
      { place: 1, amount: 200 },
      { place: 2, amount: 100 },
      { place: 3, amount: 50 },
    ],
    minPhase: 1,
  },
  {
    type: 'quarterly',
    prizes: [
      { place: 1, amount: 1000 },
      { place: 2, amount: 500 },
      { place: 3, amount: 250 },
    ],
    minPhase: 3,
  },
];

// ============================================
// AI COPILOT SUBSCRIPTION TIERS
// ============================================
export interface AICopilotTier {
  id: string;
  name: string;
  price: number;
  apexMargin: number;
}

export const AI_COPILOT_TIERS: AICopilotTier[] = [
  { id: 'basic', name: 'Basic', price: 49, apexMargin: 24.5 },
  { id: 'pro', name: 'Pro', price: 99, apexMargin: 49.5 },
  { id: 'agency', name: 'Agency', price: 199, apexMargin: 99.5 },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getRankAdvancementBonus(
  rank: Rank,
  currentPhase: Phase
): RankAdvancementBonus | null {
  const bonus = RANK_ADVANCEMENT_BONUSES.find((b) => b.rank === rank);
  if (!bonus || currentPhase < bonus.minPhase) {
    return null;
  }
  return bonus;
}

export function getMatchingBonusConfig(
  rank: Rank,
  currentPhase: Phase
): MatchingBonusConfig | null {
  const config = MATCHING_BONUS_CONFIG.find((c) => c.rank === rank);
  if (!config || currentPhase < config.minPhase) {
    return null;
  }
  return config;
}

export function getCarBonus(
  rank: Rank,
  currentPhase: Phase
): number {
  if (currentPhase < CAR_BONUS_MIN_PHASE) {
    return 0;
  }
  const config = CAR_BONUS_CONFIG.find((c) => c.rank === rank);
  return config?.monthlyAmount ?? 0;
}

export function getFastStartBonus(
  premium90Days: number
): { repBonus: number; sponsorBonus: number } {
  let repBonus = 0;
  let sponsorBonus = 0;

  for (const tier of FAST_START_TIERS) {
    if (premium90Days >= tier.premiumThreshold) {
      repBonus = tier.repBonus;
      sponsorBonus = tier.sponsorBonus;
    }
  }

  return {
    repBonus: Math.min(repBonus, FAST_START_MAX_REP),
    sponsorBonus: Math.min(sponsorBonus, FAST_START_MAX_SPONSOR),
  };
}
