/**
 * Withdrawal Limits Service
 * Handles rate limiting and security checks for withdrawals
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface WithdrawalLimits {
  daily_limit: number;
  weekly_limit: number;
  monthly_limit: number;
  per_transaction_limit: number;
  min_account_age_days: number;
  first_withdrawal_hold_hours: number;
  max_withdrawals_per_day: number;
  max_withdrawals_per_week: number;
}

export interface WithdrawalCheckResult {
  allowed: boolean;
  reason?: string;
  limits?: {
    dailyRemaining: number;
    weeklyRemaining: number;
    monthlyRemaining: number;
    withdrawalsToday: number;
    maxWithdrawalsPerDay: number;
  };
}

// Default limits for new agents
export const DEFAULT_LIMITS: WithdrawalLimits = {
  daily_limit: 2500,
  weekly_limit: 10000,
  monthly_limit: 50000,
  per_transaction_limit: 10000,
  min_account_age_days: 7,
  first_withdrawal_hold_hours: 48,
  max_withdrawals_per_day: 3,
  max_withdrawals_per_week: 10,
};

/**
 * Get withdrawal limits for an agent
 * Returns custom limits if set, otherwise default limits
 */
export async function getAgentWithdrawalLimits(
  supabase: SupabaseClient,
  agentId: string
): Promise<WithdrawalLimits> {
  const { data } = await supabase
    .from('withdrawal_limits')
    .select('*')
    .eq('agent_id', agentId)
    .maybeSingle();

  if (data) {
    return {
      daily_limit: data.daily_limit,
      weekly_limit: data.weekly_limit,
      monthly_limit: data.monthly_limit,
      per_transaction_limit: data.per_transaction_limit,
      min_account_age_days: data.min_account_age_days,
      first_withdrawal_hold_hours: data.first_withdrawal_hold_hours,
      max_withdrawals_per_day: data.max_withdrawals_per_day,
      max_withdrawals_per_week: data.max_withdrawals_per_week,
    };
  }

  // Check for global default limits (agent_id IS NULL)
  const { data: globalLimits } = await supabase
    .from('withdrawal_limits')
    .select('*')
    .is('agent_id', null)
    .maybeSingle();

  if (globalLimits) {
    return {
      daily_limit: globalLimits.daily_limit,
      weekly_limit: globalLimits.weekly_limit,
      monthly_limit: globalLimits.monthly_limit,
      per_transaction_limit: globalLimits.per_transaction_limit,
      min_account_age_days: globalLimits.min_account_age_days,
      first_withdrawal_hold_hours: globalLimits.first_withdrawal_hold_hours,
      max_withdrawals_per_day: globalLimits.max_withdrawals_per_day,
      max_withdrawals_per_week: globalLimits.max_withdrawals_per_week,
    };
  }

  return DEFAULT_LIMITS;
}

/**
 * Check if agent has verified banking info
 */
export async function checkBankingInfo(
  supabase: SupabaseClient,
  agentId: string,
  method: 'ach' | 'wire' | 'check'
): Promise<{ valid: boolean; reason?: string }> {
  const { data: bankingInfo } = await supabase
    .from('agent_banking_info')
    .select('*')
    .eq('agent_id', agentId)
    .maybeSingle();

  if (!bankingInfo) {
    return {
      valid: false,
      reason: 'Please add your banking information before making a withdrawal',
    };
  }

  // For ACH and wire, require verified bank account
  if (method === 'ach' || method === 'wire') {
    if (!bankingInfo.routing_number || !bankingInfo.account_number_encrypted) {
      return {
        valid: false,
        reason: 'Please complete your bank account details to use this withdrawal method',
      };
    }
  }

  // For check and wire, require mailing address
  if (method === 'check' || method === 'wire') {
    if (!bankingInfo.mailing_address_line1 || !bankingInfo.mailing_city ||
        !bankingInfo.mailing_state || !bankingInfo.mailing_zip) {
      return {
        valid: false,
        reason: 'Please complete your mailing address to use this withdrawal method',
      };
    }
  }

  return { valid: true };
}

/**
 * Check account age requirement
 */
export async function checkAccountAge(
  supabase: SupabaseClient,
  agentId: string,
  minAgeDays: number
): Promise<{ valid: boolean; reason?: string }> {
  const { data: agent } = await supabase
    .from('agents')
    .select('created_at')
    .eq('id', agentId)
    .single();

  if (!agent) {
    return { valid: false, reason: 'Agent not found' };
  }

  const createdAt = new Date(agent.created_at);
  const now = new Date();
  const ageDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  if (ageDays < minAgeDays) {
    return {
      valid: false,
      reason: `Your account must be at least ${minAgeDays} days old to make withdrawals. (${minAgeDays - ageDays} days remaining)`,
    };
  }

  return { valid: true };
}

/**
 * Get withdrawal totals for different time periods
 */
export async function getWithdrawalTotals(
  supabase: SupabaseClient,
  agentId: string
): Promise<{
  dailyTotal: number;
  weeklyTotal: number;
  monthlyTotal: number;
  dailyCount: number;
  weeklyCount: number;
}> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Get all payouts for this agent that aren't failed/rejected
  const { data: payouts } = await supabase
    .from('payouts')
    .select('amount, created_at, status')
    .eq('agent_id', agentId)
    .in('status', ['pending', 'processing', 'completed'])
    .gte('created_at', startOfMonth);

  if (!payouts || payouts.length === 0) {
    return {
      dailyTotal: 0,
      weeklyTotal: 0,
      monthlyTotal: 0,
      dailyCount: 0,
      weeklyCount: 0,
    };
  }

  let dailyTotal = 0;
  let weeklyTotal = 0;
  let monthlyTotal = 0;
  let dailyCount = 0;
  let weeklyCount = 0;

  for (const payout of payouts) {
    const payoutDate = new Date(payout.created_at);
    monthlyTotal += payout.amount;

    if (payoutDate >= new Date(startOfWeek)) {
      weeklyTotal += payout.amount;
      weeklyCount++;
    }

    if (payoutDate >= new Date(startOfDay)) {
      dailyTotal += payout.amount;
      dailyCount++;
    }
  }

  return {
    dailyTotal,
    weeklyTotal,
    monthlyTotal,
    dailyCount,
    weeklyCount,
  };
}

/**
 * Check if this is the first withdrawal and handle hold period
 */
export async function checkFirstWithdrawalHold(
  supabase: SupabaseClient,
  agentId: string,
  holdHours: number
): Promise<{ valid: boolean; reason?: string }> {
  // Get count of completed payouts for this agent
  const { count } = await supabase
    .from('payouts')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .eq('status', 'completed');

  // If they have completed payouts before, no hold needed
  if (count && count > 0) {
    return { valid: true };
  }

  // Check if they have any pending/processing payouts
  const { data: pendingPayouts } = await supabase
    .from('payouts')
    .select('created_at')
    .eq('agent_id', agentId)
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: true })
    .limit(1);

  // If no pending payouts, this will be their first - allow it but note the hold
  if (!pendingPayouts || pendingPayouts.length === 0) {
    return { valid: true };
  }

  // If there's a pending payout and no completed ones, check hold period
  const firstPayout = new Date(pendingPayouts[0].created_at);
  const holdEnd = new Date(firstPayout.getTime() + holdHours * 60 * 60 * 1000);
  const now = new Date();

  if (now < holdEnd) {
    const hoursRemaining = Math.ceil((holdEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
    return {
      valid: false,
      reason: `First-time withdrawals have a ${holdHours}-hour security hold. (${hoursRemaining} hours remaining)`,
    };
  }

  return { valid: true };
}

/**
 * Comprehensive withdrawal check - validates all limits and requirements
 */
export async function validateWithdrawalLimits(
  supabase: SupabaseClient,
  agentId: string,
  amount: number,
  method: 'ach' | 'wire' | 'check'
): Promise<WithdrawalCheckResult> {
  // Get limits for this agent
  const limits = await getAgentWithdrawalLimits(supabase, agentId);

  // Check banking info
  const bankingCheck = await checkBankingInfo(supabase, agentId, method);
  if (!bankingCheck.valid) {
    return { allowed: false, reason: bankingCheck.reason };
  }

  // Check account age
  const ageCheck = await checkAccountAge(supabase, agentId, limits.min_account_age_days);
  if (!ageCheck.valid) {
    return { allowed: false, reason: ageCheck.reason };
  }

  // Check first withdrawal hold
  const holdCheck = await checkFirstWithdrawalHold(supabase, agentId, limits.first_withdrawal_hold_hours);
  if (!holdCheck.valid) {
    return { allowed: false, reason: holdCheck.reason };
  }

  // Check per-transaction limit
  if (amount > limits.per_transaction_limit) {
    return {
      allowed: false,
      reason: `Maximum single withdrawal is $${limits.per_transaction_limit.toLocaleString()}`,
    };
  }

  // Get withdrawal totals
  const totals = await getWithdrawalTotals(supabase, agentId);

  // Check max withdrawals per day
  if (totals.dailyCount >= limits.max_withdrawals_per_day) {
    return {
      allowed: false,
      reason: `Maximum ${limits.max_withdrawals_per_day} withdrawals per day. Try again tomorrow.`,
    };
  }

  // Check max withdrawals per week
  if (totals.weeklyCount >= limits.max_withdrawals_per_week) {
    return {
      allowed: false,
      reason: `Maximum ${limits.max_withdrawals_per_week} withdrawals per week. Try again later.`,
    };
  }

  // Check daily limit
  const newDailyTotal = totals.dailyTotal + amount;
  if (newDailyTotal > limits.daily_limit) {
    const remaining = Math.max(0, limits.daily_limit - totals.dailyTotal);
    return {
      allowed: false,
      reason: `This withdrawal would exceed your daily limit. Maximum remaining today: $${remaining.toLocaleString()}`,
    };
  }

  // Check weekly limit
  const newWeeklyTotal = totals.weeklyTotal + amount;
  if (newWeeklyTotal > limits.weekly_limit) {
    const remaining = Math.max(0, limits.weekly_limit - totals.weeklyTotal);
    return {
      allowed: false,
      reason: `This withdrawal would exceed your weekly limit. Maximum remaining this week: $${remaining.toLocaleString()}`,
    };
  }

  // Check monthly limit
  const newMonthlyTotal = totals.monthlyTotal + amount;
  if (newMonthlyTotal > limits.monthly_limit) {
    const remaining = Math.max(0, limits.monthly_limit - totals.monthlyTotal);
    return {
      allowed: false,
      reason: `This withdrawal would exceed your monthly limit. Maximum remaining this month: $${remaining.toLocaleString()}`,
    };
  }

  return {
    allowed: true,
    limits: {
      dailyRemaining: limits.daily_limit - newDailyTotal,
      weeklyRemaining: limits.weekly_limit - newWeeklyTotal,
      monthlyRemaining: limits.monthly_limit - newMonthlyTotal,
      withdrawalsToday: totals.dailyCount + 1,
      maxWithdrawalsPerDay: limits.max_withdrawals_per_day,
    },
  };
}

/**
 * Log withdrawal attempt for audit trail
 */
export async function logWithdrawalAttempt(
  supabase: SupabaseClient,
  agentId: string,
  action: 'request' | 'approve' | 'reject' | 'complete' | 'fail',
  amount: number,
  method: string,
  payoutId?: string,
  reason?: string,
  ipAddress?: string,
  userAgent?: string,
  adminId?: string
): Promise<void> {
  try {
    await supabase.from('withdrawal_audit_log').insert({
      agent_id: agentId,
      payout_id: payoutId,
      action,
      amount,
      method,
      reason,
      ip_address: ipAddress,
      user_agent: userAgent,
      performed_by: adminId,
    });
  } catch (error) {
    console.error('Failed to log withdrawal attempt:', error);
    // Don't throw - audit logging should not block the operation
  }
}
