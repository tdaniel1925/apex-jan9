/**
 * Incentive Programs Configuration
 * APEX Drive (Car Bonus), APEX Ignition (Fast Start), Elite 10
 *
 * These are the NEW incentive programs defined in the PRD.
 * All values must match the database defaults in 20260116200000_incentive_programs.sql
 */

// ============================================
// PROGRAM KEYS
// ============================================
export const INCENTIVE_PROGRAMS = {
  CAR_BONUS: 'car_bonus',
  FAST_START: 'fast_start',
  ELITE_10: 'elite_10',
} as const;

export type IncentiveProgram = (typeof INCENTIVE_PROGRAMS)[keyof typeof INCENTIVE_PROGRAMS];

// ============================================
// APEX DRIVE (CAR BONUS) CONFIGURATION
// ============================================
export interface CarBonusTier {
  id: string;
  tierName: string;
  minMonthlyPremium: number;
  maxMonthlyPremium: number | null; // null = no cap (Elite tier)
  monthlyBonusAmount: number;
  annualValue: number;
  consecutiveMonthsRequired: number;
}

export const CAR_BONUS_TIERS: CarBonusTier[] = [
  {
    id: 'silver',
    tierName: 'Silver',
    minMonthlyPremium: 15000,
    maxMonthlyPremium: 24999.99,
    monthlyBonusAmount: 300,
    annualValue: 3600,
    consecutiveMonthsRequired: 3,
  },
  {
    id: 'gold',
    tierName: 'Gold',
    minMonthlyPremium: 25000,
    maxMonthlyPremium: 39999.99,
    monthlyBonusAmount: 500,
    annualValue: 6000,
    consecutiveMonthsRequired: 3,
  },
  {
    id: 'platinum',
    tierName: 'Platinum',
    minMonthlyPremium: 40000,
    maxMonthlyPremium: 59999.99,
    monthlyBonusAmount: 800,
    annualValue: 9600,
    consecutiveMonthsRequired: 3,
  },
  {
    id: 'elite',
    tierName: 'Elite',
    minMonthlyPremium: 60000,
    maxMonthlyPremium: null, // No cap
    monthlyBonusAmount: 1200,
    annualValue: 14400,
    consecutiveMonthsRequired: 3,
  },
];

export const CAR_BONUS_CONFIG = {
  // Quality gate requirements
  minPlacementRatio: 60, // 60%
  minPersistencyRatio: 80, // 80%
  noChargebacks: true,

  // Tier management
  warningAfterMissedMonths: 1,
  dropTierAfterMissedMonths: 2,

  // Payout schedule
  payoutDayOfMonth: 15, // Paid on 15th of following month
} as const;

// ============================================
// APEX IGNITION (FAST START) CONFIGURATION
// ============================================
export interface FastStartMilestone {
  id: string;
  milestoneName: string;
  milestoneType: 'first_policy' | 'premium_threshold';
  premiumThreshold: number | null;
  daysLimit: number;
  bonusAmount: number;
}

export const FAST_START_MILESTONES: FastStartMilestone[] = [
  {
    id: 'first_policy',
    milestoneName: 'First Policy Placed',
    milestoneType: 'first_policy',
    premiumThreshold: null,
    daysLimit: 30,
    bonusAmount: 100,
  },
  {
    id: 'premium_5k',
    milestoneName: '$5,000 Premium',
    milestoneType: 'premium_threshold',
    premiumThreshold: 5000,
    daysLimit: 45,
    bonusAmount: 150,
  },
  {
    id: 'premium_10k',
    milestoneName: '$10,000 Premium',
    milestoneType: 'premium_threshold',
    premiumThreshold: 10000,
    daysLimit: 60,
    bonusAmount: 250,
  },
  {
    id: 'premium_25k',
    milestoneName: '$25,000 Premium',
    milestoneType: 'premium_threshold',
    premiumThreshold: 25000,
    daysLimit: 90,
    bonusAmount: 500,
  },
];

export const FAST_START_CONFIG = {
  // Program window
  windowDays: 90,

  // Max possible total
  maxTotalBonus: 1000, // $100 + $150 + $250 + $500

  // Recruiter match
  recruiterMatchPercentage: 25, // 25% of recruit's bonus

  // Payout schedule
  payoutWithinDays: 7, // Paid within 7 days of achievement
} as const;

// ============================================
// ELITE 10 CONFIGURATION
// ============================================
export interface Elite10ScoreWeight {
  metric: string;
  weight: number;
  description: string;
}

export const ELITE_10_SCORE_WEIGHTS: Elite10ScoreWeight[] = [
  {
    metric: 'total_premium',
    weight: 0.40, // 40%
    description: 'Total Premium Placed',
  },
  {
    metric: 'policy_count',
    weight: 0.20, // 20%
    description: 'Number of Policies Written',
  },
  {
    metric: 'close_ratio',
    weight: 0.20, // 20%
    description: 'Closing Ratio (Apps to Placements)',
  },
  {
    metric: 'quality',
    weight: 0.20, // 20%
    description: 'Quality (Persistency + Placement)',
  },
];

export interface Elite10AssistBonus {
  minPremium: number;
  maxPremium: number | null;
  flatBonus: number;
}

export const ELITE_10_ASSIST_BONUSES: Elite10AssistBonus[] = [
  { minPremium: 0, maxPremium: 2500, flatBonus: 50 },
  { minPremium: 2500, maxPremium: 5000, flatBonus: 75 },
  { minPremium: 5000, maxPremium: null, flatBonus: 100 },
];

export const ELITE_10_CONFIG = {
  // Eligibility requirements
  minRank: 'agent', // Must be Agent rank or higher
  minPlacementRatio: 60, // 60%
  minPersistencyRatio: 80, // 80%

  // Selection
  topAgentsCount: 10,

  // Bonuses
  quarterlyBonus: 500, // $500 per quarter for selection
  assistOverridePercentage: 1, // 1% override on assisted deals

  // Hall of Fame
  hallOfFameQuartersRequired: 4, // 4+ quarters = Hall of Fame

  // Payout schedule
  quarterlyPayoutWithinDays: 14, // Quarterly bonus paid within 14 days
  assistPayoutSchedule: 'weekly', // Assist bonuses paid weekly
} as const;

// ============================================
// QUALITY GATES (Shared across programs)
// ============================================
export const QUALITY_GATES = {
  minPlacementRatio: 60,
  minPersistencyRatio: 80,
  noChargebacks: true,
} as const;

// ============================================
// PAYOUT STATUSES
// ============================================
export const PAYOUT_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SUBMITTED: 'submitted', // Submitted to SmartOffice
  PAID: 'paid',
  FAILED: 'failed',
} as const;

export type PayoutStatus = (typeof PAYOUT_STATUSES)[keyof typeof PAYOUT_STATUSES];

// ============================================
// ASSIST REQUEST STATUSES
// ============================================
export const ASSIST_STATUSES = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
  DECLINED: 'declined',
  EXPIRED: 'expired',
} as const;

export type AssistStatus = (typeof ASSIST_STATUSES)[keyof typeof ASSIST_STATUSES];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the car bonus tier for a given monthly premium amount
 */
export function getCarBonusTier(monthlyPremium: number): CarBonusTier | null {
  return (
    CAR_BONUS_TIERS.find(
      (tier) =>
        monthlyPremium >= tier.minMonthlyPremium &&
        (tier.maxMonthlyPremium === null || monthlyPremium <= tier.maxMonthlyPremium)
    ) ?? null
  );
}

/**
 * Get the next higher car bonus tier from current tier
 */
export function getNextCarBonusTier(currentTierName: string): CarBonusTier | null {
  const currentIndex = CAR_BONUS_TIERS.findIndex((t) => t.tierName === currentTierName);
  if (currentIndex === -1 || currentIndex >= CAR_BONUS_TIERS.length - 1) {
    return null;
  }
  return CAR_BONUS_TIERS[currentIndex + 1];
}

/**
 * Get fast start milestones available for an agent based on days since start
 */
export function getAvailableFastStartMilestones(daysSinceStart: number): FastStartMilestone[] {
  if (daysSinceStart > FAST_START_CONFIG.windowDays) {
    return [];
  }
  return FAST_START_MILESTONES.filter((m) => daysSinceStart <= m.daysLimit);
}

/**
 * Calculate the assist bonus amount based on policy premium
 */
export function calculateAssistBonus(policyPremium: number): number {
  const tier = ELITE_10_ASSIST_BONUSES.find(
    (t) =>
      policyPremium >= t.minPremium && (t.maxPremium === null || policyPremium < t.maxPremium)
  );
  return tier?.flatBonus ?? 50;
}

/**
 * Calculate total possible fast start bonus
 */
export function calculateMaxFastStartBonus(): number {
  return FAST_START_MILESTONES.reduce((total, m) => total + m.bonusAmount, 0);
}

/**
 * Check if an agent passes quality gates
 */
export function passesQualityGates(
  placementRatio: number,
  persistencyRatio: number,
  hasChargebacks: boolean
): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (placementRatio < QUALITY_GATES.minPlacementRatio) {
    reasons.push(`Placement ratio ${placementRatio}% below minimum ${QUALITY_GATES.minPlacementRatio}%`);
  }

  if (persistencyRatio < QUALITY_GATES.minPersistencyRatio) {
    reasons.push(`Persistency ratio ${persistencyRatio}% below minimum ${QUALITY_GATES.minPersistencyRatio}%`);
  }

  if (hasChargebacks && QUALITY_GATES.noChargebacks) {
    reasons.push('Has chargebacks in measurement period');
  }

  return {
    passed: reasons.length === 0,
    reasons,
  };
}

/**
 * Get the current quarter name (e.g., "Q1 2026")
 */
export function getCurrentQuarterName(date: Date = new Date()): string {
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  const year = date.getFullYear();
  return `Q${quarter} ${year}`;
}

/**
 * Get quarter start and end dates
 */
export function getQuarterDates(quarterName: string): { startDate: Date; endDate: Date } | null {
  const match = quarterName.match(/Q(\d) (\d{4})/);
  if (!match) return null;

  const quarter = parseInt(match[1]);
  const year = parseInt(match[2]);

  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0); // Last day of quarter

  return { startDate, endDate };
}
