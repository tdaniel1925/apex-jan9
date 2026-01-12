/**
 * Workflow: On Rank Changed
 *
 * This workflow runs when an agent's rank changes.
 * It handles ALL downstream effects:
 * 1. Record rank history
 * 2. Award rank advancement bonus (if eligible)
 * 3. Check for car bonus eligibility
 * 4. Update sponsor's active agent counts
 * 5. Send notification
 */

import { createAdminClient } from '../db/supabase-server';
import { Agent, RankHistory, Wallet } from '../types/database';
import { Rank, RANK_CONFIG } from '../config/ranks';
import {
  calculateRankAdvancementBonus,
  calculateCarBonus,
} from '../engines/bonus-engine';
import { createCreditTransaction, calculateCreditUpdate } from '../engines/wallet-engine';

export interface RankChangedEvent {
  agent: Agent;
  previousRank: Rank;
  newRank: Rank;
}

export interface RankChangedResult {
  success: boolean;
  rankAdvancementBonus: number;
  carBonusEligible: boolean;
  errors: string[];
}

export async function onRankChanged(
  event: RankChangedEvent
): Promise<RankChangedResult> {
  const { agent, previousRank, newRank } = event;
  const supabase = createAdminClient();
  const errors: string[] = [];
  let rankAdvancementBonus = 0;
  let carBonusEligible = false;

  try {
    // ================================================
    // 1. RECORD RANK HISTORY
    // ================================================
    const { error: historyError } = await supabase.from('rank_history').insert({
      agent_id: agent.id,
      previous_rank: previousRank,
      new_rank: newRank,
      reason: 'Automatic promotion based on qualification',
    } as never);

    if (historyError) {
      errors.push(`Failed to record rank history: ${historyError.message}`);
    }

    // ================================================
    // 2. AWARD RANK ADVANCEMENT BONUS
    // ================================================
    // Get current agent count for phase determination
    const { count: agentCount } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const bonus = calculateRankAdvancementBonus(
      previousRank,
      newRank,
      agentCount || 0
    );

    if (bonus.eligible && bonus.amount > 0) {
      rankAdvancementBonus = bonus.amount;

      // Determine payout schedule
      const bonusConfig = RANK_CONFIG[newRank];
      const isUpperRank = RANK_CONFIG[newRank].order >= RANK_CONFIG.associate_mga.order;

      // For immediate payout ranks
      const payoutDate = new Date();
      const status = isUpperRank ? 'pending' : 'approved';

      const { error: bonusError } = await supabase.from('bonuses').insert({
        agent_id: agent.id,
        bonus_type: 'rank_advancement',
        amount: bonus.amount,
        description: bonus.description,
        reference_id: null,
        status,
        payout_date: status === 'approved' ? payoutDate.toISOString() : null,
      } as never);

      if (bonusError) {
        errors.push(`Failed to create rank bonus: ${bonusError.message}`);
      } else if (status === 'approved') {
        // Credit wallet immediately for lower ranks
        await creditWallet(
          supabase,
          agent.id,
          bonus.amount,
          `Rank Advancement Bonus - ${RANK_CONFIG[newRank].name}`
        );
      }
    }

    // ================================================
    // 3. CHECK CAR BONUS ELIGIBILITY
    // ================================================
    const carBonus = calculateCarBonus(agent, agentCount || 0);
    carBonusEligible = carBonus.eligible;

    if (carBonus.eligible) {
      // Note: Car bonus is processed monthly, not immediately
      // This just flags eligibility - actual payout is handled by monthly job
    }

    // ================================================
    // 4. UPDATE SPONSOR'S MGA COUNT (if new MGA)
    // ================================================
    if (
      newRank === 'mga' &&
      previousRank !== 'mga' &&
      agent.sponsor_id
    ) {
      // Agent became an MGA - update sponsor's mga_in_downline count
      const { error: updateError } = await supabase.rpc(
        'increment_sponsor_mga_count' as never,
        { sponsor_id: agent.sponsor_id } as never
      );

      if (updateError) {
        errors.push(`Failed to update sponsor MGA count: ${updateError.message}`);
      }

      // Recursively check if sponsor should also be promoted
      const { data: sponsorData, error: sponsorError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agent.sponsor_id)
        .single();

      const sponsor = sponsorData as Agent | null;
      if (sponsor && !sponsorError) {
        // Import dynamically to avoid circular dependency
        const { shouldPromote } = await import('../engines/rank-engine');
        const promotion = shouldPromote(sponsor);

        if (promotion.shouldPromote && promotion.newRank) {
          // Update sponsor's rank
          const { error: rankError } = await supabase
            .from('agents')
            .update({ rank: promotion.newRank } as never)
            .eq('id', sponsor.id);

          if (!rankError) {
            // Trigger rank changed for sponsor (recursive)
            await onRankChanged({
              agent: { ...sponsor, rank: promotion.newRank },
              previousRank: sponsor.rank,
              newRank: promotion.newRank,
            });
          }
        }
      }
    }

    // ================================================
    // 5. SEND NOTIFICATION
    // ================================================
    // TODO: Implement notification service
    // await NotificationService.sendRankPromotion(agent, previousRank, newRank);

    return {
      success: errors.length === 0,
      rankAdvancementBonus,
      carBonusEligible,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      rankAdvancementBonus: 0,
      carBonusEligible: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// Helper function to credit wallet
async function creditWallet(
  supabase: ReturnType<typeof createAdminClient>,
  agentId: string,
  amount: number,
  description: string
) {
  // Get current wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (walletError || !wallet) {
    // Create wallet if doesn't exist
    await supabase.from('wallets').insert({
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
    'bonus',
    description,
    'bonus',
    undefined
  );

  await supabase.from('wallet_transactions').insert(transaction as never);
}
