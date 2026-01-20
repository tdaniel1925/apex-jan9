/**
 * Admin Audit Logging Service
 * Compliance requirement: Log all administrative actions
 *
 * Phase 2 - Issue #16: Admin Audit Logging
 */

import { createAdminClient } from '@/lib/db/supabase-server';
import { NextRequest } from 'next/server';

export interface AdminAuditLog {
  admin_id: string;
  admin_email: string;
  action: string;
  resource_type: 'agent' | 'commission' | 'payout' | 'bonus' | 'wallet' | 'override' | 'training' | 'system';
  resource_id: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    fields?: string[];
  };
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an admin action to the audit trail
 * Required for SOX, financial audits, and compliance
 */
export async function logAdminAction(
  log: AdminAuditLog,
  request?: NextRequest
): Promise<void> {
  const supabase = createAdminClient();

  try {
    // Extract IP and user agent from request if provided
    const ipAddress = request
      ? (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         log.ip_address)
      : log.ip_address;

    const userAgent = request
      ? request.headers.get('user-agent') || log.user_agent
      : log.user_agent;

    // Use the database function for logging
    await supabase.rpc('log_admin_action' as never, {
      p_admin_id: log.admin_id,
      p_admin_email: log.admin_email,
      p_action: log.action,
      p_resource_type: log.resource_type,
      p_resource_id: log.resource_id,
      p_changes: log.changes || null,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null,
    } as never);

  } catch (error) {
    // Don't fail the request if audit logging fails
    // But log the error for investigation
    console.error('Failed to log admin action:', error);
    console.error('Audit log data:', log);
  }
}

/**
 * Create a diff of changes between before and after objects
 */
export function createChangeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  fields: string[];
} {
  const changes: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    fields: string[];
  } = {
    before: {},
    after: {},
    fields: [],
  };

  // Find all changed fields
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    if (before[key] !== after[key]) {
      changes.before[key] = before[key];
      changes.after[key] = after[key];
      changes.fields.push(key);
    }
  }

  return changes;
}

/**
 * Common admin actions for type safety
 */
export const AdminActions = {
  // Agent actions
  AGENT_UPDATE: 'update_agent',
  AGENT_RANK_CHANGE: 'change_agent_rank',
  AGENT_SUSPEND: 'suspend_agent',
  AGENT_ACTIVATE: 'activate_agent',
  AGENT_DELETE: 'delete_agent',

  // Commission actions
  COMMISSION_CREATE: 'create_commission',
  COMMISSION_UPDATE: 'update_commission',
  COMMISSION_DELETE: 'delete_commission',
  COMMISSION_APPROVE: 'approve_commission',
  COMMISSION_REJECT: 'reject_commission',
  COMMISSION_IMPORT: 'import_commissions',

  // Payout actions
  PAYOUT_APPROVE: 'approve_payout',
  PAYOUT_REJECT: 'reject_payout',
  PAYOUT_COMPLETE: 'complete_payout',
  PAYOUT_CANCEL: 'cancel_payout',

  // Wallet actions
  WALLET_CREDIT: 'credit_wallet',
  WALLET_DEBIT: 'debit_wallet',
  WALLET_ADJUST: 'adjust_wallet',

  // Bonus actions
  BONUS_CREATE: 'create_bonus',
  BONUS_APPROVE: 'approve_bonus',
  BONUS_REJECT: 'reject_bonus',

  // Override actions
  OVERRIDE_CREATE: 'create_override',
  OVERRIDE_APPROVE: 'approve_override',
  OVERRIDE_REJECT: 'reject_override',

  // System actions
  SYSTEM_CONFIG_CHANGE: 'change_system_config',
  SYSTEM_MAINTENANCE: 'system_maintenance',
} as const;

/**
 * Helper to log agent updates with automatic diff
 */
export async function logAgentUpdate(
  adminId: string,
  adminEmail: string,
  agentId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  request?: NextRequest
): Promise<void> {
  const changes = createChangeDiff(before, after);

  await logAdminAction({
    admin_id: adminId,
    admin_email: adminEmail,
    action: AdminActions.AGENT_UPDATE,
    resource_type: 'agent',
    resource_id: agentId,
    changes,
  }, request);
}

/**
 * Helper to log rank changes (requires special attention for compliance)
 */
export async function logRankChange(
  adminId: string,
  adminEmail: string,
  agentId: string,
  previousRank: string,
  newRank: string,
  reason?: string,
  request?: NextRequest
): Promise<void> {
  await logAdminAction({
    admin_id: adminId,
    admin_email: adminEmail,
    action: AdminActions.AGENT_RANK_CHANGE,
    resource_type: 'agent',
    resource_id: agentId,
    changes: {
      before: { rank: previousRank },
      after: { rank: newRank },
      fields: ['rank'],
    },
    metadata: reason ? { reason } : undefined,
  }, request);
}

/**
 * Helper to log payout approvals (critical for financial audits)
 */
export async function logPayoutApproval(
  adminId: string,
  adminEmail: string,
  payoutId: string,
  amount: number,
  agentId: string,
  notes?: string,
  request?: NextRequest
): Promise<void> {
  await logAdminAction({
    admin_id: adminId,
    admin_email: adminEmail,
    action: AdminActions.PAYOUT_APPROVE,
    resource_type: 'payout',
    resource_id: payoutId,
    metadata: {
      amount,
      agent_id: agentId,
      notes,
    },
  }, request);
}

/**
 * Helper to log commission imports (bulk operations need special tracking)
 */
export async function logCommissionImport(
  adminId: string,
  adminEmail: string,
  importCount: number,
  successCount: number,
  failCount: number,
  request?: NextRequest
): Promise<void> {
  await logAdminAction({
    admin_id: adminId,
    admin_email: adminEmail,
    action: AdminActions.COMMISSION_IMPORT,
    resource_type: 'commission',
    resource_id: `import_${Date.now()}`,
    metadata: {
      total: importCount,
      success: successCount,
      failed: failCount,
      timestamp: new Date().toISOString(),
    },
  }, request);
}
