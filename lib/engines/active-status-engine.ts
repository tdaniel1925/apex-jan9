/**
 * Active Status Engine
 * Handles automatic agent status transitions based on activity rules
 *
 * Features:
 * - Automatic deactivation after inactivity
 * - Minimum volume requirements
 * - Reactivation rules
 * - Status change notifications
 */

import { Agent } from '../types/database';

export type AgentStatus = 'pending' | 'active' | 'inactive' | 'terminated';

export type InactivityReason =
  | 'no_sales'
  | 'below_minimum_volume'
  | 'no_login'
  | 'failed_compliance'
  | 'manual_deactivation'
  | 'subscription_lapsed';

export interface StatusChangeEvent {
  agentId: string;
  previousStatus: AgentStatus;
  newStatus: AgentStatus;
  reason: string;
  triggeredBy: 'system' | 'admin' | 'agent';
  metadata?: Record<string, unknown>;
}

export interface ActiveStatusConfig {
  // Days without a sale before marking inactive
  inactivityDays: number;
  // Minimum personal volume per period to stay active
  minimumPersonalVolume: number;
  // Days without login before marking inactive
  noLoginDays: number;
  // Whether to auto-reactivate on new sale
  autoReactivateOnSale: boolean;
  // Warning days before deactivation
  warningDaysBefore: number;
  // Grace period after warning
  gracePeriodDays: number;
}

export const DEFAULT_ACTIVE_STATUS_CONFIG: ActiveStatusConfig = {
  inactivityDays: 90,
  minimumPersonalVolume: 0, // Set to 0 to disable
  noLoginDays: 180,
  autoReactivateOnSale: true,
  warningDaysBefore: 14,
  gracePeriodDays: 7,
};

export interface ActivityCheck {
  agentId: string;
  lastSaleDate: Date | null;
  lastLoginDate: Date | null;
  pbv90Days: number;
  currentStatus: AgentStatus;
}

export interface StatusEvaluation {
  shouldChange: boolean;
  newStatus: AgentStatus;
  reason: InactivityReason | null;
  warningOnly: boolean;
  daysUntilChange: number;
  recommendations: string[];
}

/**
 * Evaluate agent's activity and determine if status should change
 */
export function evaluateAgentStatus(
  activity: ActivityCheck,
  config: ActiveStatusConfig = DEFAULT_ACTIVE_STATUS_CONFIG
): StatusEvaluation {
  const now = new Date();
  const recommendations: string[] = [];

  // Already inactive or terminated - check for reactivation
  if (activity.currentStatus === 'inactive') {
    return evaluateReactivation(activity, config);
  }

  if (activity.currentStatus === 'terminated') {
    return {
      shouldChange: false,
      newStatus: 'terminated',
      reason: null,
      warningOnly: false,
      daysUntilChange: 0,
      recommendations: ['Agent is terminated and cannot be automatically reactivated'],
    };
  }

  if (activity.currentStatus === 'pending') {
    return {
      shouldChange: false,
      newStatus: 'pending',
      reason: null,
      warningOnly: false,
      daysUntilChange: 0,
      recommendations: ['Complete onboarding to become active'],
    };
  }

  // Check minimum volume requirement
  if (config.minimumPersonalVolume > 0) {
    if (activity.pbv90Days < config.minimumPersonalVolume) {
      const gap = config.minimumPersonalVolume - activity.pbv90Days;
      recommendations.push(`Generate ${gap} more PBV to meet minimum requirement`);

      return {
        shouldChange: true,
        newStatus: 'inactive',
        reason: 'below_minimum_volume',
        warningOnly: false,
        daysUntilChange: 0,
        recommendations,
      };
    }
  }

  // Check last sale date
  if (activity.lastSaleDate) {
    const daysSinceLastSale = Math.floor(
      (now.getTime() - activity.lastSaleDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Warning period
    const warningThreshold = config.inactivityDays - config.warningDaysBefore;
    if (daysSinceLastSale >= warningThreshold && daysSinceLastSale < config.inactivityDays) {
      const daysUntilInactive = config.inactivityDays - daysSinceLastSale;
      recommendations.push(`Make a sale within ${daysUntilInactive} days to stay active`);

      return {
        shouldChange: false,
        newStatus: 'active',
        reason: 'no_sales',
        warningOnly: true,
        daysUntilChange: daysUntilInactive,
        recommendations,
      };
    }

    // Deactivation threshold
    if (daysSinceLastSale >= config.inactivityDays) {
      return {
        shouldChange: true,
        newStatus: 'inactive',
        reason: 'no_sales',
        warningOnly: false,
        daysUntilChange: 0,
        recommendations: ['Make a sale to reactivate your account'],
      };
    }
  } else {
    // No sales ever recorded
    recommendations.push('Make your first sale to maintain active status');
  }

  // Check last login date (if configured)
  if (config.noLoginDays > 0 && activity.lastLoginDate) {
    const daysSinceLastLogin = Math.floor(
      (now.getTime() - activity.lastLoginDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysSinceLastLogin >= config.noLoginDays) {
      return {
        shouldChange: true,
        newStatus: 'inactive',
        reason: 'no_login',
        warningOnly: false,
        daysUntilChange: 0,
        recommendations: ['Log in to reactivate your account'],
      };
    }
  }

  return {
    shouldChange: false,
    newStatus: 'active',
    reason: null,
    warningOnly: false,
    daysUntilChange: 0,
    recommendations,
  };
}

/**
 * Evaluate if an inactive agent should be reactivated
 */
function evaluateReactivation(
  activity: ActivityCheck,
  config: ActiveStatusConfig
): StatusEvaluation {
  const now = new Date();

  if (!config.autoReactivateOnSale) {
    return {
      shouldChange: false,
      newStatus: 'inactive',
      reason: null,
      warningOnly: false,
      daysUntilChange: 0,
      recommendations: ['Contact admin to reactivate your account'],
    };
  }

  // Check if there's recent activity
  if (activity.lastSaleDate) {
    const daysSinceLastSale = Math.floor(
      (now.getTime() - activity.lastSaleDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysSinceLastSale < config.inactivityDays) {
      return {
        shouldChange: true,
        newStatus: 'active',
        reason: null,
        warningOnly: false,
        daysUntilChange: 0,
        recommendations: ['Welcome back! Your account has been reactivated.'],
      };
    }
  }

  // Check minimum volume if applicable
  if (config.minimumPersonalVolume > 0 && activity.pbv90Days >= config.minimumPersonalVolume) {
    return {
      shouldChange: true,
      newStatus: 'active',
      reason: null,
      warningOnly: false,
      daysUntilChange: 0,
      recommendations: ['Your account has been reactivated based on volume.'],
    };
  }

  return {
    shouldChange: false,
    newStatus: 'inactive',
    reason: null,
    warningOnly: false,
    daysUntilChange: 0,
    recommendations: ['Make a sale to reactivate your account'],
  };
}

/**
 * Create status change record for audit
 */
export function createStatusChangeRecord(
  agent: Agent,
  newStatus: AgentStatus,
  reason: InactivityReason | string,
  triggeredBy: 'system' | 'admin' | 'agent'
): StatusChangeEvent {
  return {
    agentId: agent.id,
    previousStatus: agent.status,
    newStatus,
    reason,
    triggeredBy,
    metadata: {
      pbv90Days: agent.pbv_90_days,
      rank: agent.rank,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Check if agent can perform specific actions based on status
 */
export function canPerformAction(
  status: AgentStatus,
  action: 'sell' | 'recruit' | 'earn_commission' | 'earn_override' | 'receive_payout'
): boolean {
  const permissions: Record<AgentStatus, Record<string, boolean>> = {
    pending: {
      sell: false,
      recruit: false,
      earn_commission: false,
      earn_override: false,
      receive_payout: false,
    },
    active: {
      sell: true,
      recruit: true,
      earn_commission: true,
      earn_override: true,
      receive_payout: true,
    },
    inactive: {
      sell: true, // Can still sell (to reactivate)
      recruit: false,
      earn_commission: true,
      earn_override: false, // No overrides when inactive
      receive_payout: true, // Can still receive pending payouts
    },
    terminated: {
      sell: false,
      recruit: false,
      earn_commission: false,
      earn_override: false,
      receive_payout: true, // Can receive final payout
    },
  };

  return permissions[status]?.[action] ?? false;
}

/**
 * Get agents at risk of deactivation
 */
export function identifyAtRiskAgents(
  agents: (Agent & { last_sale_date?: string; last_login_date?: string })[],
  config: ActiveStatusConfig = DEFAULT_ACTIVE_STATUS_CONFIG
): {
  agent: Agent;
  daysUntilDeactivation: number;
  reason: InactivityReason;
}[] {
  const atRisk: {
    agent: Agent;
    daysUntilDeactivation: number;
    reason: InactivityReason;
  }[] = [];

  const now = new Date();
  const warningThreshold = config.inactivityDays - config.warningDaysBefore;

  for (const agent of agents) {
    if (agent.status !== 'active') continue;

    // Check sales activity
    if (agent.last_sale_date) {
      const lastSale = new Date(agent.last_sale_date);
      const daysSinceLastSale = Math.floor(
        (now.getTime() - lastSale.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysSinceLastSale >= warningThreshold) {
        atRisk.push({
          agent,
          daysUntilDeactivation: Math.max(0, config.inactivityDays - daysSinceLastSale),
          reason: 'no_sales',
        });
        continue;
      }
    }

    // Check volume
    if (config.minimumPersonalVolume > 0 && agent.pbv_90_days < config.minimumPersonalVolume) {
      atRisk.push({
        agent,
        daysUntilDeactivation: 0, // Immediate if below minimum
        reason: 'below_minimum_volume',
      });
    }
  }

  // Sort by urgency
  atRisk.sort((a, b) => a.daysUntilDeactivation - b.daysUntilDeactivation);

  return atRisk;
}

/**
 * Format status change notification message
 */
export function formatStatusChangeMessage(event: StatusChangeEvent): {
  subject: string;
  body: string;
} {
  const statusMessages: Record<AgentStatus, { subject: string; body: string }> = {
    pending: {
      subject: 'Account Pending Activation',
      body: 'Your account is pending activation. Please complete your onboarding.',
    },
    active: {
      subject: 'Account Activated!',
      body: 'Great news! Your account is now active. You can start selling and recruiting.',
    },
    inactive: {
      subject: 'Account Marked Inactive',
      body: `Your account has been marked inactive due to: ${event.reason}. ` +
        'Make a sale to reactivate your account.',
    },
    terminated: {
      subject: 'Account Terminated',
      body: 'Your account has been terminated. Please contact support for more information.',
    },
  };

  return statusMessages[event.newStatus] || {
    subject: 'Account Status Changed',
    body: `Your account status has changed from ${event.previousStatus} to ${event.newStatus}.`,
  };
}

/**
 * Calculate days until status change
 */
export function getDaysUntilStatusChange(
  agent: Agent & { last_sale_date?: string },
  config: ActiveStatusConfig = DEFAULT_ACTIVE_STATUS_CONFIG
): number | null {
  if (agent.status !== 'active') return null;
  if (!agent.last_sale_date) return config.inactivityDays;

  const now = new Date();
  const lastSale = new Date(agent.last_sale_date);
  const daysSinceLastSale = Math.floor(
    (now.getTime() - lastSale.getTime()) / (24 * 60 * 60 * 1000)
  );

  const daysRemaining = config.inactivityDays - daysSinceLastSale;
  return Math.max(0, daysRemaining);
}
