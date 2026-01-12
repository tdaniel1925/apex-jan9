/**
 * Workflow: On Commission Created
 *
 * This workflow runs every time a new commission is recorded.
 * It handles ALL downstream effects:
 * 1. Recalculate agent's rank
 * 2. Calculate and create 6-generation overrides
 * 3. Check and award fast start bonus
 * 4. Update contest standings
 * 5. Credit wallets
 */

import { createAdminClient } from '../db/supabase-server';
import { Commission, Agent, Override, MatrixPosition, Wallet } from '../types/database';
import { calculateRank, shouldPromote } from '../engines/rank-engine';
import { createOverrideRecords } from '../engines/override-engine';
import { calculateFastStart } from '../engines/bonus-engine';
import {
  createCreditTransaction,
  calculateCreditUpdate,
} from '../engines/wallet-engine';
import { getUplineFromPath } from '../engines/matrix-engine';
import { onRankChanged } from './on-rank-changed';
import { sendCommissionUpdate } from '../email/email-service';

export interface CommissionCreatedEvent {
  commission: Commission;
  agent: Agent;
}

export interface CommissionCreatedResult {
  success: boolean;
  rankChanged: boolean;
  newRank?: string;
  overridesCreated: number;
  fastStartBonusAwarded: boolean;
  errors: string[];
}

export async function onCommissionCreated(
  event: CommissionCreatedEvent
): Promise<CommissionCreatedResult> {
  const { commission, agent } = event;
  const supabase = createAdminClient();
  const errors: string[] = [];
  let rankChanged = false;
  let newRank: string | undefined;
  let overridesCreated = 0;
  let fastStartBonusAwarded = false;

  try {
    // ================================================
    // 1. UPDATE AGENT'S 90-DAY PREMIUM
    // ================================================
    const { data: updatedMetrics, error: metricsError } = await supabase.rpc(
      'update_agent_premium_90_days' as never,
      { agent_id: agent.id } as never
    );

    if (metricsError) {
      errors.push(`Failed to update premium metrics: ${metricsError.message}`);
    }

    // ================================================
    // 2. RECALCULATE RANK
    // ================================================
    // Fetch fresh agent data with updated metrics
    const { data: freshAgentData, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent.id)
      .single();

    const freshAgent = freshAgentData as Agent | null;
    if (agentError || !freshAgent) {
      errors.push(`Failed to fetch agent: ${agentError?.message}`);
    } else {
      const promotion = shouldPromote(freshAgent);

      if (promotion.shouldPromote && promotion.newRank) {
        // Update rank
        const { error: rankError } = await supabase
          .from('agents')
          .update({ rank: promotion.newRank } as never)
          .eq('id', agent.id);

        if (rankError) {
          errors.push(`Failed to update rank: ${rankError.message}`);
        } else {
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
    }

    // ================================================
    // 3. CALCULATE AND CREATE OVERRIDES
    // ================================================
    // Get agent's matrix position
    const { data: matrixPositionData, error: matrixError } = await supabase
      .from('matrix_positions')
      .select('*')
      .eq('agent_id', agent.id)
      .single();

    const matrixPosition = matrixPositionData as { path: string } | null;
    if (matrixError || !matrixPosition) {
      errors.push(`Failed to fetch matrix position: ${matrixError?.message}`);
    } else {
      // Get all positions for upline lookup
      const { data: allPositionsData, error: positionsError } = await supabase
        .from('matrix_positions')
        .select('*');

      const allPositions = allPositionsData as MatrixPosition[] | null;
      if (positionsError) {
        errors.push(`Failed to fetch positions: ${positionsError.message}`);
      } else if (allPositions) {
        // Get upline agent IDs (up to 6 generations)
        const uplineIds = getUplineFromPath(matrixPosition.path, allPositions, 6);

        if (uplineIds.length > 0) {
          // Fetch upline agents
          const { data: uplineAgentsData, error: uplineError } = await supabase
            .from('agents')
            .select('id')
            .in('id', uplineIds);

          const uplineAgents = uplineAgentsData as { id: string }[] | null;
          if (uplineError) {
            errors.push(`Failed to fetch upline: ${uplineError.message}`);
          } else if (uplineAgents) {
            // Create override records
            const overrideRecords = createOverrideRecords(
              commission,
              uplineAgents
            );

            if (overrideRecords.length > 0) {
              const { error: overridesError } = await supabase
                .from('overrides')
                .insert(overrideRecords as never);

              if (overridesError) {
                errors.push(
                  `Failed to create overrides: ${overridesError.message}`
                );
              } else {
                overridesCreated = overrideRecords.length;

                // Credit wallets for each override
                for (const override of overrideRecords) {
                  await creditWallet(
                    supabase,
                    override.agent_id,
                    override.override_amount,
                    'override',
                    `Gen ${override.generation} override from ${agent.first_name} ${agent.last_name}`,
                    'commission',
                    commission.id
                  );
                }
              }
            }
          }
        }
      }
    }

    // ================================================
    // 4. CHECK FAST START BONUS
    // ================================================
    if (freshAgent) {
      const fastStartResult = calculateFastStart(
        freshAgent,
        freshAgent.premium_90_days
      );

      if (fastStartResult.eligible && fastStartResult.repBonus > 0) {
        // Check if bonus already awarded for this tier
        const { data: existingBonus, error: bonusCheckError } = await supabase
          .from('bonuses')
          .select('id')
          .eq('agent_id', agent.id)
          .eq('bonus_type', 'fast_start')
          .eq('amount', fastStartResult.repBonus)
          .single();

        if (!existingBonus) {
          // Award the bonus
          const { error: bonusError } = await supabase.from('bonuses').insert({
            agent_id: agent.id,
            bonus_type: 'fast_start',
            amount: fastStartResult.repBonus,
            description: `Fast Start Bonus - Tier ${fastStartResult.currentTier}`,
            reference_id: commission.id,
            status: 'approved',
            payout_date: new Date().toISOString(),
          } as never);

          if (bonusError) {
            errors.push(`Failed to create fast start bonus: ${bonusError.message}`);
          } else {
            fastStartBonusAwarded = true;

            // Credit wallet
            await creditWallet(
              supabase,
              agent.id,
              fastStartResult.repBonus,
              'bonus',
              `Fast Start Bonus - Tier ${fastStartResult.currentTier}`,
              'bonus',
              undefined
            );

            // Award sponsor bonus if applicable
            if (agent.sponsor_id && fastStartResult.sponsorBonus > 0) {
              const { error: sponsorBonusError } = await supabase
                .from('bonuses')
                .insert({
                  agent_id: agent.sponsor_id,
                  bonus_type: 'fast_start_sponsor',
                  amount: fastStartResult.sponsorBonus,
                  description: `Fast Start Sponsor Bonus - ${agent.first_name} ${agent.last_name}`,
                  reference_id: agent.id,
                  status: 'approved',
                  payout_date: new Date().toISOString(),
                } as never);

              if (!sponsorBonusError) {
                await creditWallet(
                  supabase,
                  agent.sponsor_id,
                  fastStartResult.sponsorBonus,
                  'bonus',
                  `Fast Start Sponsor Bonus - ${agent.first_name} ${agent.last_name}`,
                  'bonus',
                  undefined
                );
              }
            }
          }
        }
      }
    }

    // ================================================
    // 5. CREDIT AGENT'S WALLET WITH COMMISSION
    // ================================================
    await creditWallet(
      supabase,
      agent.id,
      commission.commission_amount,
      'commission',
      `Commission - ${commission.carrier} Policy ${commission.policy_number}`,
      'commission',
      commission.id
    );

    // ================================================
    // 6. SEND COMMISSION EMAIL NOTIFICATION
    // ================================================
    if (agent.email) {
      const period = new Date(commission.policy_date).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      await sendCommissionUpdate({
        to: agent.email,
        agentName: agent.first_name || 'Agent',
        amount: commission.commission_amount,
        period,
      }).catch((error) => {
        // Log but don't fail workflow if email fails
        console.error('Failed to send commission email:', error);
        errors.push('Email notification failed');
      });
    }

    return {
      success: errors.length === 0,
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

// Helper function to credit wallet
async function creditWallet(
  supabase: ReturnType<typeof createAdminClient>,
  agentId: string,
  amount: number,
  category: 'commission' | 'override' | 'bonus',
  description: string,
  referenceType: string,
  referenceId: string | undefined
) {
  // Get current wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (walletError || !wallet) {
    // Create wallet if doesn't exist
    const { error: createError } = await supabase.from('wallets').insert({
      agent_id: agentId,
      balance: amount,
      pending_balance: 0,
      lifetime_earnings: amount,
    } as never);
    return;
  }

  // Update wallet
  const typedWallet = wallet as Wallet;
  const updates = calculateCreditUpdate(typedWallet, amount, false);
  await supabase.from('wallets').update(updates as never).eq('agent_id', agentId);

  // Create transaction record
  const transaction = createCreditTransaction(
    agentId,
    typedWallet.balance,
    amount,
    category,
    description,
    referenceType,
    referenceId
  );

  await supabase.from('wallet_transactions').insert(transaction as never);
}
