/**
 * Admin Audit Logger
 * Tracks all admin actions for compliance and security
 *
 * Phase 2 Security Enhancement
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';

export interface AuditLogEntry {
  adminId: string;
  adminEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: {
    before?: any;
    after?: any;
    fields?: string[];
  };
  metadata?: Record<string, any>;
}

/**
 * Log an admin action to the audit trail
 */
export async function logAdminAction(
  entry: AuditLogEntry,
  request?: NextRequest
): Promise<string | null> {
  const supabase = createAdminClient();

  try {
    // Extract request metadata
    const ipAddress = request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request?.headers.get('x-real-ip') ||
                     null;
    const userAgent = request?.headers.get('user-agent') || null;

    // Call database function to log
    const { data, error } = await supabase.rpc('log_admin_action', {
      p_admin_id: entry.adminId,
      p_admin_email: entry.adminEmail,
      p_action: entry.action,
      p_resource_type: entry.resourceType,
      p_resource_id: entry.resourceId,
      p_changes: entry.changes ? JSON.stringify(entry.changes) : null,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
    } as never);

    if (error) {
      console.error('Failed to log admin action:', error);
      return null;
    }

    return data as string;
  } catch (error) {
    console.error('Admin audit logging error:', error);
    return null;
  }
}

/**
 * Common admin actions enum for consistency
 */
export const AdminActions = {
  // Agent management
  CREATE_AGENT: 'create_agent',
  UPDATE_AGENT: 'update_agent',
  DELETE_AGENT: 'delete_agent',
  TERMINATE_AGENT: 'terminate_agent',
  UPDATE_AGENT_RANK: 'update_agent_rank',
  ASSIGN_SPONSOR: 'assign_sponsor',

  // Financial operations
  APPROVE_COMMISSION: 'approve_commission',
  REJECT_COMMISSION: 'reject_commission',
  APPROVE_PAYOUT: 'approve_payout',
  REJECT_PAYOUT: 'reject_payout',
  PROCESS_PAYOUT: 'process_payout',
  COMPLETE_PAYOUT: 'complete_payout',
  APPROVE_BONUS: 'approve_bonus',
  REJECT_BONUS: 'reject_bonus',
  APPROVE_OVERRIDE: 'approve_override',
  REJECT_OVERRIDE: 'reject_override',

  // Clawbacks and adjustments
  CREATE_CLAWBACK: 'create_clawback',
  CANCEL_CLAWBACK: 'cancel_clawback',
  MANUAL_WALLET_ADJUSTMENT: 'manual_wallet_adjustment',
  FORGIVE_DEBT: 'forgive_debt',

  // Commission management
  IMPORT_COMMISSIONS: 'import_commissions',
  DELETE_COMMISSION: 'delete_commission',
  BULK_APPROVE_COMMISSIONS: 'bulk_approve_commissions',

  // Settings and configuration
  UPDATE_SETTINGS: 'update_settings',
  UPDATE_RANK_REQUIREMENTS: 'update_rank_requirements',
  UPDATE_COMMISSION_RATES: 'update_commission_rates',
  UPDATE_WITHDRAWAL_LIMITS: 'update_withdrawal_limits',

  // Compliance
  CREATE_COMPLIANCE_HOLD: 'create_compliance_hold',
  RELEASE_COMPLIANCE_HOLD: 'release_compliance_hold',

  // User management
  CREATE_ADMIN_USER: 'create_admin_user',
  UPDATE_ADMIN_USER: 'update_admin_user',
  DELETE_ADMIN_USER: 'delete_admin_user',
  UPDATE_ADMIN_ROLES: 'update_admin_roles',

  // Training management
  CREATE_COURSE: 'create_course',
  UPDATE_COURSE: 'update_course',
  DELETE_COURSE: 'delete_course',
  ISSUE_CERTIFICATE: 'issue_certificate',

  // SmartOffice sync
  TRIGGER_SMARTOFFICE_SYNC: 'trigger_smartoffice_sync',
  MAP_SMARTOFFICE_AGENT: 'map_smartoffice_agent',

  // Email templates
  UPDATE_EMAIL_TEMPLATE: 'update_email_template',

  // Products
  CREATE_PRODUCT: 'create_product',
  UPDATE_PRODUCT: 'update_product',
  DELETE_PRODUCT: 'delete_product',
} as const;

export type AdminAction = typeof AdminActions[keyof typeof AdminActions];

/**
 * Resource types for audit logging
 */
export const ResourceTypes = {
  AGENT: 'agent',
  COMMISSION: 'commission',
  OVERRIDE: 'override',
  BONUS: 'bonus',
  PAYOUT: 'payout',
  WALLET: 'wallet',
  DEBT: 'debt',
  CLAWBACK: 'clawback',
  SETTINGS: 'settings',
  ADMIN_USER: 'admin_user',
  COURSE: 'course',
  PRODUCT: 'product',
  EMAIL_TEMPLATE: 'email_template',
  COMPLIANCE_HOLD: 'compliance_hold',
} as const;

export type ResourceType = typeof ResourceTypes[keyof typeof ResourceTypes];

/**
 * Helper to create before/after change object
 */
export function createChangeLog<T extends Record<string, any>>(
  before: Partial<T>,
  after: Partial<T>
): AuditLogEntry['changes'] {
  const changedFields = Object.keys(after).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])
  );

  if (changedFields.length === 0) {
    return undefined;
  }

  return {
    before: Object.fromEntries(
      changedFields.map((field) => [field, before[field]])
    ),
    after: Object.fromEntries(
      changedFields.map((field) => [field, after[field]])
    ),
    fields: changedFields,
  };
}

/**
 * Query audit logs
 */
export async function getAuditLogs(filters: {
  adminId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const supabase = createAdminClient();
  let query = supabase
    .from('admin_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters.adminId) {
    query = query.eq('admin_id', filters.adminId);
  }

  if (filters.resourceType) {
    query = query.eq('resource_type', filters.resourceType);
  }

  if (filters.resourceId) {
    query = query.eq('resource_id', filters.resourceId);
  }

  if (filters.action) {
    query = query.eq('action', filters.action);
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString());
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  return query;
}

/**
 * Get recent actions by a specific admin
 */
export async function getAdminRecentActions(
  adminId: string,
  limit: number = 20
) {
  return getAuditLogs({ adminId, limit });
}

/**
 * Get all actions on a specific resource
 */
export async function getResourceAuditTrail(
  resourceType: string,
  resourceId: string
) {
  return getAuditLogs({ resourceType, resourceId });
}
