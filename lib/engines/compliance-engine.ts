/**
 * Compliance Engine
 * Handles compliance holds, suspicious activity detection, and regulatory requirements
 *
 * Features:
 * - Commission holds pending compliance review
 * - Suspicious activity pattern detection
 * - Documentation requirements
 * - Approval workflows
 * - Audit trail
 */

import { Agent, Commission, Payout } from '../types/database';

export type ComplianceHoldType =
  | 'new_agent_review'
  | 'high_volume_threshold'
  | 'suspicious_activity'
  | 'documentation_required'
  | 'regulatory_review'
  | 'fraud_investigation'
  | 'family_stacking'
  | 'circular_sponsorship'
  | 'rapid_advancement';

export type ComplianceHoldStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'escalated';

export interface ComplianceHold {
  id?: string;
  agent_id: string;
  hold_type: ComplianceHoldType;
  status: ComplianceHoldStatus;
  reason: string;
  affected_amount: number;
  affected_commissions: string[]; // Commission IDs
  affected_payouts: string[]; // Payout IDs
  documentation_required: string[];
  documentation_provided: string[];
  assigned_to: string | null; // Admin user ID
  notes: string;
  resolution: string | null;
  created_at?: string;
  updated_at?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface ComplianceConfig {
  // New agent hold period (days)
  newAgentHoldDays: number;
  // High volume threshold (triggers review)
  highVolumeThreshold: number;
  // Rapid advancement window (days)
  rapidAdvancementDays: number;
  // Maximum ranks to advance in rapid window
  maxRanksInWindow: number;
  // Self-purchase limit (% of agent's volume)
  selfPurchaseLimit: number;
  // Family stacking check enabled
  checkFamilyStacking: boolean;
  // Circular sponsorship check enabled
  checkCircularSponsorship: boolean;
}

export const DEFAULT_COMPLIANCE_CONFIG: ComplianceConfig = {
  newAgentHoldDays: 30,
  highVolumeThreshold: 10000,
  rapidAdvancementDays: 30,
  maxRanksInWindow: 2,
  selfPurchaseLimit: 0.25, // 25%
  checkFamilyStacking: true,
  checkCircularSponsorship: true,
};

export interface SuspiciousActivityCheck {
  isSuspicious: boolean;
  flags: {
    type: ComplianceHoldType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    data: Record<string, unknown>;
  }[];
  requiresHold: boolean;
}

/**
 * Check for suspicious activity patterns
 */
export function checkSuspiciousActivity(
  agent: Agent,
  recentCommissions: Commission[],
  config: ComplianceConfig = DEFAULT_COMPLIANCE_CONFIG
): SuspiciousActivityCheck {
  const flags: SuspiciousActivityCheck['flags'] = [];

  // Check 1: High volume in short period
  const totalVolume = recentCommissions.reduce(
    (sum, c) => sum + c.commission_amount,
    0
  );

  if (totalVolume > config.highVolumeThreshold) {
    flags.push({
      type: 'high_volume_threshold',
      severity: totalVolume > config.highVolumeThreshold * 2 ? 'high' : 'medium',
      description: `Volume of $${totalVolume.toFixed(2)} exceeds threshold of $${config.highVolumeThreshold}`,
      data: { totalVolume, threshold: config.highVolumeThreshold },
    });
  }

  // Check 2: New agent with high activity
  const agentCreatedAt = new Date(agent.created_at);
  const daysSinceCreation = Math.floor(
    (Date.now() - agentCreatedAt.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (daysSinceCreation < config.newAgentHoldDays && totalVolume > 1000) {
    flags.push({
      type: 'new_agent_review',
      severity: 'medium',
      description: `New agent (${daysSinceCreation} days) with significant volume`,
      data: { daysSinceCreation, totalVolume },
    });
  }

  // Check 3: Unusual commission patterns
  const commissionTimes = recentCommissions.map((c) => new Date(c.created_at).getTime());
  const burstCommissions = detectBurstPattern(commissionTimes);

  if (burstCommissions) {
    flags.push({
      type: 'suspicious_activity',
      severity: 'high',
      description: 'Unusual burst of commissions detected',
      data: burstCommissions,
    });
  }

  // Determine if hold is required
  const requiresHold = flags.some(
    (f) => f.severity === 'high' || f.severity === 'critical'
  );

  return {
    isSuspicious: flags.length > 0,
    flags,
    requiresHold,
  };
}

/**
 * Detect burst patterns in commission timestamps
 */
function detectBurstPattern(
  timestamps: number[]
): { count: number; windowMinutes: number } | null {
  if (timestamps.length < 5) return null;

  // Sort timestamps
  const sorted = [...timestamps].sort((a, b) => a - b);

  // Check for 5+ commissions within 10 minutes
  for (let i = 0; i <= sorted.length - 5; i++) {
    const windowStart = sorted[i];
    const windowEnd = sorted[i + 4];
    const windowMinutes = (windowEnd - windowStart) / (60 * 1000);

    if (windowMinutes <= 10) {
      return { count: 5, windowMinutes: Math.round(windowMinutes) };
    }
  }

  return null;
}

/**
 * Check for family stacking (multiple accounts from same household)
 */
export function checkFamilyStacking(
  agent: Agent,
  allAgents: Agent[],
  sharedIdentifiers: {
    addresses: string[];
    phones: string[];
    ipAddresses: string[];
  }
): {
  isFamilyStacking: boolean;
  relatedAgents: string[];
  sharedData: string[];
} {
  const relatedAgents: string[] = [];
  const sharedData: string[] = [];

  for (const other of allAgents) {
    if (other.id === agent.id) continue;

    // Check shared phone
    if (agent.phone && other.phone && agent.phone === other.phone) {
      relatedAgents.push(other.id);
      sharedData.push(`Same phone: ${agent.phone}`);
    }

    // Check shared email domain (for family domains)
    if (agent.email && other.email) {
      const agentDomain = agent.email.split('@')[1];
      const otherDomain = other.email.split('@')[1];

      // Skip common providers
      const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      if (!commonProviders.includes(agentDomain) && agentDomain === otherDomain) {
        relatedAgents.push(other.id);
        sharedData.push(`Same email domain: ${agentDomain}`);
      }
    }

    // Check if in same upline/downline with suspicious pattern
    if (agent.sponsor_id === other.id || other.sponsor_id === agent.id) {
      // Check for same-day joins (suspicious)
      const agentJoin = new Date(agent.created_at).toDateString();
      const otherJoin = new Date(other.created_at).toDateString();

      if (agentJoin === otherJoin) {
        relatedAgents.push(other.id);
        sharedData.push('Same-day signup in same line');
      }
    }
  }

  return {
    isFamilyStacking: relatedAgents.length > 0,
    relatedAgents: [...new Set(relatedAgents)],
    sharedData: [...new Set(sharedData)],
  };
}

/**
 * Check for circular sponsorship patterns
 */
export function checkCircularSponsorship(
  agentId: string,
  getUpline: (id: string) => string | null
): { isCircular: boolean; chain: string[] } {
  const visited = new Set<string>();
  const chain: string[] = [agentId];
  let currentId: string | null = agentId;

  while (currentId) {
    const sponsorId = getUpline(currentId);

    if (!sponsorId) break;

    if (visited.has(sponsorId)) {
      // Found circular reference
      chain.push(sponsorId);
      return { isCircular: true, chain };
    }

    visited.add(sponsorId);
    chain.push(sponsorId);
    currentId = sponsorId;

    // Safety limit
    if (chain.length > 100) break;
  }

  return { isCircular: false, chain: [] };
}

/**
 * Create a compliance hold
 */
export function createComplianceHold(
  agentId: string,
  holdType: ComplianceHoldType,
  reason: string,
  affectedAmount: number,
  affectedCommissions: string[] = [],
  affectedPayouts: string[] = []
): Omit<ComplianceHold, 'id' | 'created_at' | 'updated_at'> {
  const documentationRequired = getRequiredDocumentation(holdType);

  return {
    agent_id: agentId,
    hold_type: holdType,
    status: 'pending',
    reason,
    affected_amount: affectedAmount,
    affected_commissions: affectedCommissions,
    affected_payouts: affectedPayouts,
    documentation_required: documentationRequired,
    documentation_provided: [],
    assigned_to: null,
    notes: '',
    resolution: null,
  };
}

/**
 * Get required documentation for hold type
 */
export function getRequiredDocumentation(holdType: ComplianceHoldType): string[] {
  const requirements: Record<ComplianceHoldType, string[]> = {
    new_agent_review: ['Government ID', 'Proof of address'],
    high_volume_threshold: ['Source of customers', 'Sales documentation'],
    suspicious_activity: ['Activity explanation', 'Customer verification'],
    documentation_required: ['Specified documents'],
    regulatory_review: ['License verification', 'Background check'],
    fraud_investigation: ['All transaction records', 'Customer communications'],
    family_stacking: ['Household verification', 'Independent operation proof'],
    circular_sponsorship: ['Sponsorship explanation', 'Relationship disclosure'],
    rapid_advancement: ['Sales verification', 'Customer documentation'],
  };

  return requirements[holdType] || [];
}

/**
 * Check if payout can proceed
 */
export function canProcessPayout(
  agentId: string,
  activeHolds: ComplianceHold[]
): { allowed: boolean; blockedBy: ComplianceHold[] } {
  const blockedBy = activeHolds.filter(
    (hold) =>
      hold.agent_id === agentId &&
      hold.status !== 'approved' &&
      hold.status !== 'rejected'
  );

  return {
    allowed: blockedBy.length === 0,
    blockedBy,
  };
}

/**
 * Calculate hold statistics
 */
export function calculateHoldStatistics(holds: ComplianceHold[]): {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  escalated: number;
  totalAmountHeld: number;
  averageResolutionDays: number;
  byType: Record<ComplianceHoldType, number>;
} {
  const stats = {
    total: holds.length,
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    escalated: 0,
    totalAmountHeld: 0,
    averageResolutionDays: 0,
    byType: {} as Record<ComplianceHoldType, number>,
  };

  let resolvedCount = 0;
  let totalResolutionTime = 0;

  for (const hold of holds) {
    // Count by status
    stats[hold.status === 'under_review' ? 'underReview' : hold.status]++;

    // Sum held amount for active holds
    if (hold.status !== 'approved' && hold.status !== 'rejected') {
      stats.totalAmountHeld += hold.affected_amount;
    }

    // Count by type
    stats.byType[hold.hold_type] = (stats.byType[hold.hold_type] || 0) + 1;

    // Calculate resolution time
    if (hold.resolved_at && hold.created_at) {
      const created = new Date(hold.created_at).getTime();
      const resolved = new Date(hold.resolved_at).getTime();
      totalResolutionTime += resolved - created;
      resolvedCount++;
    }
  }

  if (resolvedCount > 0) {
    stats.averageResolutionDays = Math.round(
      totalResolutionTime / resolvedCount / (24 * 60 * 60 * 1000)
    );
  }

  return stats;
}

/**
 * Get compliance score for an agent
 */
export function getComplianceScore(
  agent: Agent,
  holds: ComplianceHold[]
): {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  factors: { factor: string; impact: number }[];
} {
  let score = 100;
  const factors: { factor: string; impact: number }[] = [];

  // Deduct for active holds
  const activeHolds = holds.filter(
    (h) => h.agent_id === agent.id && h.status !== 'approved'
  );

  for (const hold of activeHolds) {
    const deduction = hold.status === 'escalated' ? 30 : 15;
    score -= deduction;
    factors.push({ factor: `Active hold: ${hold.hold_type}`, impact: -deduction });
  }

  // Deduct for rejected holds (historical issues)
  const rejectedHolds = holds.filter(
    (h) => h.agent_id === agent.id && h.status === 'rejected'
  );

  for (const hold of rejectedHolds) {
    score -= 10;
    factors.push({ factor: `Past rejection: ${hold.hold_type}`, impact: -10 });
  }

  // Bonus for approved holds (showed compliance)
  const approvedHolds = holds.filter(
    (h) => h.agent_id === agent.id && h.status === 'approved'
  );

  if (approvedHolds.length > 0) {
    const bonus = Math.min(approvedHolds.length * 2, 10);
    score = Math.min(100, score + bonus);
    factors.push({ factor: 'Approved compliance reviews', impact: bonus });
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  if (score >= 90) level = 'excellent';
  else if (score >= 75) level = 'good';
  else if (score >= 50) level = 'fair';
  else if (score >= 25) level = 'poor';
  else level = 'critical';

  return { score, level, factors };
}

/**
 * Format compliance hold for display
 */
export function formatComplianceHoldSummary(hold: ComplianceHold): string {
  const lines: string[] = [
    `COMPLIANCE HOLD: ${hold.hold_type}`,
    '='.repeat(50),
    `Status: ${hold.status.toUpperCase()}`,
    `Amount Affected: $${hold.affected_amount.toFixed(2)}`,
    `Reason: ${hold.reason}`,
    '',
    'Required Documentation:',
  ];

  for (const doc of hold.documentation_required) {
    const provided = hold.documentation_provided.includes(doc);
    lines.push(`  ${provided ? '✓' : '○'} ${doc}`);
  }

  if (hold.notes) {
    lines.push('');
    lines.push(`Notes: ${hold.notes}`);
  }

  if (hold.resolution) {
    lines.push('');
    lines.push(`Resolution: ${hold.resolution}`);
  }

  return lines.join('\n');
}
