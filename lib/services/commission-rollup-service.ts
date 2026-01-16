/**
 * Commission Roll-Up Service
 *
 * Handles license compliance for commission payments.
 * When an upline agent is unlicensed, their override either:
 * 1. Rolls up to the next licensed upline, OR
 * 2. Is retained by the company
 *
 * Regulatory References:
 * - NAIC Model Law §218, Section 13
 * - Texas Insurance Code §4005.053
 * - NY Insurance Law §2114-2116
 */

import { createAdminClient, createUntypedAdminClient } from '@/lib/db/supabase-server';
import type {
  Agent,
  LicenseStatus,
  Override,
  OverrideInsert,
  ComplianceLog,
  ComplianceLogInsert,
  ComplianceEventType,
  CompensationPlanConfig,
  UnlicensedOverrideHandling,
  RollUpReason,
} from '@/lib/types/database';

// ============================================
// CONSTANTS
// ============================================

const REGULATORY_REFERENCE =
  'NAIC Model Law §218 Section 13; Texas Insurance Code §4005.053; NY Insurance Law §2114-2116';

const DEFAULT_MAX_GENERATIONS = 6;
const DEFAULT_MAX_ROLLUP_GENERATIONS = 7;

// ============================================
// TYPES
// ============================================

export interface LicenseCheckResult {
  isLicensed: boolean;
  reason?: string;
  status: LicenseStatus;
}

export interface RollUpResult {
  originalAgentId: string;
  originalAgentName: string;
  originalGeneration: number;
  recipientAgentId: string | null;
  recipientAgentName: string | null;
  recipientGeneration: number | null;
  amount: number;
  reason: RollUpReason;
  wasRolledUp: boolean;
  companyRetained: boolean;
}

export interface OverrideCalculation {
  agentId: string;
  agentName: string;
  generation: number;
  overrideRate: number;
  overrideAmount: number;
  isLicensed: boolean;
  rollUp?: RollUpResult;
}

export interface CommissionCalculationResult {
  overrides: OverrideInsert[];
  complianceLogs: ComplianceLogInsert[];
  totalPaid: number;
  totalRolledUp: number;
  totalRetained: number;
}

// ============================================
// LICENSE CHECK FUNCTIONS
// ============================================

/**
 * Check if an agent is licensed and eligible to receive commissions
 *
 * An agent is eligible ONLY if ALL of the following are true:
 * 1. license_status = 'licensed'
 * 2. license_number IS NOT NULL
 * 3. license_expiration_date IS NULL OR license_expiration_date > TODAY
 */
export function isAgentLicensed(agent: Pick<Agent, 'license_status' | 'license_number' | 'license_expiration_date'>): LicenseCheckResult {
  // Must have 'licensed' status
  if (!agent.license_status || agent.license_status !== 'licensed') {
    return {
      isLicensed: false,
      reason: `Agent has status '${agent.license_status || 'unlicensed'}' - must be 'licensed'`,
      status: agent.license_status || 'unlicensed',
    };
  }

  // Must have a license number
  if (!agent.license_number) {
    return {
      isLicensed: false,
      reason: 'Agent has no license number on file',
      status: agent.license_status,
    };
  }

  // License must not be expired
  if (agent.license_expiration_date) {
    // Compare as YYYY-MM-DD strings to avoid timezone issues
    // Expiration date format: "YYYY-MM-DD" from database
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // String comparison works for ISO date format (YYYY-MM-DD)
    if (agent.license_expiration_date < todayString) {
      return {
        isLicensed: false,
        reason: `License expired on ${agent.license_expiration_date}`,
        status: 'expired',
      };
    }
  }

  return {
    isLicensed: true,
    status: 'licensed',
  };
}

/**
 * Get the roll-up reason based on agent's license status
 */
export function getRollUpReason(status: LicenseStatus): RollUpReason {
  switch (status) {
    case 'expired':
      return 'upline_license_expired';
    case 'suspended':
      return 'upline_license_suspended';
    case 'unlicensed':
    case 'pending':
    default:
      return 'upline_unlicensed';
  }
}

// ============================================
// DATABASE FUNCTIONS
// ============================================

/**
 * Get the active compensation plan configuration
 */
export async function getActiveCompensationPlan(): Promise<CompensationPlanConfig | null> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from('compensation_plan_configs')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching compensation plan:', error);
    return null;
  }

  return data as CompensationPlanConfig;
}

/**
 * Get an agent's upline chain up to a specified number of generations
 */
export async function getUplineChain(
  agentId: string,
  maxGenerations: number = DEFAULT_MAX_ROLLUP_GENERATIONS
): Promise<Array<Agent & { generation: number }>> {
  const supabase = createUntypedAdminClient();
  const upline: Array<Agent & { generation: number }> = [];
  const visited = new Set<string>();

  let currentId: string | null = agentId;
  let generation = 0;

  while (currentId && generation < maxGenerations) {
    // Prevent infinite loops
    if (visited.has(currentId)) {
      console.warn(`Circular reference detected in upline at agent ${currentId}`);
      break;
    }
    visited.add(currentId);

    // Get the agent's sponsor
    const { data: agentData, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', currentId)
      .single();

    if (error || !agentData) {
      break;
    }

    const agent = agentData as Agent;

    // Skip the first iteration (the selling agent themselves)
    if (generation > 0) {
      upline.push({ ...agent, generation } as Agent & { generation: number });
    }

    currentId = agent.sponsor_id;
    generation++;
  }

  return upline;
}

/**
 * Find the next licensed agent in an upline chain
 */
export async function findNextLicensedUpline(
  startAgentId: string,
  maxGenerations: number = DEFAULT_MAX_ROLLUP_GENERATIONS
): Promise<{ agent: Agent; generation: number } | null> {
  const uplineChain = await getUplineChain(startAgentId, maxGenerations);

  for (const agent of uplineChain) {
    const licenseCheck = isAgentLicensed(agent);
    if (licenseCheck.isLicensed) {
      return { agent, generation: agent.generation };
    }
  }

  return null;
}

// ============================================
// COMMISSION CALCULATION
// ============================================

/**
 * Calculate override commissions with roll-up for unlicensed uplines
 *
 * This is the main function that:
 * 1. Walks up the sponsor hierarchy
 * 2. Calculates override for each generation
 * 3. Handles roll-up when an upline is unlicensed
 * 4. Creates compliance log entries
 */
export async function calculateOverridesWithRollUp(
  commissionId: string,
  sellingAgentId: string,
  bonusVolume: number,
  overrideRates: Map<number, number> // generation -> rate
): Promise<CommissionCalculationResult> {
  // Get compensation plan config
  const planConfig = await getActiveCompensationPlan();
  const unlicensedHandling: UnlicensedOverrideHandling =
    planConfig?.unlicensed_override_handling || 'roll_up_to_next_licensed';
  const maxGenerations = planConfig?.max_generation_levels || DEFAULT_MAX_GENERATIONS;
  const maxRollupGenerations = planConfig?.max_rollup_generations || DEFAULT_MAX_ROLLUP_GENERATIONS;

  // Get upline chain
  const uplineChain = await getUplineChain(sellingAgentId, maxRollupGenerations);

  const overrides: OverrideInsert[] = [];
  const complianceLogs: ComplianceLogInsert[] = [];

  let totalPaid = 0;
  let totalRolledUp = 0;
  let totalRetained = 0;

  // Track roll-up accumulator for "roll_up_to_next_licensed" mode
  let rollUpAccumulator = 0;
  let rollUpFromAgents: Array<{ agentId: string; agentName: string; amount: number; generation: number; reason: RollUpReason }> = [];

  // Process each generation in the upline
  for (let i = 0; i < Math.min(uplineChain.length, maxGenerations); i++) {
    const agent = uplineChain[i];
    const generation = agent.generation;
    const overrideRate = overrideRates.get(generation) || 0;

    if (overrideRate === 0) continue;

    const overrideAmount = bonusVolume * overrideRate;
    const licenseCheck = isAgentLicensed(agent);

    if (licenseCheck.isLicensed) {
      // Agent is licensed - pay them (including any accumulated roll-up)
      const totalAmount = overrideAmount + rollUpAccumulator;

      const override: OverrideInsert = {
        commission_id: commissionId,
        agent_id: agent.id,
        source_agent_id: sellingAgentId,
        generation,
        override_rate: overrideRate,
        override_amount: totalAmount,
        status: 'pending',
        is_rolled_up: rollUpAccumulator > 0,
        roll_up_reason: rollUpAccumulator > 0 ? 'upline_unlicensed' : null,
        original_agent_id: rollUpFromAgents.length > 0 ? rollUpFromAgents[0].agentId : null,
        rolled_up_from_generation: rollUpFromAgents.length > 0 ? rollUpFromAgents[0].generation : null,
        compliance_log_id: null, // Will be set after compliance log is created
        notes: rollUpAccumulator > 0
          ? `Includes $${rollUpAccumulator.toFixed(2)} rolled up from ${rollUpFromAgents.length} unlicensed upline(s)`
          : null,
      };

      overrides.push(override);
      totalPaid += totalAmount;

      // Create compliance log for roll-up if applicable
      if (rollUpAccumulator > 0) {
        for (const rollUpFrom of rollUpFromAgents) {
          const complianceLog: ComplianceLogInsert = {
            agent_id: rollUpFrom.agentId,
            event_type: 'commission_rolled_up',
            commission_id: commissionId,
            override_id: null, // Will be set after override is created
            policy_id: null,
            description: `Override of $${rollUpFrom.amount.toFixed(2)} (Gen ${rollUpFrom.generation}) rolled up to ${agent.first_name} ${agent.last_name} due to unlicensed status`,
            action_taken: `Commission rolled up to next licensed upline (${agent.first_name} ${agent.last_name})`,
            regulatory_reference: REGULATORY_REFERENCE,
            original_amount: rollUpFrom.amount,
            rolled_up_to_agent_id: agent.id,
            triggered_by: 'system',
            metadata: {
              original_generation: rollUpFrom.generation,
              recipient_generation: generation,
              roll_up_reason: rollUpFrom.reason,
            },
          };
          complianceLogs.push(complianceLog);
        }
      }

      // Reset accumulator after paying licensed agent
      totalRolledUp += rollUpAccumulator;
      rollUpAccumulator = 0;
      rollUpFromAgents = [];
    } else {
      // Agent is NOT licensed
      const rollUpReason = getRollUpReason(licenseCheck.status);
      const agentName = `${agent.first_name} ${agent.last_name}`;

      if (unlicensedHandling === 'roll_up_to_next_licensed') {
        // Add to accumulator for next licensed agent
        rollUpAccumulator += overrideAmount;
        rollUpFromAgents.push({
          agentId: agent.id,
          agentName,
          amount: overrideAmount,
          generation,
          reason: rollUpReason,
        });

        // Log that override was prevented
        const complianceLog: ComplianceLogInsert = {
          agent_id: agent.id,
          event_type: 'unlicensed_override_prevented',
          commission_id: commissionId,
          override_id: null,
          policy_id: null,
          description: `Override of $${overrideAmount.toFixed(2)} (Gen ${generation}) prevented: ${licenseCheck.reason}`,
          action_taken: 'Override will be rolled up to next licensed upline',
          regulatory_reference: REGULATORY_REFERENCE,
          original_amount: overrideAmount,
          rolled_up_to_agent_id: null, // Will be updated when roll-up is assigned
          triggered_by: 'system',
          metadata: {
            license_status: licenseCheck.status,
            license_reason: licenseCheck.reason,
            handling_mode: 'roll_up_to_next_licensed',
          },
        };
        complianceLogs.push(complianceLog);
      } else {
        // Company retains - forfeit the override
        const complianceLog: ComplianceLogInsert = {
          agent_id: agent.id,
          event_type: 'commission_forfeited',
          commission_id: commissionId,
          override_id: null,
          policy_id: null,
          description: `Override of $${overrideAmount.toFixed(2)} (Gen ${generation}) forfeited to company: ${licenseCheck.reason}`,
          action_taken: 'Commission forfeited to company per compensation plan policy',
          regulatory_reference: REGULATORY_REFERENCE,
          original_amount: overrideAmount,
          rolled_up_to_agent_id: null,
          triggered_by: 'system',
          metadata: {
            license_status: licenseCheck.status,
            license_reason: licenseCheck.reason,
            handling_mode: 'company_retains',
          },
        };
        complianceLogs.push(complianceLog);
        totalRetained += overrideAmount;
      }
    }
  }

  // Handle any remaining roll-up accumulator (no licensed upline found)
  if (rollUpAccumulator > 0) {
    for (const rollUpFrom of rollUpFromAgents) {
      const complianceLog: ComplianceLogInsert = {
        agent_id: rollUpFrom.agentId,
        event_type: 'commission_forfeited',
        commission_id: commissionId,
        override_id: null,
        policy_id: null,
        description: `Override of $${rollUpFrom.amount.toFixed(2)} forfeited: No licensed upline found within ${maxRollupGenerations} generations`,
        action_taken: 'Commission retained by company - no eligible licensed upline',
        regulatory_reference: REGULATORY_REFERENCE,
        original_amount: rollUpFrom.amount,
        rolled_up_to_agent_id: null,
        triggered_by: 'system',
        metadata: {
          original_generation: rollUpFrom.generation,
          searched_generations: maxRollupGenerations,
          final_disposition: 'company_retained',
        },
      };
      complianceLogs.push(complianceLog);
    }
    totalRetained += rollUpAccumulator;
  }

  return {
    overrides,
    complianceLogs,
    totalPaid,
    totalRolledUp,
    totalRetained,
  };
}

// ============================================
// COMPLIANCE LOGGING
// ============================================

/**
 * Create a compliance log entry
 */
export async function createComplianceLog(log: ComplianceLogInsert): Promise<ComplianceLog | null> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from('compliance_logs')
    .insert(log)
    .select()
    .single();

  if (error) {
    console.error('Error creating compliance log:', error);
    return null;
  }

  return data as ComplianceLog;
}

/**
 * Create multiple compliance log entries
 */
export async function createComplianceLogs(logs: ComplianceLogInsert[]): Promise<ComplianceLog[]> {
  if (logs.length === 0) return [];

  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from('compliance_logs')
    .insert(logs)
    .select();

  if (error) {
    console.error('Error creating compliance logs:', error);
    return [];
  }

  return (data as ComplianceLog[]) || [];
}

/**
 * Get compliance logs for an agent
 */
export async function getAgentComplianceLogs(
  agentId: string,
  options?: {
    eventType?: ComplianceEventType;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ logs: ComplianceLog[]; total: number }> {
  const supabase = createUntypedAdminClient();

  let query = supabase
    .from('compliance_logs')
    .select('*', { count: 'exact' })
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (options?.eventType) {
    query = query.eq('event_type', options.eventType);
  }

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate);
  }

  if (options?.endDate) {
    query = query.lte('created_at', options.endDate);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching compliance logs:', error);
    return { logs: [], total: 0 };
  }

  return {
    logs: (data as ComplianceLog[]) || [],
    total: count || 0,
  };
}

/**
 * Get compliance summary statistics
 */
export async function getComplianceSummary(options?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalEvents: number;
  overridesPrevented: number;
  amountRolledUp: number;
  amountForfeited: number;
}> {
  const supabase = createUntypedAdminClient();

  let query = supabase
    .from('compliance_logs')
    .select('event_type, original_amount');

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate);
  }

  if (options?.endDate) {
    query = query.lte('created_at', options.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching compliance summary:', error);
    return {
      totalEvents: 0,
      overridesPrevented: 0,
      amountRolledUp: 0,
      amountForfeited: 0,
    };
  }

  const logs = data as Array<{ event_type: ComplianceEventType; original_amount: number | null }>;

  let overridesPrevented = 0;
  let amountRolledUp = 0;
  let amountForfeited = 0;

  for (const log of logs) {
    if (log.event_type === 'unlicensed_override_prevented') {
      overridesPrevented++;
    }
    if (log.event_type === 'commission_rolled_up') {
      amountRolledUp += log.original_amount || 0;
    }
    if (log.event_type === 'commission_forfeited') {
      amountForfeited += log.original_amount || 0;
    }
  }

  return {
    totalEvents: logs.length,
    overridesPrevented,
    amountRolledUp,
    amountForfeited,
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  isAgentLicensed,
  getRollUpReason,
  getActiveCompensationPlan,
  getUplineChain,
  findNextLicensedUpline,
  calculateOverridesWithRollUp,
  createComplianceLog,
  createComplianceLogs,
  getAgentComplianceLogs,
  getComplianceSummary,
};
