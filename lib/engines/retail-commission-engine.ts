/**
 * Retail Commission Engine
 * Calculates commissions from digital product sales
 */

import { Agent, Product, Order, CommissionInsert } from '../types/database';
import { Rank } from '../config/ranks';

// Commission rates for retail products by rank
const RETAIL_COMMISSION_RATES: Record<Rank, number> = {
  pre_associate: 0.10, // 10%
  associate: 0.12, // 12%
  sr_associate: 0.13, // 13%
  agent: 0.15, // 15%
  sr_agent: 0.17, // 17%
  mga: 0.20, // 20%
  associate_mga: 0.22, // 22%
  senior_mga: 0.25, // 25%
  regional_mga: 0.27, // 27%
  national_mga: 0.30, // 30%
  executive_mga: 0.32, // 32%
  premier_mga: 0.35, // 35%
};

export interface RetailCommissionInput {
  order: Order;
  agent: Agent;
}

/**
 * Calculate commission for a retail sale
 * Returns commission record ready to insert
 */
export function calculateRetailCommission(
  input: RetailCommissionInput
): CommissionInsert {
  const { order, agent } = input;

  // Get commission rate based on agent's rank
  const commissionRate = RETAIL_COMMISSION_RATES[agent.rank];

  // Calculate commission amount (based on total order amount)
  const commissionAmount = order.total_amount * commissionRate;

  // Create commission record
  const commission: CommissionInsert = {
    agent_id: agent.id,
    carrier: 'retail',
    policy_number: `RET-${order.id.substring(0, 8)}`, // First 8 chars of order ID
    premium_amount: order.total_amount,
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    policy_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    status: 'pending',
    source: 'retail',
    order_id: order.id,
    bonus_volume: order.total_bonus_volume,
  };

  return commission;
}

/**
 * Get retail commission rate for a specific rank
 */
export function getRetailCommissionRate(rank: Rank): number {
  return RETAIL_COMMISSION_RATES[rank];
}

/**
 * Calculate total payout for retail sale (commission + overrides)
 * This is for display/preview purposes only
 */
export function calculateRetailPayout(order: Order, agentRank: Rank): {
  directCommission: number;
  totalPayout: number; // Includes est. overrides
  commissionRate: number;
} {
  const rate = getRetailCommissionRate(agentRank);
  const directCommission = order.total_amount * rate;

  // Estimate override total (6-gen averages ~27.5% of BV)
  const estimatedOverrides = order.total_bonus_volume * 0.275;

  return {
    directCommission,
    totalPayout: directCommission + estimatedOverrides,
    commissionRate: rate,
  };
}
