/**
 * Clawback Engine
 * Handles commission reversals when refunds, chargebacks, or cancellations occur
 *
 * This engine:
 * 1. Reverses original commission
 * 2. Reverses all related overrides (6 generations)
 * 3. Reverses any bonuses triggered by the commission
 * 4. Debits wallets
 * 5. Re-evaluates rank if volume drops
 */

import { Commission, Override, Bonus, Agent } from '../types/database';
import { shouldDemote } from './rank-engine';

export type ClawbackReason =
  | 'refund'
  | 'chargeback'
  | 'subscription_cancelled'
  | 'order_cancelled'
  | 'compliance_violation'
  | 'fraud'
  | 'policy_lapse'
  | 'admin_adjustment';

export interface ClawbackEvent {
  type: ClawbackReason;
  commissionId: string;
  reason: string;
  initiatedBy: string; // admin user ID or 'system'
  partialAmount?: number; // For partial refunds
}

export interface ClawbackResult {
  success: boolean;
  commissionReversed: {
    id: string;
    amount: number;
  } | null;
  overridesReversed: {
    id: string;
    agentId: string;
    amount: number;
    generation: number;
  }[];
  bonusesReversed: {
    id: string;
    type: string;
    amount: number;
  }[];
  walletsDebited: {
    agentId: string;
    amount: number;
    category: string;
  }[];
  rankDemoted: boolean;
  newRank?: string;
  errors: string[];
}

export interface ClawbackRecord {
  id?: string;
  commission_id: string;
  clawback_type: ClawbackReason;
  original_amount: number;
  clawback_amount: number;
  reason: string;
  initiated_by: string;
  status: 'pending' | 'processed' | 'failed';
  processed_at?: string;
  created_at?: string;
}

/**
 * Calculate clawback amounts for a commission
 * Supports partial refunds
 */
export function calculateClawbackAmounts(
  commission: Commission,
  overrides: Override[],
  partialPercentage: number = 1.0 // 1.0 = full refund, 0.5 = 50% refund
): {
  commissionClawback: number;
  overrideClawbacks: { overrideId: string; agentId: string; amount: number; generation: number }[];
  totalClawback: number;
} {
  // Clawback commission proportionally
  const commissionClawback = commission.commission_amount * partialPercentage;

  // Clawback overrides proportionally
  const overrideClawbacks = overrides.map((override) => ({
    overrideId: override.id,
    agentId: override.agent_id,
    amount: override.override_amount * partialPercentage,
    generation: override.generation,
  }));

  const totalClawback = commissionClawback + overrideClawbacks.reduce(
    (sum, o) => sum + o.amount,
    0
  );

  return {
    commissionClawback,
    overrideClawbacks,
    totalClawback,
  };
}

/**
 * Create clawback record for audit trail
 */
export function createClawbackRecord(
  event: ClawbackEvent,
  commission: Commission,
  clawbackAmount: number
): ClawbackRecord {
  return {
    commission_id: event.commissionId,
    clawback_type: event.type,
    original_amount: commission.commission_amount,
    clawback_amount: clawbackAmount,
    reason: event.reason,
    initiated_by: event.initiatedBy,
    status: 'pending',
  };
}

/**
 * Create wallet debit transactions for clawbacks
 */
export function createClawbackDebitTransactions(
  agentId: string,
  currentBalance: number,
  clawbackAmount: number,
  category: 'commission' | 'override' | 'bonus',
  description: string,
  referenceId: string
): {
  transaction: {
    agent_id: string;
    type: 'debit';
    category: typeof category;
    amount: number;
    balance_after: number;
    description: string;
    reference_type: 'clawback';
    reference_id: string;
  };
  newBalance: number;
} {
  const newBalance = currentBalance - clawbackAmount;

  return {
    transaction: {
      agent_id: agentId,
      type: 'debit',
      category,
      amount: clawbackAmount,
      balance_after: Math.max(0, newBalance), // Don't go negative
      description,
      reference_type: 'clawback',
      reference_id: referenceId,
    },
    newBalance: Math.max(0, newBalance),
  };
}

/**
 * Check if agent should be demoted after clawback
 * Re-evaluates rank based on updated metrics
 */
export function checkDemotionAfterClawback(
  agent: Agent,
  clawbackBV: number
): { shouldDemote: boolean; newRank: string | null } {
  // Create a mock agent with reduced BV to check demotion
  const updatedAgent: Agent = {
    ...agent,
    personal_bonus_volume: Math.max(0, agent.personal_bonus_volume - clawbackBV),
    pbv_90_days: Math.max(0, agent.pbv_90_days - clawbackBV),
  };

  const demotionResult = shouldDemote(updatedAgent);

  return {
    shouldDemote: demotionResult.shouldDemote,
    newRank: demotionResult.newRank,
  };
}

/**
 * Determine which bonuses should be clawed back
 * Based on the commission that triggered them
 */
export function identifyRelatedBonuses(
  bonuses: Bonus[],
  commissionId: string,
  agentId: string
): Bonus[] {
  return bonuses.filter((bonus) => {
    // Direct reference to the commission
    if (bonus.reference_id === commissionId) {
      return true;
    }

    // Fast start bonuses for the agent (if commission contributed to threshold)
    if (
      bonus.agent_id === agentId &&
      (bonus.bonus_type === 'fast_start' || bonus.bonus_type === 'fast_start_sponsor')
    ) {
      return true;
    }

    return false;
  });
}

/**
 * Calculate the clawback priority order
 * Higher priority items are clawed back first
 */
export function getClawbackPriority(type: ClawbackReason): number {
  const priorities: Record<ClawbackReason, number> = {
    fraud: 1,
    compliance_violation: 2,
    chargeback: 3,
    refund: 4,
    subscription_cancelled: 5,
    order_cancelled: 6,
    policy_lapse: 7,
    admin_adjustment: 8,
  };

  return priorities[type];
}

/**
 * Validate if clawback can be processed
 * Checks various conditions before allowing clawback
 */
export function validateClawback(
  commission: Commission,
  event: ClawbackEvent
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Can't clawback already reversed commission
  if (commission.status === 'reversed') {
    errors.push('Commission has already been reversed');
  }

  // Partial clawback validation
  if (event.partialAmount !== undefined) {
    if (event.partialAmount <= 0) {
      errors.push('Partial clawback amount must be positive');
    }
    if (event.partialAmount > commission.commission_amount) {
      errors.push('Partial clawback amount cannot exceed original commission');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format clawback summary for audit/notification
 */
export function formatClawbackSummary(result: ClawbackResult): string {
  const lines: string[] = [
    'CLAWBACK SUMMARY',
    '================',
  ];

  if (result.commissionReversed) {
    lines.push(
      `Commission Reversed: $${result.commissionReversed.amount.toFixed(2)}`
    );
  }

  if (result.overridesReversed.length > 0) {
    const totalOverrides = result.overridesReversed.reduce(
      (sum, o) => sum + o.amount,
      0
    );
    lines.push(
      `Overrides Reversed: ${result.overridesReversed.length} (Total: $${totalOverrides.toFixed(2)})`
    );
  }

  if (result.bonusesReversed.length > 0) {
    const totalBonuses = result.bonusesReversed.reduce(
      (sum, b) => sum + b.amount,
      0
    );
    lines.push(
      `Bonuses Reversed: ${result.bonusesReversed.length} (Total: $${totalBonuses.toFixed(2)})`
    );
  }

  if (result.rankDemoted && result.newRank) {
    lines.push(`Rank Demoted To: ${result.newRank}`);
  }

  if (result.errors.length > 0) {
    lines.push('');
    lines.push('Errors:');
    result.errors.forEach((e) => lines.push(`  - ${e}`));
  }

  return lines.join('\n');
}
