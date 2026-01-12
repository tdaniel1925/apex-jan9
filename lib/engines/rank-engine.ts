/**
 * Rank Engine
 * Single source of truth for all rank calculations
 */

import {
  Rank,
  RANK_CONFIG,
  RANKS,
  getNextRank,
  isRankHigherOrEqual,
  isMGATier,
} from '../config/ranks';
import { Agent } from '../types/database';

export interface RankEligibility {
  rank: Rank;
  eligible: boolean;
  requirements: {
    premium90Days: { required: number; current: number; met: boolean };
    activeAgents: { required: number; current: number; met: boolean };
    personalRecruits: { required: number; current: number; met: boolean };
    mgasInDownline?: { required: number; current: number; met: boolean };
    persistency: { required: number; current: number; met: boolean };
    placement: { required: number; current: number; met: boolean };
  };
}

export interface RankProgress {
  currentRank: Rank;
  nextRank: Rank | null;
  progressToNext: number; // 0-100 percentage
  eligibility: RankEligibility | null;
}

/**
 * Calculate the highest rank an agent qualifies for
 */
export function calculateRank(agent: Agent): Rank {
  let qualifiedRank: Rank = 'pre_associate';

  // Check each rank from lowest to highest
  for (const rank of RANKS) {
    const eligibility = checkRankEligibility(agent, rank);
    if (eligibility.eligible) {
      qualifiedRank = rank;
    } else {
      // Stop checking higher ranks once we hit one they don't qualify for
      // (unless it's an MGA tier - they might skip lower MGA tiers)
      if (!isMGATier(rank)) {
        break;
      }
    }
  }

  return qualifiedRank;
}

/**
 * Check if an agent is eligible for a specific rank
 */
export function checkRankEligibility(agent: Agent, rank: Rank): RankEligibility {
  const config = RANK_CONFIG[rank];
  const req = config.requirements;

  // Check each requirement
  const premium90Days = {
    required: req.premium90Days,
    current: agent.premium_90_days,
    met: agent.premium_90_days >= req.premium90Days,
  };

  const activeAgents = {
    required: req.activeAgents,
    current: agent.active_agents_count,
    met: agent.active_agents_count >= req.activeAgents,
  };

  const personalRecruits = {
    required: req.personalRecruits,
    current: agent.personal_recruits_count,
    met: agent.personal_recruits_count >= req.personalRecruits,
  };

  const persistency = {
    required: config.persistencyRequired,
    current: agent.persistency_rate,
    met: config.persistencyRequired === 0 || agent.persistency_rate >= config.persistencyRequired,
  };

  const placement = {
    required: config.placementRequired,
    current: agent.placement_rate,
    met: config.placementRequired === 0 || agent.placement_rate >= config.placementRequired,
  };

  // Check MGA tier requirement if applicable
  let mgasInDownline: RankEligibility['requirements']['mgasInDownline'];
  if (req.mgasInDownline !== undefined) {
    mgasInDownline = {
      required: req.mgasInDownline,
      current: agent.mgas_in_downline,
      met: agent.mgas_in_downline >= req.mgasInDownline,
    };
  }

  // All requirements must be met
  const eligible =
    premium90Days.met &&
    activeAgents.met &&
    personalRecruits.met &&
    persistency.met &&
    placement.met &&
    (mgasInDownline === undefined || mgasInDownline.met);

  return {
    rank,
    eligible,
    requirements: {
      premium90Days,
      activeAgents,
      personalRecruits,
      mgasInDownline,
      persistency,
      placement,
    },
  };
}

/**
 * Get progress towards next rank
 */
export function getRankProgress(agent: Agent): RankProgress {
  const currentRank = agent.rank;
  const nextRank = getNextRank(currentRank);

  if (!nextRank) {
    return {
      currentRank,
      nextRank: null,
      progressToNext: 100,
      eligibility: null,
    };
  }

  const eligibility = checkRankEligibility(agent, nextRank);
  const progress = calculateProgressPercentage(eligibility);

  return {
    currentRank,
    nextRank,
    progressToNext: progress,
    eligibility,
  };
}

/**
 * Calculate overall progress percentage to next rank
 */
function calculateProgressPercentage(eligibility: RankEligibility): number {
  const requirements = eligibility.requirements;
  const factors: number[] = [];

  // Premium progress
  if (requirements.premium90Days.required > 0) {
    factors.push(
      Math.min(100, (requirements.premium90Days.current / requirements.premium90Days.required) * 100)
    );
  }

  // Active agents progress
  if (requirements.activeAgents.required > 0) {
    factors.push(
      Math.min(100, (requirements.activeAgents.current / requirements.activeAgents.required) * 100)
    );
  }

  // Personal recruits progress
  if (requirements.personalRecruits.required > 0) {
    factors.push(
      Math.min(100, (requirements.personalRecruits.current / requirements.personalRecruits.required) * 100)
    );
  }

  // MGAs in downline progress
  if (requirements.mgasInDownline && requirements.mgasInDownline.required > 0) {
    factors.push(
      Math.min(100, (requirements.mgasInDownline.current / requirements.mgasInDownline.required) * 100)
    );
  }

  // Average all factors
  if (factors.length === 0) {
    return 100;
  }

  return Math.round(factors.reduce((a, b) => a + b, 0) / factors.length);
}

/**
 * Check if agent should be promoted
 */
export function shouldPromote(agent: Agent): { shouldPromote: boolean; newRank: Rank | null } {
  const calculatedRank = calculateRank(agent);
  const currentOrder = RANK_CONFIG[agent.rank].order;
  const calculatedOrder = RANK_CONFIG[calculatedRank].order;

  if (calculatedOrder > currentOrder) {
    return { shouldPromote: true, newRank: calculatedRank };
  }

  return { shouldPromote: false, newRank: null };
}

/**
 * Check if agent should be demoted
 * Note: Typically MLMs don't demote, but this is here if needed
 */
export function shouldDemote(agent: Agent): { shouldDemote: boolean; newRank: Rank | null } {
  const calculatedRank = calculateRank(agent);
  const currentOrder = RANK_CONFIG[agent.rank].order;
  const calculatedOrder = RANK_CONFIG[calculatedRank].order;

  if (calculatedOrder < currentOrder) {
    return { shouldDemote: true, newRank: calculatedRank };
  }

  return { shouldDemote: false, newRank: null };
}

/**
 * Get all ranks below a given rank
 */
export function getRanksBelow(rank: Rank): Rank[] {
  const order = RANK_CONFIG[rank].order;
  return RANKS.filter((r) => RANK_CONFIG[r].order < order);
}

/**
 * Get all ranks above a given rank
 */
export function getRanksAbove(rank: Rank): Rank[] {
  const order = RANK_CONFIG[rank].order;
  return RANKS.filter((r) => RANK_CONFIG[r].order > order);
}
