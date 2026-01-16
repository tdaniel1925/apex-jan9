/**
 * Override Engine
 * Single source of truth for 6-generation override calculations
 */

import {
  MAX_GENERATIONS,
  GENERATION_OVERRIDES,
  getOverridePercentage,
} from '../config/overrides';
import { Commission, Override, Agent } from '../types/database';

export interface OverrideCalculation {
  generation: number;
  agentId: string;
  agentName: string;
  overrideRate: number;
  overrideAmount: number;
}

export interface OverrideChainResult {
  sourceAgentId: string;
  commissionId: string;
  commissionAmount: number;
  overrides: OverrideCalculation[];
  totalOverrides: number;
}

/**
 * Calculate all 6-generation overrides for a commission
 * @param commission The commission that triggers overrides
 * @param upline Array of agents in upline (index 0 = direct sponsor, index 5 = 6th gen)
 */
export function calculateOverrideChain(
  commission: Commission,
  upline: { id: string; firstName: string; lastName: string }[]
): OverrideChainResult {
  const overrides: OverrideCalculation[] = [];
  let totalOverrides = 0;

  // Calculate override for each generation (up to 6)
  for (let gen = 1; gen <= Math.min(upline.length, MAX_GENERATIONS); gen++) {
    const sponsor = upline[gen - 1];
    const overrideRate = getOverridePercentage(gen);
    const overrideAmount = commission.commission_amount * overrideRate;

    overrides.push({
      generation: gen,
      agentId: sponsor.id,
      agentName: `${sponsor.firstName} ${sponsor.lastName}`,
      overrideRate,
      overrideAmount,
    });

    totalOverrides += overrideAmount;
  }

  return {
    sourceAgentId: commission.agent_id,
    commissionId: commission.id,
    commissionAmount: commission.commission_amount,
    overrides,
    totalOverrides,
  };
}

/**
 * Create override records ready for database insertion
 */
export function createOverrideRecords(
  commission: Commission,
  upline: { id: string }[]
): Omit<Override, 'id' | 'created_at'>[] {
  const records: Omit<Override, 'id' | 'created_at'>[] = [];

  for (let gen = 1; gen <= Math.min(upline.length, MAX_GENERATIONS); gen++) {
    const sponsor = upline[gen - 1];
    const overrideRate = getOverridePercentage(gen);
    const overrideAmount = commission.commission_amount * overrideRate;

    records.push({
      commission_id: commission.id,
      agent_id: sponsor.id,
      source_agent_id: commission.agent_id,
      generation: gen,
      override_rate: overrideRate,
      override_amount: overrideAmount,
      status: 'pending',
      // Roll-up tracking fields (defaults for normal overrides)
      is_rolled_up: false,
      roll_up_reason: null,
      original_agent_id: null,
      rolled_up_from_generation: null,
      compliance_log_id: null,
      notes: null,
    });
  }

  return records;
}

/**
 * Calculate total overrides an agent would receive from a downline commission
 */
export function calculateAgentOverride(
  commissionAmount: number,
  generation: number
): number {
  if (generation < 1 || generation > MAX_GENERATIONS) {
    return 0;
  }
  const rate = getOverridePercentage(generation);
  return commissionAmount * rate;
}

/**
 * Get override breakdown for display
 */
export function getOverrideBreakdown(): {
  generation: number;
  percentage: string;
  cumulative: string;
}[] {
  return GENERATION_OVERRIDES.map((gen) => ({
    generation: gen.generation,
    percentage: `${(gen.percentage * 100).toFixed(1)}%`,
    cumulative: `${(gen.cumulativePercentage * 100).toFixed(1)}%`,
  }));
}

/**
 * Calculate total potential overrides from a commission
 */
export function calculateTotalPotentialOverrides(commissionAmount: number): number {
  return GENERATION_OVERRIDES.reduce(
    (total, gen) => total + commissionAmount * gen.percentage,
    0
  );
}

/**
 * Determine which generation a sponsor is relative to an agent
 * @param agentPath Materialized path of the agent (e.g., "1.5.23.45")
 * @param sponsorPath Materialized path of the potential sponsor
 * @returns Generation number (1-6) or 0 if not in override range
 */
export function determineGeneration(
  agentPath: string,
  sponsorPath: string
): number {
  // The sponsor path should be a prefix of the agent path
  if (!agentPath.startsWith(sponsorPath)) {
    return 0;
  }

  // Count the levels between them
  const agentLevels = agentPath.split('.').length;
  const sponsorLevels = sponsorPath.split('.').length;
  const generation = agentLevels - sponsorLevels;

  if (generation >= 1 && generation <= MAX_GENERATIONS) {
    return generation;
  }

  return 0;
}
