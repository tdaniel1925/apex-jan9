/**
 * SmartOffice Sync Stream API
 * POST - Trigger a sync with real-time progress updates via SSE
 */

import { NextRequest } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin-auth';
import { getSmartOfficeClient, getSmartOfficeSyncService } from '@/lib/smartoffice';
import { createUntypedAdminClient } from '@/lib/db/supabase-server';
import type { SmartOfficeAgent, SmartOfficePolicy, SyncResult, SyncError } from '@/lib/smartoffice/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ProgressUpdate {
  stage: 'init' | 'fetching_agents' | 'syncing_agents' | 'fetching_policies' | 'syncing_policies' | 'complete' | 'error';
  message: string;
  current: number;
  total: number;
  percentage: number;
  elapsed_ms: number;
  eta_ms: number | null;
  details?: {
    agents_synced?: number;
    agents_created?: number;
    agents_updated?: number;
    policies_synced?: number;
    policies_created?: number;
    errors?: number;
  };
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendProgress = async (update: ProgressUpdate) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(update)}\n\n`));
    } catch {
      // Stream closed
    }
  };

  // Start sync in background
  (async () => {
    const startTime = Date.now();
    const supabase = createUntypedAdminClient();

    const result: SyncResult = {
      agents: { synced: 0, created: 0, updated: 0, errors: [] },
      commissions: { synced: 0, created: 0, errors: [] },
      policies: { synced: 0, created: 0, errors: [] },
      duration_ms: 0,
      log_id: '',
    };

    try {
      // Create sync log
      const { data: log } = await supabase
        .from('smartoffice_sync_logs')
        .insert({
          sync_type: 'full',
          status: 'running',
          triggered_by: 'manual',
          triggered_by_user_id: admin.userId || null,
        })
        .select('id')
        .single();

      result.log_id = log?.id || '';

      await sendProgress({
        stage: 'init',
        message: 'Initializing sync...',
        current: 0,
        total: 100,
        percentage: 0,
        elapsed_ms: Date.now() - startTime,
        eta_ms: null,
      });

      const client = await getSmartOfficeClient();

      // Stage 1: Fetch agents from SmartOffice (with progress for each page)
      await sendProgress({
        stage: 'fetching_agents',
        message: 'Fetching agents from SmartOffice...',
        current: 0,
        total: 100,
        percentage: 5,
        elapsed_ms: Date.now() - startTime,
        eta_ms: null,
      });

      // Fetch agents with progress updates (inline pagination)
      const agents: SmartOfficeAgent[] = [];
      let searchId: string | undefined;
      let more = true;
      let agentPage = 0;
      const pageSize = 100;

      while (more) {
        const pageResult = await client.searchAgents({
          pageSize,
          keepSession: true,
          searchId,
          page: agentPage > 0 ? agentPage : undefined,
        });

        agents.push(...pageResult.items);
        more = pageResult.more;
        searchId = pageResult.searchId;
        agentPage++;

        // Send progress update during fetch
        await sendProgress({
          stage: 'fetching_agents',
          message: `Fetching agents from SmartOffice... (${agents.length} found, page ${agentPage})`,
          current: agents.length,
          total: pageResult.total || agents.length,
          percentage: Math.min(5 + (agentPage * 2), 20), // 5-20% for fetching
          elapsed_ms: Date.now() - startTime,
          eta_ms: null,
        });

        // Safety limit
        if (agentPage > 100) {
          console.warn('SmartOffice: Hit 100 page limit for agent search');
          break;
        }
      }
      const totalAgents = agents.length;

      // Stage 2: Sync agents to database
      let agentsSynced = 0;
      for (const agent of agents) {
        try {
          // Debug: Log first agent's data to verify parsing
          if (agentsSynced === 0) {
            console.log('[SmartOffice Sync] First agent data:', JSON.stringify({
              id: agent.id,
              contactId: agent.contactId,
              firstName: agent.firstName,
              lastName: agent.lastName,
              email: agent.email,
              phone: agent.phone,
              taxId: agent.taxId,
              clientType: agent.clientType,
              status: agent.status,
            }, null, 2));
          }
          const upsertResult = await upsertAgent(supabase, agent);
          result.agents.synced++;
          if (upsertResult.created) result.agents.created++;
          if (upsertResult.updated) result.agents.updated++;
        } catch (error) {
          result.agents.errors.push({
            type: 'AGENT_SYNC_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            entity: 'agent',
            entityId: agent.id,
            timestamp: new Date().toISOString(),
          });
        }

        agentsSynced++;
        const agentProgress = (agentsSynced / totalAgents) * 40; // Agents = 5-45%
        const elapsed = Date.now() - startTime;
        const rate = agentsSynced / (elapsed / 1000); // agents per second
        const remaining = totalAgents - agentsSynced;
        const eta = rate > 0 ? (remaining / rate) * 1000 : null;

        if (agentsSynced % 5 === 0 || agentsSynced === totalAgents) {
          await sendProgress({
            stage: 'syncing_agents',
            message: `Syncing agents... ${agentsSynced} of ${totalAgents}`,
            current: agentsSynced,
            total: totalAgents,
            percentage: Math.round(5 + agentProgress),
            elapsed_ms: elapsed,
            eta_ms: eta,
            details: {
              agents_synced: result.agents.synced,
              agents_created: result.agents.created,
              agents_updated: result.agents.updated,
              errors: result.agents.errors.length,
            },
          });
        }
      }

      // Build agent contact ID map for fast lookup during policy sync
      // This avoids N queries for N policies
      const { data: agentMappings } = await supabase
        .from('smartoffice_agents')
        .select('id, contact_id')
        .not('contact_id', 'is', null);

      const agentContactIdMap = new Map<string, string>();
      if (agentMappings) {
        for (const mapping of agentMappings) {
          if (mapping.contact_id) {
            agentContactIdMap.set(mapping.contact_id, mapping.id);
          }
        }
      }

      // Stage 3: Fetch policies from SmartOffice (with progress for each page)
      await sendProgress({
        stage: 'fetching_policies',
        message: 'Fetching policies from SmartOffice...',
        current: 0,
        total: 100,
        percentage: 45,
        elapsed_ms: Date.now() - startTime,
        eta_ms: null,
        details: {
          agents_synced: result.agents.synced,
          agents_created: result.agents.created,
          agents_updated: result.agents.updated,
        },
      });

      // Fetch policies with progress updates (inline pagination)
      const policies: SmartOfficePolicy[] = [];
      let policySearchId: string | undefined;
      let policyMore = true;
      let policyPage = 0;

      while (policyMore) {
        const policyPageResult = await client.searchPolicies({
          pageSize: 100,
          keepSession: true,
          searchId: policySearchId,
          page: policyPage > 0 ? policyPage : undefined,
        });

        policies.push(...policyPageResult.items);
        policyMore = policyPageResult.more;
        policySearchId = policyPageResult.searchId;
        policyPage++;

        // Send progress update during fetch
        await sendProgress({
          stage: 'fetching_policies',
          message: `Fetching policies from SmartOffice... (${policies.length} found, page ${policyPage})`,
          current: policies.length,
          total: policyPageResult.total || policies.length,
          percentage: Math.min(45 + (policyPage * 1), 55), // 45-55% for fetching policies
          elapsed_ms: Date.now() - startTime,
          eta_ms: null,
          details: {
            agents_synced: result.agents.synced,
            agents_created: result.agents.created,
            agents_updated: result.agents.updated,
          },
        });

        // Safety limit
        if (policyPage > 100) {
          console.warn('SmartOffice: Hit 100 page limit for policy search');
          break;
        }
      }
      const totalPolicies = policies.length;

      // Stage 4: Sync policies to database
      let policiesSynced = 0;
      for (const policy of policies) {
        try {
          const created = await upsertPolicy(supabase, policy, agentContactIdMap);
          result.policies.synced++;
          if (created) result.policies.created++;
        } catch (error) {
          result.policies.errors.push({
            type: 'POLICY_SYNC_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            entity: 'policy',
            entityId: policy.id,
            timestamp: new Date().toISOString(),
          });
        }

        policiesSynced++;
        const policyProgress = (policiesSynced / Math.max(totalPolicies, 1)) * 45; // Policies = 50-95%
        const elapsed = Date.now() - startTime;
        const agentTime = elapsed * 0.5; // Approximate time agents took
        const policyTime = elapsed - agentTime;
        const rate = policiesSynced / Math.max(policyTime / 1000, 0.1);
        const remaining = totalPolicies - policiesSynced;
        const eta = rate > 0 ? (remaining / rate) * 1000 : null;

        if (policiesSynced % 10 === 0 || policiesSynced === totalPolicies) {
          await sendProgress({
            stage: 'syncing_policies',
            message: `Syncing policies... ${policiesSynced} of ${totalPolicies}`,
            current: policiesSynced,
            total: totalPolicies,
            percentage: Math.round(50 + policyProgress),
            elapsed_ms: elapsed,
            eta_ms: eta,
            details: {
              agents_synced: result.agents.synced,
              agents_created: result.agents.created,
              agents_updated: result.agents.updated,
              policies_synced: result.policies.synced,
              policies_created: result.policies.created,
              errors: result.agents.errors.length + result.policies.errors.length,
            },
          });
        }
      }

      // Complete
      result.duration_ms = Date.now() - startTime;

      // Update sync log
      await supabase
        .from('smartoffice_sync_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_ms: result.duration_ms,
          agents_synced: result.agents.synced,
          agents_created: result.agents.created,
          agents_updated: result.agents.updated,
          policies_synced: result.policies.synced,
          policies_created: result.policies.created,
          error_count: result.agents.errors.length + result.policies.errors.length,
          errors: [...result.agents.errors, ...result.policies.errors],
        })
        .eq('id', result.log_id);

      // Update last sync time
      await supabase.rpc('update_smartoffice_last_sync');

      await sendProgress({
        stage: 'complete',
        message: 'Sync complete!',
        current: 100,
        total: 100,
        percentage: 100,
        elapsed_ms: result.duration_ms,
        eta_ms: 0,
        details: {
          agents_synced: result.agents.synced,
          agents_created: result.agents.created,
          agents_updated: result.agents.updated,
          policies_synced: result.policies.synced,
          policies_created: result.policies.created,
          errors: result.agents.errors.length + result.policies.errors.length,
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      // Update sync log with failure
      if (result.log_id) {
        await supabase
          .from('smartoffice_sync_logs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            error_count: 1,
            errors: [{ type: 'SYNC_ERROR', message: errorMsg, timestamp: new Date().toISOString() }],
          })
          .eq('id', result.log_id);
      }

      await sendProgress({
        stage: 'error',
        message: `Sync failed: ${errorMsg}`,
        current: 0,
        total: 100,
        percentage: 0,
        elapsed_ms: Date.now() - startTime,
        eta_ms: null,
      });
    } finally {
      try {
        await writer.close();
      } catch {
        // Already closed
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Helper functions
async function upsertAgent(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  agent: SmartOfficeAgent
): Promise<{ created: boolean; updated: boolean }> {
  const now = new Date().toISOString();
  const row = {
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
    synced_at: now,
    updated_at: now,
  };

  // Debug: Log the row being upserted
  console.log('[SmartOffice Sync] Upserting agent row:', JSON.stringify({
    smartoffice_id: row.smartoffice_id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone,
    tax_id: row.tax_id,
  }, null, 2));

  // Use upsert - single query instead of check + insert/update
  const { data, error } = await supabase
    .from('smartoffice_agents')
    .upsert(row, { onConflict: 'smartoffice_id', ignoreDuplicates: false })
    .select('created_at, updated_at')
    .single();

  if (error) {
    console.error('[SmartOffice Sync] Upsert error:', error);
    throw error;
  }

  // If created_at equals updated_at (within a second), it's a new record
  const isNew = data && Math.abs(new Date(data.created_at).getTime() - new Date(data.updated_at).getTime()) < 1000;
  return { created: isNew || false, updated: !isNew };
}

async function upsertPolicy(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  policy: SmartOfficePolicy,
  agentContactIdMap: Map<string, string> // Map of contact_id -> smartoffice_agent internal id
): Promise<boolean> {
  // Look up agent ID from pre-fetched map instead of querying DB each time
  const smartofficeAgentId = policy.primaryAdvisorContactId
    ? agentContactIdMap.get(policy.primaryAdvisorContactId) || null
    : null;

  const now = new Date().toISOString();
  const row = {
    smartoffice_id: policy.id,
    smartoffice_agent_id: smartofficeAgentId,
    primary_advisor_contact_id: policy.primaryAdvisorContactId,
    policy_number: policy.policyNumber,
    carrier_name: policy.carrierName,
    product_name: policy.productName,
    holding_type: policy.holdingType,
    holding_type_name: policy.holdingTypeName,
    annual_premium: policy.annualPremium,
    status: policy.status,
    issue_date: policy.issueDate,
    effective_date: policy.effectiveDate,
    writing_agent_id: policy.writingAgentId,
    raw_data: policy.rawData,
    synced_at: now,
  };

  // Use upsert - single query instead of check + insert/update
  const { data, error } = await supabase
    .from('smartoffice_policies')
    .upsert(row, { onConflict: 'smartoffice_id', ignoreDuplicates: false })
    .select('created_at')
    .single();

  if (error) throw error;

  // Check if it was newly created (created_at within last few seconds)
  const isNew = data && (Date.now() - new Date(data.created_at).getTime()) < 5000;
  return isNew || false;
}
