/**
 * SmartOffice Sync Service
 * Orchestrates data synchronization between SmartOffice and Apex
 */

import { createUntypedAdminClient } from '@/lib/db/supabase-server';
import { getSmartOfficeClient, resetSmartOfficeClient } from './client';
import type {
  SyncResult,
  SyncError,
  SmartOfficeSyncType,
  SmartOfficeAgentRowInsert,
  SmartOfficePolicyRowInsert,
  SmartOfficeAgent,
  SmartOfficePolicy,
  AgentMappingResult,
} from './types';

/**
 * SmartOffice Sync Service
 */
export class SmartOfficeSyncService {
  private supabase = createUntypedAdminClient();

  /**
   * Run a full sync (all agents, policies, commissions)
   */
  async fullSync(triggeredBy = 'system', userId?: string): Promise<SyncResult> {
    const startTime = Date.now();
    const log = await this.createSyncLog('full', triggeredBy, userId);

    const result: SyncResult = {
      agents: { synced: 0, created: 0, updated: 0, errors: [] },
      commissions: { synced: 0, created: 0, errors: [] },
      policies: { synced: 0, created: 0, errors: [] },
      duration_ms: 0,
      log_id: log.id,
    };

    try {
      // Sync agents
      const agentResult = await this.syncAgents();
      result.agents = agentResult;

      // Sync policies
      const policyResult = await this.syncPolicies();
      result.policies = policyResult;

      // Note: Commissions require User IDs which we may not have mapped yet
      // They can be synced separately once agents are mapped

      // Update sync log
      result.duration_ms = Date.now() - startTime;
      await this.completeSyncLog(log.id, result);

      // Update last sync time
      await this.updateLastSyncTime();

      return result;
    } catch (error) {
      result.duration_ms = Date.now() - startTime;
      const syncError: SyncError = {
        type: 'SYNC_ERROR',
        message: error instanceof Error ? error.message : 'Unknown sync error',
        timestamp: new Date().toISOString(),
      };

      await this.failSyncLog(log.id, [syncError]);
      throw error;
    }
  }

  /**
   * Sync all agents from SmartOffice
   */
  async syncAgents(): Promise<SyncResult['agents']> {
    const result: SyncResult['agents'] = { synced: 0, created: 0, updated: 0, errors: [] };

    try {
      const client = await getSmartOfficeClient();
      const agents = await client.getAllAgents();

      for (const agent of agents) {
        try {
          const upsertResult = await this.upsertSmartOfficeAgent(agent);
          result.synced++;
          if (upsertResult.created) result.created++;
          if (upsertResult.updated) result.updated++;
        } catch (error) {
          result.errors.push({
            type: 'AGENT_SYNC_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            entity: 'agent',
            entityId: agent.id,
            timestamp: new Date().toISOString(),
          });
        }
      }

      return result;
    } catch (error) {
      result.errors.push({
        type: 'AGENT_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch agents',
        timestamp: new Date().toISOString(),
      });
      return result;
    }
  }

  /**
   * Sync all policies from SmartOffice
   */
  async syncPolicies(): Promise<SyncResult['policies']> {
    const result: SyncResult['policies'] = { synced: 0, created: 0, errors: [] };

    try {
      const client = await getSmartOfficeClient();
      const policies = await client.getAllPolicies();

      for (const policy of policies) {
        try {
          const created = await this.upsertSmartOfficePolicy(policy);
          result.synced++;
          if (created) result.created++;
        } catch (error) {
          result.errors.push({
            type: 'POLICY_SYNC_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            entity: 'policy',
            entityId: policy.id,
            timestamp: new Date().toISOString(),
          });
        }
      }

      return result;
    } catch (error) {
      result.errors.push({
        type: 'POLICY_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch policies',
        timestamp: new Date().toISOString(),
      });
      return result;
    }
  }

  /**
   * Upsert a SmartOffice agent to the database
   */
  private async upsertSmartOfficeAgent(
    agent: SmartOfficeAgent
  ): Promise<{ created: boolean; updated: boolean }> {
    const row: SmartOfficeAgentRowInsert = {
      smartoffice_id: agent.id,
      contact_id: agent.contactId,
      first_name: agent.firstName,
      last_name: agent.lastName,
      email: agent.email,
      phone: agent.phone,
      tax_id: agent.taxId,
      client_type: agent.clientType,
      status: agent.status,
      hierarchy_id: agent.hierarchyId,
      raw_data: agent.rawData,
    };

    // Check if exists
    const { data: existing } = await this.supabase
      .from('smartoffice_agents')
      .select('id')
      .eq('smartoffice_id', agent.id)
      .single();

    if (existing) {
      // Update
      await this.supabase
        .from('smartoffice_agents')
        .update({ ...row, synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('smartoffice_id', agent.id);
      return { created: false, updated: true };
    } else {
      // Insert
      await this.supabase.from('smartoffice_agents').insert(row);
      return { created: true, updated: false };
    }
  }

  /**
   * Upsert a SmartOffice policy to the database
   */
  private async upsertSmartOfficePolicy(policy: SmartOfficePolicy): Promise<boolean> {
    // Find the SmartOffice agent by contact ID if available
    let smartofficeAgentId: string | null = null;
    if (policy.primaryAdvisorContactId) {
      const { data: agent } = await this.supabase
        .from('smartoffice_agents')
        .select('id')
        .eq('contact_id', policy.primaryAdvisorContactId)
        .single();
      smartofficeAgentId = agent?.id || null;
    }

    const row: SmartOfficePolicyRowInsert = {
      smartoffice_id: policy.id,
      smartoffice_agent_id: smartofficeAgentId,
      primary_advisor_contact_id: policy.primaryAdvisorContactId,
      policy_number: policy.policyNumber,
      carrier_name: policy.carrierName,
      holding_type: policy.holdingType,
      holding_type_name: policy.holdingTypeName,
      annual_premium: policy.annualPremium,
      raw_data: policy.rawData,
    };

    // Check if exists
    const { data: existing } = await this.supabase
      .from('smartoffice_policies')
      .select('id')
      .eq('smartoffice_id', policy.id)
      .single();

    if (existing) {
      // Update
      await this.supabase
        .from('smartoffice_policies')
        .update({ ...row, synced_at: new Date().toISOString() })
        .eq('smartoffice_id', policy.id);
      return false;
    } else {
      // Insert
      await this.supabase.from('smartoffice_policies').insert(row);
      return true;
    }
  }

  /**
   * Auto-map SmartOffice agents to Apex agents by email
   */
  async autoMapAgentsByEmail(): Promise<AgentMappingResult> {
    const result: AgentMappingResult = { mapped: 0, unmatched: [], errors: [] };

    try {
      // Get all unmapped SmartOffice agents with emails
      const { data: soAgents } = await this.supabase
        .from('smartoffice_agents')
        .select('id, smartoffice_id, email, first_name, last_name')
        .is('apex_agent_id', null)
        .not('email', 'is', null);

      if (!soAgents || soAgents.length === 0) {
        return result;
      }

      for (const soAgent of soAgents) {
        try {
          // Find Apex agent by email
          const { data: apexAgent } = await this.supabase
            .from('agents')
            .select('id')
            .eq('email', soAgent.email)
            .single();

          if (apexAgent) {
            // Map them
            await this.supabase
              .from('smartoffice_agents')
              .update({ apex_agent_id: apexAgent.id, updated_at: new Date().toISOString() })
              .eq('id', soAgent.id);
            result.mapped++;
          } else {
            result.unmatched.push(`${soAgent.first_name} ${soAgent.last_name} (${soAgent.email})`);
          }
        } catch (error) {
          result.errors.push({
            type: 'MAPPING_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            entity: 'agent',
            entityId: soAgent.smartoffice_id,
            timestamp: new Date().toISOString(),
          });
        }
      }

      return result;
    } catch (error) {
      result.errors.push({
        type: 'AUTO_MAP_ERROR',
        message: error instanceof Error ? error.message : 'Auto-map failed',
        timestamp: new Date().toISOString(),
      });
      return result;
    }
  }

  /**
   * Manually map a SmartOffice agent to an Apex agent
   */
  async mapAgent(soAgentId: string, apexAgentId: string): Promise<void> {
    const { error } = await this.supabase
      .from('smartoffice_agents')
      .update({ apex_agent_id: apexAgentId, updated_at: new Date().toISOString() })
      .eq('id', soAgentId);

    if (error) {
      throw new Error(`Failed to map agent: ${error.message}`);
    }
  }

  /**
   * Unmap a SmartOffice agent from its Apex agent
   */
  async unmapAgent(soAgentId: string): Promise<void> {
    const { error } = await this.supabase
      .from('smartoffice_agents')
      .update({ apex_agent_id: null, updated_at: new Date().toISOString() })
      .eq('id', soAgentId);

    if (error) {
      throw new Error(`Failed to unmap agent: ${error.message}`);
    }
  }

  // ============================================
  // SYNC LOG MANAGEMENT
  // ============================================

  private async createSyncLog(
    syncType: SmartOfficeSyncType,
    triggeredBy: string,
    userId?: string
  ): Promise<{ id: string }> {
    const { data, error } = await this.supabase
      .from('smartoffice_sync_logs')
      .insert({
        sync_type: syncType,
        status: 'running',
        triggered_by: triggeredBy,
        triggered_by_user_id: userId || null,
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create sync log: ${error?.message}`);
    }

    return data;
  }

  private async completeSyncLog(logId: string, result: SyncResult): Promise<void> {
    await this.supabase
      .from('smartoffice_sync_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_ms: result.duration_ms,
        agents_synced: result.agents.synced,
        agents_created: result.agents.created,
        agents_updated: result.agents.updated,
        commissions_synced: result.commissions.synced,
        commissions_created: result.commissions.created,
        policies_synced: result.policies.synced,
        policies_created: result.policies.created,
        errors: [...result.agents.errors, ...result.commissions.errors, ...result.policies.errors],
        error_count:
          result.agents.errors.length + result.commissions.errors.length + result.policies.errors.length,
      })
      .eq('id', logId);
  }

  private async failSyncLog(logId: string, errors: SyncError[]): Promise<void> {
    await this.supabase
      .from('smartoffice_sync_logs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors,
        error_count: errors.length,
      })
      .eq('id', logId);
  }

  private async updateLastSyncTime(): Promise<void> {
    await this.supabase.rpc('update_smartoffice_last_sync');
  }

  /**
   * Get recent sync logs
   */
  async getSyncLogs(limit = 10): Promise<unknown[]> {
    const { data } = await this.supabase
      .from('smartoffice_sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    totalAgents: number;
    mappedAgents: number;
    unmappedAgents: number;
    totalPolicies: number;
    totalCommissions: number;
    lastSync: string | null;
    nextSync: string | null;
  }> {
    // Get agent counts
    const { count: totalAgents } = await this.supabase
      .from('smartoffice_agents')
      .select('*', { count: 'exact', head: true });

    const { count: mappedAgents } = await this.supabase
      .from('smartoffice_agents')
      .select('*', { count: 'exact', head: true })
      .not('apex_agent_id', 'is', null);

    const { count: totalPolicies } = await this.supabase
      .from('smartoffice_policies')
      .select('*', { count: 'exact', head: true });

    const { count: totalCommissions } = await this.supabase
      .from('smartoffice_commissions')
      .select('*', { count: 'exact', head: true });

    // Get sync config
    const { data: config } = await this.supabase
      .from('smartoffice_sync_config')
      .select('last_sync_at, next_sync_at')
      .single();

    return {
      totalAgents: totalAgents || 0,
      mappedAgents: mappedAgents || 0,
      unmappedAgents: (totalAgents || 0) - (mappedAgents || 0),
      totalPolicies: totalPolicies || 0,
      totalCommissions: totalCommissions || 0,
      lastSync: config?.last_sync_at || null,
      nextSync: config?.next_sync_at || null,
    };
  }
}

// Export singleton instance getter
let syncServiceInstance: SmartOfficeSyncService | null = null;

export function getSmartOfficeSyncService(): SmartOfficeSyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SmartOfficeSyncService();
  }
  return syncServiceInstance;
}
