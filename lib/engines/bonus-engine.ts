/**
 * Bonus Engine
 * Single source of truth for all bonus calculations
 */

import {
  Phase,
  getCurrentPhase,
  FAST_START_TIERS,
  FAST_START_MAX_REP,
  FAST_START_MAX_SPONSOR,
  FAST_START_WINDOW_DAYS,
  getRankAdvancementBonus,
  getMatchingBonusConfig,
  getCarBonus,
  AI_COPILOT_BONUSES,
  LEADERSHIP_POOL_SHARES,
  LEADERSHIP_POOL_PERCENTAGE,
  LEADERSHIP_POOL_MIN_PHASE,
  CAR_BONUS_MIN_PHASE,
} from '../config/bonuses';
import { Rank } from '../config/ranks';
import { Agent, Bonus, BonusType } from '../types/database';

export interface BonusCalculation {
  type: BonusType;
  amount: number;
  description: string;
  eligible: boolean;
  reason?: string;
}

// ============================================
// FAST START BONUS
// ============================================

export interface FastStartResult {
  eligible: boolean;
  daysRemaining: number;
  currentTier: number;
  repBonus: number;
  sponsorBonus: number;
  nextTier: { threshold: number; repBonus: number } | null;
  premiumNeededForNext: number;
}

export function calculateFastStart(
  agent: Agent,
  premium90Days: number
): FastStartResult {
  const joinDate = new Date(agent.created_at);
  const now = new Date();
  const daysSinceJoin = Math.floor(
    (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(0, FAST_START_WINDOW_DAYS - daysSinceJoin);
  const eligible = daysRemaining > 0;

  // Find current tier
  let currentTier = 0;
  let repBonus = 0;
  let sponsorBonus = 0;

  for (let i = 0; i < FAST_START_TIERS.length; i++) {
    const tier = FAST_START_TIERS[i];
    if (premium90Days >= tier.premiumThreshold) {
      currentTier = i + 1;
      repBonus = Math.min(tier.repBonus, FAST_START_MAX_REP);
      sponsorBonus = Math.min(tier.sponsorBonus, FAST_START_MAX_SPONSOR);
    }
  }

  // Find next tier
  const nextTierIndex = currentTier;
  const nextTier =
    nextTierIndex < FAST_START_TIERS.length
      ? {
          threshold: FAST_START_TIERS[nextTierIndex].premiumThreshold,
          repBonus: FAST_START_TIERS[nextTierIndex].repBonus,
        }
      : null;

  const premiumNeededForNext = nextTier
    ? Math.max(0, nextTier.threshold - premium90Days)
    : 0;

  return {
    eligible,
    daysRemaining,
    currentTier,
    repBonus,
    sponsorBonus,
    nextTier,
    premiumNeededForNext,
  };
}

// ============================================
// RANK ADVANCEMENT BONUS
// ============================================

export function calculateRankAdvancementBonus(
  previousRank: Rank | null,
  newRank: Rank,
  agentCount: number
): BonusCalculation {
  const phase = getCurrentPhase(agentCount);
  const bonusConfig = getRankAdvancementBonus(newRank, phase);

  if (!bonusConfig) {
    return {
      type: 'rank_advancement',
      amount: 0,
      description: `Rank advancement to ${newRank}`,
      eligible: false,
      reason: `Rank advancement bonus not available in Phase ${phase}`,
    };
  }

  return {
    type: 'rank_advancement',
    amount: bonusConfig.amount,
    description: `Rank advancement bonus for reaching ${newRank}`,
    eligible: true,
  };
}

// ============================================
// MATCHING BONUS
// ============================================

export interface MatchingBonusResult {
  eligible: boolean;
  matchPercentage: number;
  monthlyCap: number;
  amountThisMonth: number;
  remainingCap: number;
}

/**
 * Calculate matching bonus
 * FIXED: Now validates firstGenEarnings is non-negative to prevent negative bonuses
 */
export function calculateMatchingBonus(
  agent: Agent,
  firstGenEarnings: number,
  alreadyPaidThisMonth: number,
  agentCount: number
): MatchingBonusResult {
  const phase = getCurrentPhase(agentCount);
  const config = getMatchingBonusConfig(agent.rank, phase);

  if (!config) {
    return {
      eligible: false,
      matchPercentage: 0,
      monthlyCap: 0,
      amountThisMonth: 0,
      remainingCap: 0,
    };
  }

  // FIXED: Ensure firstGenEarnings is non-negative (could be negative after clawbacks)
  const safeEarnings = Math.max(0, firstGenEarnings);

  const potentialMatch = safeEarnings * config.matchPercentage;
  const remainingCap = Math.max(0, config.monthlyCap - alreadyPaidThisMonth);
  const amountThisMonth = Math.min(potentialMatch, remainingCap);

  return {
    eligible: true,
    matchPercentage: config.matchPercentage,
    monthlyCap: config.monthlyCap,
    amountThisMonth,
    remainingCap: remainingCap - amountThisMonth,
  };
}

// ============================================
// CAR BONUS
// ============================================

export function calculateCarBonus(
  agent: Agent,
  agentCount: number
): BonusCalculation {
  const phase = getCurrentPhase(agentCount);
  const amount = getCarBonus(agent.rank, phase);

  if (amount === 0) {
    return {
      type: 'car',
      amount: 0,
      description: 'Car bonus',
      eligible: false,
      reason:
        phase < CAR_BONUS_MIN_PHASE
          ? `Car bonus available in Phase ${CAR_BONUS_MIN_PHASE}+`
          : 'Rank not eligible for car bonus',
    };
  }

  return {
    type: 'car',
    amount,
    description: `Monthly car bonus for ${agent.rank}`,
    eligible: true,
  };
}

// ============================================
// AI COPILOT BONUSES
// ============================================

export function calculateAICopilotBonuses(
  agent: Agent,
  downlineSubscriberCount: number,
  newReferralSubscribed: boolean
): BonusCalculation[] {
  const bonuses: BonusCalculation[] = [];

  // Personal subscription bonus
  if (agent.ai_copilot_tier !== 'none') {
    const config = AI_COPILOT_BONUSES.find(
      (b) => b.id === 'personal_subscription'
    );
    if (config) {
      bonuses.push({
        type: 'ai_copilot_personal',
        amount: config.amount,
        description: config.description,
        eligible: true,
      });
    }
  }

  // Referral bonus
  if (newReferralSubscribed) {
    const config = AI_COPILOT_BONUSES.find((b) => b.id === 'refer_subscriber');
    if (config) {
      bonuses.push({
        type: 'ai_copilot_referral',
        amount: config.amount,
        description: config.description,
        eligible: true,
      });
    }
  }

  // Team milestone bonuses
  const teamMilestones = [
    { id: 'team_5_subscribed', threshold: 5 },
    { id: 'downline_10_subscribed', threshold: 10 },
    { id: 'downline_25_subscribed', threshold: 25 },
  ];

  for (const milestone of teamMilestones) {
    if (downlineSubscriberCount >= milestone.threshold) {
      const config = AI_COPILOT_BONUSES.find((b) => b.id === milestone.id);
      if (config) {
        bonuses.push({
          type: 'ai_copilot_team',
          amount: config.amount,
          description: config.description,
          eligible: true,
        });
      }
    }
  }

  return bonuses;
}

// ============================================
// LEADERSHIP POOL
// ============================================

export interface LeadershipPoolResult {
  eligible: boolean;
  shares: number;
  estimatedPayout: number;
}

export function calculateLeadershipPool(
  agent: Agent,
  totalAICopilotRevenue: number,
  totalShares: number,
  agentCount: number
): LeadershipPoolResult {
  const phase = getCurrentPhase(agentCount);

  if (phase < LEADERSHIP_POOL_MIN_PHASE) {
    return { eligible: false, shares: 0, estimatedPayout: 0 };
  }

  const shareConfig = LEADERSHIP_POOL_SHARES.find(
    (s) => s.rank === agent.rank
  );

  if (!shareConfig) {
    return { eligible: false, shares: 0, estimatedPayout: 0 };
  }

  const poolAmount = totalAICopilotRevenue * LEADERSHIP_POOL_PERCENTAGE;
  const shareValue = totalShares > 0 ? poolAmount / totalShares : 0;
  const estimatedPayout = shareValue * shareConfig.shares;

  return {
    eligible: true,
    shares: shareConfig.shares,
    estimatedPayout,
  };
}

// ============================================
// BONUS SUMMARY
// ============================================

export interface BonusSummary {
  fastStart: FastStartResult;
  rankAdvancement: BonusCalculation | null;
  matching: MatchingBonusResult;
  car: BonusCalculation;
  leadershipPool: LeadershipPoolResult;
  totalEligibleBonuses: number;
}

export function getAgentBonusSummary(
  agent: Agent,
  context: {
    agentCount: number;
    firstGenEarnings: number;
    matchingPaidThisMonth: number;
    totalAICopilotRevenue: number;
    totalLeadershipShares: number;
    previousRank?: Rank | null;
  }
): BonusSummary {
  const fastStart = calculateFastStart(agent, agent.premium_90_days);

  const rankAdvancement = context.previousRank
    ? calculateRankAdvancementBonus(
        context.previousRank,
        agent.rank,
        context.agentCount
      )
    : null;

  const matching = calculateMatchingBonus(
    agent,
    context.firstGenEarnings,
    context.matchingPaidThisMonth,
    context.agentCount
  );

  const car = calculateCarBonus(agent, context.agentCount);

  const leadershipPool = calculateLeadershipPool(
    agent,
    context.totalAICopilotRevenue,
    context.totalLeadershipShares,
    context.agentCount
  );

  const totalEligibleBonuses =
    (fastStart.eligible ? fastStart.repBonus : 0) +
    (rankAdvancement?.eligible ? rankAdvancement.amount : 0) +
    (matching.eligible ? matching.amountThisMonth : 0) +
    (car.eligible ? car.amount : 0) +
    (leadershipPool.eligible ? leadershipPool.estimatedPayout : 0);

  return {
    fastStart,
    rankAdvancement,
    matching,
    car,
    leadershipPool,
    totalEligibleBonuses,
  };
}
