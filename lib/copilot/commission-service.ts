/**
 * Copilot Commission Service
 * Calculates and creates commissions for copilot subscriptions
 *
 * Commission Structure (based on Bonus Volume, NOT price):
 * - Personal Sale: Commission rate × BV
 * - Upline Overrides: Based on rank differential
 */

import { createServiceClient } from '@/lib/db/supabase-server';
import { CopilotTier, COPILOT_TIERS } from './config';

// Commission rates by rank (percentage of BV as commission)
const COMMISSION_RATES: Record<string, number> = {
  associate: 0.30,      // 30%
  senior_associate: 0.35,
  district_manager: 0.40,
  regional_manager: 0.45,
  national_manager: 0.50,
  executive_director: 0.55,
};

// Override rates for upline (based on rank differential)
// The upline earns a % of the BV based on the difference between their rate and the downline's rate
const OVERRIDE_DEPTH = 5; // Maximum upline levels for overrides

// Result types for Supabase queries
interface AgentRow {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  rank: string;
  upline_id: string | null;
}

interface CommissionResult {
  agentId: string;
  type: 'personal' | 'override';
  bonusVolume: number;
  commissionRate: number;
  commissionAmount: number;
  sourceAgentId?: string;
}

/**
 * Create commission for a copilot subscription payment
 */
export async function createCopilotCommission(
  agentId: string,
  subscriptionId: string,
  amountPaidCents: number,
  bonusVolume: number,
  tier: CopilotTier
): Promise<void> {
  const supabase = createServiceClient();

  try {
    // Get agent details
    const { data: agent } = await supabase
      .from('agents')
      .select('id, user_id, email, first_name, last_name, rank, upline_id')
      .eq('id', agentId)
      .single() as unknown as { data: AgentRow | null; error: unknown };

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Calculate personal commission
    const commissionRate = COMMISSION_RATES[agent.rank] || COMMISSION_RATES.associate;
    const commissionAmount = bonusVolume * commissionRate;

    // Create personal commission record
    const { error: commissionError } = await supabase
      .from('commissions')
      .insert({
        agent_id: agentId,
        order_id: null, // No order for subscription commissions
        type: 'ai_copilot',
        retail_amount: amountPaidCents / 100, // Convert cents to dollars
        bonus_volume: bonusVolume,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: 'pending',
        notes: `Copilot ${tier} subscription payment`,
      } as never);

    if (commissionError) {
      console.error('Failed to create copilot commission:', commissionError);
      throw new Error('Failed to create commission');
    }

    console.log(`✅ Copilot commission created: $${commissionAmount.toFixed(2)} (${(commissionRate * 100).toFixed(0)}% of ${bonusVolume} BV)`);

    // Calculate and create override commissions for upline
    await createOverrideCommissions(
      agent,
      subscriptionId,
      bonusVolume,
      commissionRate,
      tier
    );

  } catch (error) {
    console.error('Error creating copilot commission:', error);
    throw error;
  }
}

/**
 * Create override commissions for upline agents
 */
async function createOverrideCommissions(
  agent: AgentRow,
  subscriptionId: string,
  bonusVolume: number,
  downlineRate: number,
  tier: CopilotTier
): Promise<void> {
  const supabase = createServiceClient();

  let currentAgentId = agent.upline_id;
  let currentDownlineRate = downlineRate;
  let level = 1;

  while (currentAgentId && level <= OVERRIDE_DEPTH) {
    // Get upline agent
    const { data: upline } = await supabase
      .from('agents')
      .select('id, user_id, email, first_name, last_name, rank, upline_id')
      .eq('id', currentAgentId)
      .single() as unknown as { data: AgentRow | null; error: unknown };

    if (!upline) {
      break;
    }

    const uplineRate = COMMISSION_RATES[upline.rank] || COMMISSION_RATES.associate;

    // Only create override if upline has a higher rate
    if (uplineRate > currentDownlineRate) {
      const overrideRate = uplineRate - currentDownlineRate;
      const overrideAmount = bonusVolume * overrideRate;

      // Create override commission
      const { error: overrideError } = await supabase
        .from('commissions')
        .insert({
          agent_id: upline.id,
          order_id: null,
          type: 'override',
          retail_amount: 0, // Overrides don't track retail amount
          bonus_volume: bonusVolume,
          commission_rate: overrideRate,
          commission_amount: overrideAmount,
          status: 'pending',
          notes: `Override on copilot ${tier} subscription (Level ${level} from ${agent.first_name} ${agent.last_name})`,
        } as never);

      if (overrideError) {
        console.error('Failed to create override commission:', overrideError);
      } else {
        console.log(`✅ Override commission created for ${upline.first_name}: $${overrideAmount.toFixed(2)} (${(overrideRate * 100).toFixed(1)}% of ${bonusVolume} BV)`);
      }

      // Update for next iteration - use this upline's rate as the new downline rate
      currentDownlineRate = uplineRate;
    }

    // Move up the chain
    currentAgentId = upline.upline_id;
    level++;
  }
}

/**
 * Calculate estimated commission for a tier
 * Used for displaying potential earnings
 */
export function calculateEstimatedCommission(
  tier: CopilotTier,
  rank: string
): { personal: number; maxOverride: number } {
  const tierConfig = COPILOT_TIERS[tier];
  const bv = tierConfig.bonusVolume;
  const rate = COMMISSION_RATES[rank] || COMMISSION_RATES.associate;

  // Personal commission
  const personal = bv * rate;

  // Max override (if someone at highest rank refers someone at lowest rank)
  const maxRate = COMMISSION_RATES.executive_director;
  const minRate = COMMISSION_RATES.associate;
  const maxOverride = bv * (maxRate - minRate);

  return { personal, maxOverride };
}

/**
 * Get commission summary for an agent
 */
export async function getCopilotCommissionSummary(agentId: string): Promise<{
  totalEarnings: number;
  personalSales: number;
  overrides: number;
  pendingAmount: number;
  subscriptionCount: number;
}> {
  const supabase = createServiceClient();

  // Get all copilot-related commissions
  const { data: commissions } = await supabase
    .from('commissions')
    .select('type, commission_amount, status')
    .eq('agent_id', agentId)
    .in('type', ['ai_copilot', 'override']) as unknown as {
      data: Array<{ type: string; commission_amount: number; status: string }> | null;
      error: unknown
    };

  if (!commissions) {
    return {
      totalEarnings: 0,
      personalSales: 0,
      overrides: 0,
      pendingAmount: 0,
      subscriptionCount: 0,
    };
  }

  const personalSales = commissions
    .filter((c) => c.type === 'ai_copilot')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const overrides = commissions
    .filter((c) => c.type === 'override')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const pendingAmount = commissions
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const subscriptionCount = commissions.filter((c) => c.type === 'ai_copilot').length;

  return {
    totalEarnings: personalSales + overrides,
    personalSales,
    overrides,
    pendingAmount,
    subscriptionCount,
  };
}
