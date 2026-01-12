/**
 * Pay Period Engine
 * Handles commission batching, pay period management, and payout scheduling
 *
 * Features:
 * - Configurable pay periods (weekly, bi-weekly, monthly)
 * - Commission batching by period
 * - Period locking (no changes after cutoff)
 * - Payout scheduling and processing
 */

export type PayPeriodType = 'weekly' | 'biweekly' | 'monthly';
export type PayPeriodStatus = 'open' | 'processing' | 'locked' | 'paid';

export interface PayPeriod {
  id: string;
  period_type: PayPeriodType;
  period_number: number; // e.g., week 1-52, month 1-12
  year: number;
  start_date: string;
  end_date: string;
  cutoff_date: string; // Last date to record commissions
  payout_date: string; // Scheduled payout date
  status: PayPeriodStatus;
  total_commissions: number;
  total_overrides: number;
  total_bonuses: number;
  total_payout: number;
  agent_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface PayPeriodConfig {
  periodType: PayPeriodType;
  cutoffDaysBefore: number; // Days before period end to cut off
  payoutDaysAfter: number; // Days after period end to pay out
  minimumPayout: number; // Minimum amount to process payout
  holdbackPercentage: number; // Percentage to hold for chargebacks (0-1)
}

export const DEFAULT_PAY_PERIOD_CONFIG: PayPeriodConfig = {
  periodType: 'monthly',
  cutoffDaysBefore: 2, // Cutoff 2 days before month end
  payoutDaysAfter: 5, // Pay 5 days after month end
  minimumPayout: 25, // $25 minimum
  holdbackPercentage: 0, // No holdback by default
};

/**
 * Calculate pay period dates based on type
 */
export function calculatePayPeriodDates(
  date: Date,
  periodType: PayPeriodType,
  config: PayPeriodConfig = DEFAULT_PAY_PERIOD_CONFIG
): {
  periodNumber: number;
  year: number;
  startDate: Date;
  endDate: Date;
  cutoffDate: Date;
  payoutDate: Date;
} {
  const year = date.getFullYear();
  let periodNumber: number;
  let startDate: Date;
  let endDate: Date;

  switch (periodType) {
    case 'weekly':
      // ISO week number
      const firstThursday = new Date(year, 0, 4);
      const dayOfYear = Math.floor(
        (date.getTime() - new Date(year, 0, 1).getTime()) / (24 * 60 * 60 * 1000)
      );
      periodNumber = Math.ceil((dayOfYear + firstThursday.getDay() + 1) / 7);

      // Calculate week start (Monday) and end (Sunday)
      const dayOfWeek = date.getDay();
      startDate = new Date(date);
      startDate.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'biweekly':
      // Every two weeks, starting from first Monday of year
      const yearStart = new Date(year, 0, 1);
      const firstMonday = new Date(yearStart);
      while (firstMonday.getDay() !== 1) {
        firstMonday.setDate(firstMonday.getDate() + 1);
      }

      const daysSinceFirst = Math.floor(
        (date.getTime() - firstMonday.getTime()) / (24 * 60 * 60 * 1000)
      );
      periodNumber = Math.floor(daysSinceFirst / 14) + 1;

      startDate = new Date(firstMonday);
      startDate.setDate(firstMonday.getDate() + (periodNumber - 1) * 14);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 13);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'monthly':
    default:
      periodNumber = date.getMonth() + 1; // 1-12

      startDate = new Date(year, date.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(year, date.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  // Calculate cutoff date
  const cutoffDate = new Date(endDate);
  cutoffDate.setDate(cutoffDate.getDate() - config.cutoffDaysBefore);
  cutoffDate.setHours(23, 59, 59, 999);

  // Calculate payout date
  const payoutDate = new Date(endDate);
  payoutDate.setDate(payoutDate.getDate() + config.payoutDaysAfter);
  payoutDate.setHours(0, 0, 0, 0);

  return {
    periodNumber,
    year,
    startDate,
    endDate,
    cutoffDate,
    payoutDate,
  };
}

/**
 * Get the current pay period
 */
export function getCurrentPayPeriod(
  periodType: PayPeriodType = 'monthly',
  config: PayPeriodConfig = DEFAULT_PAY_PERIOD_CONFIG
): Omit<PayPeriod, 'id' | 'created_at' | 'updated_at'> {
  const now = new Date();
  const dates = calculatePayPeriodDates(now, periodType, config);

  // Determine status based on current date
  let status: PayPeriodStatus = 'open';
  if (now > dates.payoutDate) {
    status = 'paid';
  } else if (now > dates.cutoffDate) {
    status = 'processing';
  }

  return {
    period_type: periodType,
    period_number: dates.periodNumber,
    year: dates.year,
    start_date: dates.startDate.toISOString(),
    end_date: dates.endDate.toISOString(),
    cutoff_date: dates.cutoffDate.toISOString(),
    payout_date: dates.payoutDate.toISOString(),
    status,
    total_commissions: 0,
    total_overrides: 0,
    total_bonuses: 0,
    total_payout: 0,
    agent_count: 0,
  };
}

/**
 * Check if a date falls within a pay period
 */
export function isDateInPayPeriod(date: Date, period: PayPeriod): boolean {
  const checkDate = date.getTime();
  const startDate = new Date(period.start_date).getTime();
  const endDate = new Date(period.end_date).getTime();

  return checkDate >= startDate && checkDate <= endDate;
}

/**
 * Check if commission can be recorded (before cutoff)
 */
export function canRecordCommission(period: PayPeriod): boolean {
  if (period.status === 'locked' || period.status === 'paid') {
    return false;
  }

  const now = new Date();
  const cutoff = new Date(period.cutoff_date);

  return now <= cutoff;
}

/**
 * Check if period is ready for payout processing
 */
export function isReadyForPayout(period: PayPeriod): boolean {
  if (period.status !== 'processing') {
    return false;
  }

  const now = new Date();
  const payoutDate = new Date(period.payout_date);

  return now >= payoutDate;
}

/**
 * Calculate agent's payout for a period
 */
export interface AgentPeriodSummary {
  agentId: string;
  commissions: number;
  overrides: number;
  bonuses: number;
  grossPayout: number;
  holdbackAmount: number;
  netPayout: number;
  meetsMinimum: boolean;
}

export function calculateAgentPeriodPayout(
  agentId: string,
  commissions: number,
  overrides: number,
  bonuses: number,
  config: PayPeriodConfig = DEFAULT_PAY_PERIOD_CONFIG
): AgentPeriodSummary {
  const grossPayout = commissions + overrides + bonuses;
  const holdbackAmount = grossPayout * config.holdbackPercentage;
  const netPayout = grossPayout - holdbackAmount;
  const meetsMinimum = netPayout >= config.minimumPayout;

  return {
    agentId,
    commissions,
    overrides,
    bonuses,
    grossPayout,
    holdbackAmount,
    netPayout,
    meetsMinimum,
  };
}

/**
 * Generate period identifier string
 */
export function getPeriodIdentifier(period: PayPeriod): string {
  switch (period.period_type) {
    case 'weekly':
      return `${period.year}-W${period.period_number.toString().padStart(2, '0')}`;
    case 'biweekly':
      return `${period.year}-BW${period.period_number.toString().padStart(2, '0')}`;
    case 'monthly':
      return `${period.year}-${period.period_number.toString().padStart(2, '0')}`;
    default:
      return `${period.year}-${period.period_number}`;
  }
}

/**
 * Get previous pay period
 */
export function getPreviousPeriod(
  currentPeriod: PayPeriod,
  config: PayPeriodConfig = DEFAULT_PAY_PERIOD_CONFIG
): Omit<PayPeriod, 'id' | 'created_at' | 'updated_at'> {
  const currentStart = new Date(currentPeriod.start_date);
  const previousDate = new Date(currentStart);
  previousDate.setDate(previousDate.getDate() - 1);

  const dates = calculatePayPeriodDates(previousDate, currentPeriod.period_type, config);

  return {
    period_type: currentPeriod.period_type,
    period_number: dates.periodNumber,
    year: dates.year,
    start_date: dates.startDate.toISOString(),
    end_date: dates.endDate.toISOString(),
    cutoff_date: dates.cutoffDate.toISOString(),
    payout_date: dates.payoutDate.toISOString(),
    status: 'paid', // Previous periods are typically paid
    total_commissions: 0,
    total_overrides: 0,
    total_bonuses: 0,
    total_payout: 0,
    agent_count: 0,
  };
}

/**
 * Get next pay period
 */
export function getNextPeriod(
  currentPeriod: PayPeriod,
  config: PayPeriodConfig = DEFAULT_PAY_PERIOD_CONFIG
): Omit<PayPeriod, 'id' | 'created_at' | 'updated_at'> {
  const currentEnd = new Date(currentPeriod.end_date);
  const nextDate = new Date(currentEnd);
  nextDate.setDate(nextDate.getDate() + 1);

  const dates = calculatePayPeriodDates(nextDate, currentPeriod.period_type, config);

  return {
    period_type: currentPeriod.period_type,
    period_number: dates.periodNumber,
    year: dates.year,
    start_date: dates.startDate.toISOString(),
    end_date: dates.endDate.toISOString(),
    cutoff_date: dates.cutoffDate.toISOString(),
    payout_date: dates.payoutDate.toISOString(),
    status: 'open',
    total_commissions: 0,
    total_overrides: 0,
    total_bonuses: 0,
    total_payout: 0,
    agent_count: 0,
  };
}

/**
 * Calculate rollover amount for agents below minimum
 */
export function calculateRolloverAmount(
  summary: AgentPeriodSummary,
  config: PayPeriodConfig = DEFAULT_PAY_PERIOD_CONFIG
): number {
  if (summary.meetsMinimum) {
    return 0;
  }
  return summary.netPayout;
}

/**
 * Format pay period for display
 */
export function formatPayPeriodDisplay(period: PayPeriod): string {
  const startDate = new Date(period.start_date);
  const endDate = new Date(period.end_date);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  switch (period.period_type) {
    case 'weekly':
      return `Week ${period.period_number}, ${period.year} (${formatDate(startDate)} - ${formatDate(endDate)})`;
    case 'biweekly':
      return `Period ${period.period_number}, ${period.year} (${formatDate(startDate)} - ${formatDate(endDate)})`;
    case 'monthly':
      return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    default:
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
}

/**
 * Get time remaining until cutoff
 */
export function getTimeUntilCutoff(period: PayPeriod): {
  days: number;
  hours: number;
  minutes: number;
  isPastCutoff: boolean;
} {
  const now = new Date();
  const cutoff = new Date(period.cutoff_date);
  const diff = cutoff.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isPastCutoff: true };
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  return { days, hours, minutes, isPastCutoff: false };
}
