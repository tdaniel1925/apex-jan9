/**
 * Workflow: On Commission Created (V2 - Transaction-Wrapped)
 *
 * This is a transaction-safe version that prevents partial commission creation.
 * Uses the database create_commission_with_overrides() function for atomic operations.
 *
 * Phase 2 Security Enhancement - Issue #8
 */

import { createAdminClient } from '../db/supabase-server';
import { Commission, Agent, Override, MatrixPosition, Wallet } from '../types/database';
import { calculateRank, shouldPromote } from '../engines/rank-engine';
import { getUplineFromPath } from '../engines/matrix-engine';
import { calculateFastStart } from '../engines/bonus-engine';
import { onRankChanged } from './on-rank-changed';
import { sendCommissionUpdate } from '../email/email-service';
import { getOverrideAmounts } from '../engines/override-engine';

export interface CommissionCreatedEvent {
  commissionData: {
    agent_id: string;
    carrier: string;
    policy_number: string;
    premium_amount: number;
    commission_rate: number;
    commission_amount: number;
    bonus_volume: number;
    policy_date: string;
    source?: string;
  };
  agent: Agent;
}

export interface CommissionCreatedResult {
  success: boolean;
  commission_id?: string;
  rankChanged: boolean;
  newRank?: string;
  overridesCreated: number;
  fastStartBonusAwarded: boolean;
  errors: string[];
}

/**
 * Create commission with atomic transaction for overrides and wallet credits
 */
export async function onCommissionCreatedV2(
  event: CommissionCreatedEvent
): Promise<CommissionCreatedResult> {
  const { commissionData, agent } = event;
  const supabase = createAdminClient();
  const errors: string[] = [];
  let rankChanged = false;
  let newRank: string | undefined;
  let overridesCreated = 0;
  let fastStartBonusAwarded = false;
  let commissionId: string | undefined;

  try {
    // ================================================
    // STEP 1: Get upline for override calculation
    // ================================================
    const { data: matrixPositionData } = await supabase
      .from('matrix_positions')
      .select('path')
      .eq('agent_id', agent.id)
      .single();

    const matrixPosition = matrixPositionData as { path: string } | null;

    let uplineIds: string[] = [];
    let overrideAmounts: number[] = [];

    if (matrixPosition) {
      const { data: allPositionsData } = await supabase
        .from('matrix_positions')
        .select('*');

      const allPositions = allPositionsData as MatrixPosition[] | null;
      if (allPositions) {
        // Get up to 6 generations of upline
        uplineIds = getUplineFromPath(matrixPosition.path, allPositions, 6);

        // Calculate override amounts for each generation
        overrideAmounts = getOverrideAmounts(
          commissionData.commission_amount,
          uplineIds.length
        );
      }
    }

    // ================================================
    // STEP 2: Create commission atomically with overrides and wallet credits
    // This is transaction-wrapped in the database function
    // ================================================
    const { data: result, error: commissionError } = await supabase.rpc(
      'create_commission_with_overrides' as never,
      {
        p_commission_data: commissionData,
        p_agent_id: agent.id,
        p_upline_agent_ids: uplineIds,
        p_override_amounts: overrideAmounts,
      } as never
    );

    if (commissionError || !result) {
      errors.push(`Failed to create commission: ${commissionError?.message || 'Unknown error'}`);
      return {
        success: false,
        rankChanged: false,
        overridesCreated: 0,
        fastStartBonusAwarded: false,
        errors,
      };
    }

    // Extract result
    const txResult = result as {
      success: boolean;
      commission_id: string;
      overrides_created: number;
      wallet_credits: number;
    };

    if (!txResult.success) {
      errors.push('Commission transaction failed to commit');
      return {
        success: false,
        rankChanged: false,
        overridesCreated: 0,
        fastStartBonusAwarded: false,
        errors,
      };
    }

    commissionId = txResult.commission_id;
    overridesCreated = txResult.overrides_created;

    // ================================================
    // STEP 3: Update agent metrics (90-day premium)
    // ================================================
    await supabase.rpc(
      'update_agent_premium_90_days' as never,
      { agent_id: agent.id } as never
    );

    // ================================================
    // STEP 4: Check rank promotion
    // ================================================
    const { data: freshAgentData } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent.id)
      .single();

    const freshAgent = freshAgentData as Agent | null;
    if (freshAgent) {
      const promotion = shouldPromote(freshAgent);

      if (promotion.shouldPromote && promotion.newRank) {
        // Update rank
        const { error: rankError } = await supabase
          .from('agents')
          .update({ rank: promotion.newRank } as never)
          .eq('id', agent.id);

        if (!rankError) {
          rankChanged = true;
          newRank = promotion.newRank;

          // Trigger rank changed workflow
          await onRankChanged({
            agent: { ...freshAgent, rank: promotion.newRank },
            previousRank: freshAgent.rank,
            newRank: promotion.newRank,
          });
        }
      }

      // ================================================
      // STEP 5: Check fast start bonus
      // ================================================
      const fastStartResult = calculateFastStart(
        freshAgent,
        freshAgent.premium_90_days
      );

      if (fastStartResult.eligible && fastStartResult.repBonus > 0) {
        // Check if bonus already awarded
        const { data: existingBonus } = await supabase
          .from('bonuses')
          .select('id')
          .eq('agent_id', agent.id)
          .eq('bonus_type', 'fast_start')
          .eq('amount', fastStartResult.repBonus)
          .single();

        if (!existingBonus) {
          // Award bonus
          const { error: bonusError } = await supabase.from('bonuses').insert({
            agent_id: agent.id,
            bonus_type: 'fast_start',
            amount: fastStartResult.repBonus,
            description: `Fast Start Bonus - Tier ${fastStartResult.currentTier}`,
            reference_id: commissionId,
            status: 'approved',
            payout_date: new Date().toISOString(),
          } as never);

          if (!bonusError) {
            fastStartBonusAwarded = true;

            // Credit wallet for bonus (using SQL increment)
            await supabase.rpc('increment_wallet_balance' as never, {
              p_agent_id: agent.id,
              p_amount: fastStartResult.repBonus,
            } as never);

            // Create transaction record
            await supabase.from('wallet_transactions').insert({
              agent_id: agent.id,
              type: 'credit',
              category: 'bonus',
              amount: fastStartResult.repBonus,
              description: `Fast Start Bonus - Tier ${fastStartResult.currentTier}`,
              reference_type: 'bonus',
            } as never);

            // Award sponsor bonus if applicable
            if (agent.sponsor_id && fastStartResult.sponsorBonus > 0) {
              await supabase.from('bonuses').insert({
                agent_id: agent.sponsor_id,
                bonus_type: 'fast_start_sponsor',
                amount: fastStartResult.sponsorBonus,
                description: `Fast Start Sponsor Bonus - ${agent.first_name} ${agent.last_name}`,
                reference_id: agent.id,
                status: 'approved',
                payout_date: new Date().toISOString(),
              } as never);

              await supabase.rpc('increment_wallet_balance' as never, {
                p_agent_id: agent.sponsor_id,
                p_amount: fastStartResult.sponsorBonus,
              } as never);
            }
          }
        }
      }
    }

    // ================================================
    // STEP 6: Send email notification (non-blocking)
    // ================================================
    if (agent.email) {
      const period = new Date(commissionData.policy_date).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      sendCommissionUpdate({
        to: agent.email,
        agentName: agent.first_name || 'Agent',
        amount: commissionData.commission_amount,
        period,
      }).catch((error) => {
        console.error('Failed to send commission email:', error);
        errors.push('Email notification failed');
      });
    }

    return {
      success: errors.length === 0,
      commission_id: commissionId,
      rankChanged,
      newRank,
      overridesCreated,
      fastStartBonusAwarded,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      rankChanged: false,
      overridesCreated: 0,
      fastStartBonusAwarded: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
