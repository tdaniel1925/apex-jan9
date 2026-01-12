/**
 * Qualification Engine
 * Handles rank qualification, maintenance requirements, and grace periods
 *
 * Features:
 * - Monthly qualification snapshots
 * - "Paid-As" rank vs "Title" rank distinction
 * - Grace period handling
 * - Qualification carry-forward rules
 * - Re-qualification tracking
 */

import { Rank, RANK_CONFIG, RANKS } from '../config/ranks';
import { Agent } from '../types/database';

export type QualificationStatus =
  | 'qualified'
  | 'grace_period'
  | 'demoted'
  | 'pending_review';

export interface QualificationSnapshot {
  id?: string;
  agent_id: string;
  period_month: number; // 1-12
  period_year: number;
  title_rank: Rank; // Highest achieved rank (never goes down)
  paid_as_rank: Rank; // Rank paid as this period
  qualification_status: QualificationStatus;

  // Volume metrics at snapshot time
  personal_bonus_volume: number;
  organization_bonus_volume: number;
  pbv_90_days: number;
  obv_90_days: number;

  // Team metrics
  active_agents_count: number;
  personal_recruits_count: number;
  mgas_in_downline: number;

  // Grace period tracking
  grace_periods_used: number;
  grace_periods_remaining: number;
  consecutive_qualified_months: number;

  // Requirements met
  requirements_met: Record<string, boolean>;
  requirements_values: Record<string, number>;

  created_at?: string;
}

export interface QualificationConfig {
  // Maximum grace periods per year
  maxGracePeriodsPerYear: number;
  // Months of consecutive qualification to earn grace period
  monthsToEarnGracePeriod: number;
  // Whether to allow "paid-as" to exceed title rank during promotions
  allowPaidAsPromotion: boolean;
  // Minimum requirements for grace period eligibility
  graceMinimumPercentage: number; // e.g., 0.75 = must meet 75% of requirements
}

export const DEFAULT_QUALIFICATION_CONFIG: QualificationConfig = {
  maxGracePeriodsPerYear: 2,
  monthsToEarnGracePeriod: 6,
  allowPaidAsPromotion: true,
  graceMinimumPercentage: 0.75,
};

/**
 * Check if an agent meets requirements for a specific rank
 */
export function checkRankRequirements(
  agent: Agent,
  rank: Rank
): {
  met: boolean;
  requirements: Record<string, { required: number; actual: number; met: boolean }>;
  percentageMet: number;
} {
  const config = RANK_CONFIG[rank];
  const req = config.requirements;

  const requirements: Record<string, { required: number; actual: number; met: boolean }> = {
    premium90Days: {
      required: req.premium90Days,
      actual: agent.premium_90_days,
      met: agent.premium_90_days >= req.premium90Days,
    },
    activeAgents: {
      required: req.activeAgents,
      actual: agent.active_agents_count,
      met: agent.active_agents_count >= req.activeAgents,
    },
    personalRecruits: {
      required: req.personalRecruits,
      actual: agent.personal_recruits_count,
      met: agent.personal_recruits_count >= req.personalRecruits,
    },
    persistency: {
      required: config.persistencyRequired,
      actual: agent.persistency_rate,
      met: config.persistencyRequired === 0 || agent.persistency_rate >= config.persistencyRequired,
    },
    placement: {
      required: config.placementRequired,
      actual: agent.placement_rate,
      met: config.placementRequired === 0 || agent.placement_rate >= config.placementRequired,
    },
  };

  // Add MGA requirement if applicable
  if (req.mgasInDownline !== undefined) {
    requirements.mgasInDownline = {
      required: req.mgasInDownline,
      actual: agent.mgas_in_downline,
      met: agent.mgas_in_downline >= req.mgasInDownline,
    };
  }

  // Calculate percentage met
  const totalReqs = Object.keys(requirements).length;
  const metReqs = Object.values(requirements).filter((r) => r.met).length;
  const percentageMet = totalReqs > 0 ? metReqs / totalReqs : 1;

  const allMet = Object.values(requirements).every((r) => r.met);

  return {
    met: allMet,
    requirements,
    percentageMet,
  };
}

/**
 * Determine paid-as rank for the period
 */
export function determinePaidAsRank(
  agent: Agent,
  previousSnapshot: QualificationSnapshot | null,
  config: QualificationConfig = DEFAULT_QUALIFICATION_CONFIG
): {
  paidAsRank: Rank;
  status: QualificationStatus;
  usedGracePeriod: boolean;
  message: string;
} {
  const titleRank = agent.rank;
  const requirements = checkRankRequirements(agent, titleRank);

  // Fully qualified for current rank
  if (requirements.met) {
    return {
      paidAsRank: titleRank,
      status: 'qualified',
      usedGracePeriod: false,
      message: `Qualified for ${titleRank}`,
    };
  }

  // Check grace period eligibility
  const gracePeriodsUsed = previousSnapshot?.grace_periods_used || 0;
  const gracePeriodsRemaining = config.maxGracePeriodsPerYear - gracePeriodsUsed;
  const meetsGraceMinimum = requirements.percentageMet >= config.graceMinimumPercentage;

  if (gracePeriodsRemaining > 0 && meetsGraceMinimum) {
    return {
      paidAsRank: titleRank,
      status: 'grace_period',
      usedGracePeriod: true,
      message: `Grace period used (${gracePeriodsRemaining - 1} remaining)`,
    };
  }

  // Find the highest rank the agent qualifies for
  let qualifiedRank: Rank = 'pre_associate';
  for (const rank of RANKS) {
    const rankReqs = checkRankRequirements(agent, rank);
    if (rankReqs.met) {
      qualifiedRank = rank;
    } else {
      break;
    }
  }

  return {
    paidAsRank: qualifiedRank,
    status: 'demoted',
    usedGracePeriod: false,
    message: `Paid as ${qualifiedRank} (did not meet ${titleRank} requirements)`,
  };
}

/**
 * Create qualification snapshot for the period
 */
export function createQualificationSnapshot(
  agent: Agent,
  month: number,
  year: number,
  previousSnapshot: QualificationSnapshot | null,
  config: QualificationConfig = DEFAULT_QUALIFICATION_CONFIG
): QualificationSnapshot {
  const determination = determinePaidAsRank(agent, previousSnapshot, config);
  const requirements = checkRankRequirements(agent, agent.rank);

  // Calculate grace periods
  let gracePeriodUsedThisYear = previousSnapshot?.grace_periods_used || 0;
  if (determination.usedGracePeriod) {
    gracePeriodUsedThisYear++;
  }

  // Reset at year boundary
  if (month === 1 && previousSnapshot && previousSnapshot.period_month === 12) {
    gracePeriodUsedThisYear = determination.usedGracePeriod ? 1 : 0;
  }

  // Calculate consecutive qualified months
  let consecutiveMonths = previousSnapshot?.consecutive_qualified_months || 0;
  if (determination.status === 'qualified') {
    consecutiveMonths++;
  } else {
    consecutiveMonths = 0;
  }

  return {
    agent_id: agent.id,
    period_month: month,
    period_year: year,
    title_rank: agent.rank,
    paid_as_rank: determination.paidAsRank,
    qualification_status: determination.status,
    personal_bonus_volume: agent.personal_bonus_volume,
    organization_bonus_volume: agent.organization_bonus_volume,
    pbv_90_days: agent.pbv_90_days,
    obv_90_days: agent.obv_90_days,
    active_agents_count: agent.active_agents_count,
    personal_recruits_count: agent.personal_recruits_count,
    mgas_in_downline: agent.mgas_in_downline,
    grace_periods_used: gracePeriodUsedThisYear,
    grace_periods_remaining: config.maxGracePeriodsPerYear - gracePeriodUsedThisYear,
    consecutive_qualified_months: consecutiveMonths,
    requirements_met: Object.fromEntries(
      Object.entries(requirements.requirements).map(([k, v]) => [k, v.met])
    ),
    requirements_values: Object.fromEntries(
      Object.entries(requirements.requirements).map(([k, v]) => [k, v.actual])
    ),
  };
}

/**
 * Get qualification trend for an agent
 */
export function getQualificationTrend(
  snapshots: QualificationSnapshot[]
): {
  trend: 'improving' | 'stable' | 'declining';
  averagePercentageMet: number;
  consecutiveQualified: number;
  consecutiveDemoted: number;
} {
  if (snapshots.length === 0) {
    return {
      trend: 'stable',
      averagePercentageMet: 0,
      consecutiveQualified: 0,
      consecutiveDemoted: 0,
    };
  }

  // Sort by date (newest first)
  const sorted = [...snapshots].sort((a, b) => {
    if (a.period_year !== b.period_year) {
      return b.period_year - a.period_year;
    }
    return b.period_month - a.period_month;
  });

  // Calculate metrics
  let consecutiveQualified = 0;
  let consecutiveDemoted = 0;

  for (const snapshot of sorted) {
    if (snapshot.qualification_status === 'qualified') {
      if (consecutiveDemoted === 0) {
        consecutiveQualified++;
      }
    } else if (snapshot.qualification_status === 'demoted') {
      if (consecutiveQualified === 0) {
        consecutiveDemoted++;
      }
    }

    if (consecutiveQualified > 0 && consecutiveDemoted > 0) {
      break;
    }
  }

  // Calculate average percentage met
  const totalPercentage = snapshots.reduce((sum, s) => {
    const reqMet = Object.values(s.requirements_met).filter(Boolean).length;
    const totalReqs = Object.keys(s.requirements_met).length;
    return sum + (totalReqs > 0 ? reqMet / totalReqs : 1);
  }, 0);
  const averagePercentageMet = totalPercentage / snapshots.length;

  // Determine trend
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (sorted.length >= 3) {
    const recent = sorted.slice(0, 3);
    const qualifiedCount = recent.filter(
      (s) => s.qualification_status === 'qualified'
    ).length;
    const demotedCount = recent.filter(
      (s) => s.qualification_status === 'demoted'
    ).length;

    if (qualifiedCount >= 2 && consecutiveQualified >= 2) {
      trend = 'improving';
    } else if (demotedCount >= 2 && consecutiveDemoted >= 2) {
      trend = 'declining';
    }
  }

  return {
    trend,
    averagePercentageMet,
    consecutiveQualified,
    consecutiveDemoted,
  };
}

/**
 * Check if agent is at risk of demotion next period
 */
export function isDemotionRisk(
  agent: Agent,
  snapshot: QualificationSnapshot | null,
  config: QualificationConfig = DEFAULT_QUALIFICATION_CONFIG
): {
  atRisk: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
} {
  const requirements = checkRankRequirements(agent, agent.rank);
  const reasons: string[] = [];

  // Already not qualified
  if (!requirements.met) {
    // Check grace period availability
    const gracePeriods = snapshot?.grace_periods_remaining || config.maxGracePeriodsPerYear;
    const meetsMinimum = requirements.percentageMet >= config.graceMinimumPercentage;

    if (gracePeriods === 0) {
      reasons.push('No grace periods remaining');
      return { atRisk: true, riskLevel: 'high', reasons };
    }

    if (!meetsMinimum) {
      reasons.push(`Only meeting ${(requirements.percentageMet * 100).toFixed(0)}% of requirements`);
      return { atRisk: true, riskLevel: 'high', reasons };
    }

    if (gracePeriods === 1) {
      reasons.push('Last grace period available');
      return { atRisk: true, riskLevel: 'medium', reasons };
    }

    return { atRisk: true, riskLevel: 'low', reasons: ['Using grace period'] };
  }

  // Check if close to failing requirements
  Object.entries(requirements.requirements).forEach(([key, value]) => {
    if (value.required > 0) {
      const ratio = value.actual / value.required;
      if (ratio < 1.1) {
        reasons.push(`${key} is close to minimum (${value.actual}/${value.required})`);
      }
    }
  });

  if (reasons.length > 0) {
    return { atRisk: true, riskLevel: 'low', reasons };
  }

  return { atRisk: false, riskLevel: 'low', reasons: [] };
}

/**
 * Get recommendations for maintaining qualification
 */
export function getQualificationRecommendations(
  agent: Agent,
  snapshot: QualificationSnapshot | null
): { priority: 'high' | 'medium' | 'low'; action: string; metric: string; gap: number }[] {
  const requirements = checkRankRequirements(agent, agent.rank);
  const recommendations: { priority: 'high' | 'medium' | 'low'; action: string; metric: string; gap: number }[] = [];

  Object.entries(requirements.requirements).forEach(([key, value]) => {
    if (!value.met) {
      const gap = value.required - value.actual;
      recommendations.push({
        priority: 'high',
        action: `Increase ${key} by ${gap}`,
        metric: key,
        gap,
      });
    } else if (value.required > 0) {
      const buffer = value.actual - value.required;
      const bufferPercentage = buffer / value.required;

      if (bufferPercentage < 0.1) {
        recommendations.push({
          priority: 'medium',
          action: `Build buffer for ${key} (currently only ${(bufferPercentage * 100).toFixed(0)}% above minimum)`,
          metric: key,
          gap: Math.ceil(value.required * 0.1 - buffer),
        });
      }
    }
  });

  // Sort by priority
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

/**
 * Format qualification summary for display
 */
export function formatQualificationSummary(snapshot: QualificationSnapshot): string {
  const lines: string[] = [
    `QUALIFICATION SUMMARY - ${snapshot.period_month}/${snapshot.period_year}`,
    '='.repeat(50),
    '',
    `Title Rank: ${snapshot.title_rank}`,
    `Paid As: ${snapshot.paid_as_rank}`,
    `Status: ${snapshot.qualification_status}`,
    '',
    'Requirements:',
  ];

  Object.entries(snapshot.requirements_met).forEach(([key, met]) => {
    const value = snapshot.requirements_values[key];
    const icon = met ? '✓' : '✗';
    lines.push(`  ${icon} ${key}: ${value}`);
  });

  lines.push('');
  lines.push(`Grace Periods Remaining: ${snapshot.grace_periods_remaining}`);
  lines.push(`Consecutive Qualified Months: ${snapshot.consecutive_qualified_months}`);

  return lines.join('\n');
}
