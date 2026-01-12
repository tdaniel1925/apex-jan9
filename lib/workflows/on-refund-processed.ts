/**
 * Workflow: On Refund Processed
 *
 * This workflow runs when a refund, chargeback, or cancellation occurs.
 * It handles ALL clawback effects:
 * 1. Validate the clawback can proceed
 * 2. Reverse original commission
 * 3. Reverse all related overrides (6 generations)
 * 4. Reverse any triggered bonuses
 * 5. Debit wallets
 * 6. Check for rank demotion
 * 7. Create audit trail
 */

import { createAdminClient } from '../db/supabase-server';
import { Commission, Override, Bonus, Agent, Wallet } from '../types/database';
import { Rank } from '../config/ranks';
import {
  ClawbackEvent,
  ClawbackResult,
  calculateClawbackAmounts,
  createClawbackRecord,
  createClawbackDebitTransactions,
  checkDemotionAfterClawback,
  identifyRelatedBonuses,
  validateClawback,
  formatClawbackSummary,
} from '../engines/clawback-engine';
import { onRankChanged } from './on-rank-changed';

export interface RefundProcessedEvent {
  commissionId: string;
  reason: 'refund' | 'chargeback' | 'subscription_cancelled' | 'order_cancelled' | 'policy_lapse' | 'compliance_violation' | 'fraud' | 'admin_adjustment';
  description: string;
  initiatedBy: string;
  partialAmount?: number; // Optional for partial refunds
}

export interface RefundProcessedResult {
  success: boolean;
  clawbackResult: ClawbackResult | null;
  summary: string;
  errors: string[];
}

export async function onRefundProcessed(
  event: RefundProcessedEvent
): Promise<RefundProcessedResult> {
  const supabase = createAdminClient();
  const errors: string[] = [];

  try {
    // ================================================
    // 1. FETCH COMMISSION AND VALIDATE
    // ================================================
    const { data: commissionData, error: commissionError } = await supabase
      .from('commissions')
      .select('*')
      .eq('id', event.commissionId)
      .single();

    if (commissionError || !commissionData) {
      return {
        success: false,
        clawbackResult: null,
        summary: '',
        errors: [`Commission not found: ${event.commissionId}`],
      };
    }

    const commission = commissionData as Commission;

    // Create clawback event
    const clawbackEvent: ClawbackEvent = {
      type: event.reason,
      commissionId: event.commissionId,
      reason: event.description,
      initiatedBy: event.initiatedBy,
      partialAmount: event.partialAmount,
    };

    // Validate the clawback
    const validation = validateClawback(commission, clawbackEvent);
    if (!validation.valid) {
      return {
        success: false,
        clawbackResult: null,
        summary: '',
        errors: validation.errors,
      };
    }

    // ================================================
    // 2. FETCH RELATED DATA
    // ================================================
    // Get the agent
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', commission.agent_id)
      .single();

    if (agentError || !agentData) {
      errors.push(`Agent not found: ${commission.agent_id}`);
    }

    const agent = agentData as Agent | null;

    // Get related overrides
    const { data: overridesData } = await supabase
      .from('overrides')
      .select('*')
      .eq('commission_id', commission.id);

    const overrides = (overridesData || []) as Override[];

    // Get related bonuses
    const { data: bonusesData } = await supabase
      .from('bonuses')
      .select('*')
      .or(`reference_id.eq.${commission.id},agent_id.eq.${commission.agent_id}`);

    const bonuses = (bonusesData || []) as Bonus[];
    const relatedBonuses = identifyRelatedBonuses(bonuses, commission.id, commission.agent_id);

    // ================================================
    // 3. CALCULATE CLAWBACK AMOUNTS
    // ================================================
    const partialPercentage = event.partialAmount
      ? event.partialAmount / commission.commission_amount
      : 1.0;

    const clawbackAmounts = calculateClawbackAmounts(
      commission,
      overrides,
      partialPercentage
    );

    // Initialize result
    const clawbackResult: ClawbackResult = {
      success: true,
      commissionReversed: null,
      overridesReversed: [],
      bonusesReversed: [],
      walletsDebited: [],
      rankDemoted: false,
      errors: [],
    };

    // ================================================
    // 4. CREATE CLAWBACK RECORD (AUDIT TRAIL)
    // ================================================
    const clawbackRecord = createClawbackRecord(
      clawbackEvent,
      commission,
      clawbackAmounts.commissionClawback
    );

    const { data: insertedClawback, error: clawbackError } = await supabase
      .from('clawbacks')
      .insert(clawbackRecord as never)
      .select()
      .single();

    if (clawbackError) {
      errors.push(`Failed to create clawback record: ${clawbackError.message}`);
    }

    const clawbackId = (insertedClawback as { id: string } | null)?.id || 'unknown';

    // ================================================
    // 5. REVERSE COMMISSION
    // ================================================
    // Mark commission as reversed
    const { error: commissionUpdateError } = await supabase
      .from('commissions')
      .update({
        status: 'reversed',
      } as never)
      .eq('id', commission.id);

    if (commissionUpdateError) {
      errors.push(`Failed to update commission: ${commissionUpdateError.message}`);
    } else {
      clawbackResult.commissionReversed = {
        id: commission.id,
        amount: clawbackAmounts.commissionClawback,
      };
    }

    // Debit agent's wallet for commission
    if (agent) {
      await debitWallet(
        supabase,
        agent.id,
        clawbackAmounts.commissionClawback,
        'commission',
        `Clawback: ${event.reason} - Commission reversed`,
        clawbackId,
        clawbackResult
      );
    }

    // ================================================
    // 6. REVERSE OVERRIDES
    // ================================================
    for (const overrideClawback of clawbackAmounts.overrideClawbacks) {
      // Mark override as reversed
      const { error: overrideError } = await supabase
        .from('overrides')
        .update({
          status: 'reversed',
        } as never)
        .eq('id', overrideClawback.overrideId);

      if (overrideError) {
        errors.push(`Failed to reverse override ${overrideClawback.overrideId}`);
      } else {
        clawbackResult.overridesReversed.push({
          id: overrideClawback.overrideId,
          agentId: overrideClawback.agentId,
          amount: overrideClawback.amount,
          generation: overrideClawback.generation,
        });
      }

      // Debit upline agent's wallet
      await debitWallet(
        supabase,
        overrideClawback.agentId,
        overrideClawback.amount,
        'override',
        `Clawback: ${event.reason} - Gen ${overrideClawback.generation} override reversed`,
        clawbackId,
        clawbackResult
      );
    }

    // ================================================
    // 7. REVERSE BONUSES
    // ================================================
    for (const bonus of relatedBonuses) {
      const bonusClawbackAmount = bonus.amount * partialPercentage;

      // Mark bonus as reversed
      const { error: bonusError } = await supabase
        .from('bonuses')
        .update({
          status: 'reversed',
          description: `${bonus.description} [REVERSED - ${event.reason}]`,
        } as never)
        .eq('id', bonus.id);

      if (bonusError) {
        errors.push(`Failed to reverse bonus ${bonus.id}`);
      } else {
        clawbackResult.bonusesReversed.push({
          id: bonus.id,
          type: bonus.bonus_type,
          amount: bonusClawbackAmount,
        });
      }

      // Debit agent's wallet for bonus
      await debitWallet(
        supabase,
        bonus.agent_id,
        bonusClawbackAmount,
        'bonus',
        `Clawback: ${event.reason} - ${bonus.bonus_type} bonus reversed`,
        clawbackId,
        clawbackResult
      );
    }

    // ================================================
    // 8. UPDATE AGENT METRICS
    // ================================================
    if (agent) {
      const bvToDeduct = (commission.bonus_volume || 0) * partialPercentage;

      const { error: metricsError } = await supabase
        .from('agents')
        .update({
          personal_bonus_volume: Math.max(0, agent.personal_bonus_volume - bvToDeduct),
          pbv_90_days: Math.max(0, agent.pbv_90_days - bvToDeduct),
        } as never)
        .eq('id', agent.id);

      if (metricsError) {
        errors.push(`Failed to update agent metrics: ${metricsError.message}`);
      }

      // ================================================
      // 9. CHECK FOR RANK DEMOTION
      // ================================================
      const demotionCheck = checkDemotionAfterClawback(agent, bvToDeduct);

      if (demotionCheck.shouldDemote && demotionCheck.newRank) {
        const { error: rankError } = await supabase
          .from('agents')
          .update({ rank: demotionCheck.newRank } as never)
          .eq('id', agent.id);

        if (rankError) {
          errors.push(`Failed to demote rank: ${rankError.message}`);
        } else {
          clawbackResult.rankDemoted = true;
          clawbackResult.newRank = demotionCheck.newRank;

          // Trigger rank changed workflow
          await onRankChanged({
            agent: { ...agent, rank: demotionCheck.newRank as Rank },
            previousRank: agent.rank as Rank,
            newRank: demotionCheck.newRank as Rank,
          });
        }
      }
    }

    // ================================================
    // 10. UPDATE CLAWBACK RECORD STATUS
    // ================================================
    await supabase
      .from('clawbacks')
      .update({
        status: errors.length === 0 ? 'processed' : 'failed',
        processed_at: new Date().toISOString(),
      } as never)
      .eq('id', clawbackId);

    // Add any errors to result
    clawbackResult.errors = errors;
    clawbackResult.success = errors.length === 0;

    // Generate summary
    const summary = formatClawbackSummary(clawbackResult);

    return {
      success: errors.length === 0,
      clawbackResult,
      summary,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      clawbackResult: null,
      summary: '',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Helper function to debit wallet and track result
 */
async function debitWallet(
  supabase: ReturnType<typeof createAdminClient>,
  agentId: string,
  amount: number,
  category: 'commission' | 'override' | 'bonus',
  description: string,
  clawbackId: string,
  result: ClawbackResult
): Promise<void> {
  // Get current wallet
  const { data: walletData, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (walletError || !walletData) {
    result.errors.push(`Wallet not found for agent ${agentId}`);
    return;
  }

  const wallet = walletData as Wallet;

  // Calculate new balance (allow negative for clawback tracking)
  const debitInfo = createClawbackDebitTransactions(
    agentId,
    wallet.balance,
    amount,
    category,
    description,
    clawbackId
  );

  // Update wallet
  const { error: updateError } = await supabase
    .from('wallets')
    .update({
      balance: debitInfo.newBalance,
    } as never)
    .eq('agent_id', agentId);

  if (updateError) {
    result.errors.push(`Failed to debit wallet: ${updateError.message}`);
    return;
  }

  // Create transaction record
  const { error: txError } = await supabase
    .from('wallet_transactions')
    .insert(debitInfo.transaction as never);

  if (txError) {
    result.errors.push(`Failed to create debit transaction: ${txError.message}`);
    return;
  }

  // Track in result
  result.walletsDebited.push({
    agentId,
    amount,
    category,
  });
}

/**
 * Quick helper to process a simple refund by order ID
 */
export async function processOrderRefund(
  orderId: string,
  reason: string,
  initiatedBy: string,
  partialAmount?: number
): Promise<RefundProcessedResult> {
  const supabase = createAdminClient();

  // Find commission by order ID
  const { data: commission, error } = await supabase
    .from('commissions')
    .select('id')
    .eq('order_id', orderId)
    .single();

  if (error || !commission) {
    return {
      success: false,
      clawbackResult: null,
      summary: '',
      errors: [`No commission found for order: ${orderId}`],
    };
  }

  return onRefundProcessed({
    commissionId: (commission as { id: string }).id,
    reason: 'refund',
    description: reason,
    initiatedBy,
    partialAmount,
  });
}

/**
 * Quick helper to process a chargeback by commission ID
 */
export async function processChargeback(
  commissionId: string,
  reason: string,
  initiatedBy: string
): Promise<RefundProcessedResult> {
  return onRefundProcessed({
    commissionId,
    reason: 'chargeback',
    description: reason,
    initiatedBy,
  });
}

/**
 * Quick helper to process a subscription cancellation
 */
export async function processSubscriptionCancellation(
  subscriptionId: string,
  reason: string,
  initiatedBy: string
): Promise<RefundProcessedResult> {
  const supabase = createAdminClient();

  // Find related commissions
  const { data: commissions } = await supabase
    .from('commissions')
    .select('id')
    .eq('type', 'ai_copilot')
    .ilike('notes', `%${subscriptionId}%`);

  if (!commissions || commissions.length === 0) {
    return {
      success: true,
      clawbackResult: null,
      summary: 'No commissions to clawback for this subscription',
      errors: [],
    };
  }

  // Process each commission
  const results: RefundProcessedResult[] = [];
  for (const commission of commissions as { id: string }[]) {
    const result = await onRefundProcessed({
      commissionId: commission.id,
      reason: 'subscription_cancelled',
      description: reason,
      initiatedBy,
    });
    results.push(result);
  }

  // Combine results
  const allErrors = results.flatMap((r) => r.errors);
  const success = results.every((r) => r.success);

  return {
    success,
    clawbackResult: results[0]?.clawbackResult || null,
    summary: `Processed ${results.length} commission clawbacks`,
    errors: allErrors,
  };
}
