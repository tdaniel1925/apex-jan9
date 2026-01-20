/**
 * Admin Single Agent API
 * GET - Get agent details
 * PATCH - Update agent
 * DELETE - Terminate agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { RANKS, Rank, RANK_CONFIG } from '@/lib/config/ranks';
import { onRankChanged } from '@/lib/workflows/on-rank-changed';
import { checkRankEligibility, isManuallyAssignedRank } from '@/lib/engines/rank-engine';
import type { Agent } from '@/lib/types/database';
import { logAdminAction, AdminActions, ResourceTypes, createChangeLog } from '@/lib/audit/admin-logger';
import { applySanitization } from '@/lib/security/input-sanitizer';

// Update schema
const updateAgentSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  username: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/, 'Username must be lowercase letters, numbers, and hyphens only').optional(),
  rank: z.enum(RANKS as unknown as [string, ...string[]]).optional(),
  status: z.enum(['pending', 'active', 'inactive', 'terminated']).optional(),
  sponsor_id: z.string().uuid().nullable().optional(),
  licensed_date: z.string().nullable().optional(),
  force_rank_override: z.boolean().optional(), // Allow manual rank changes without validation
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get agent with sponsor info
    const { data: agentData, error } = await supabase
      .from('agents')
      .select('*, sponsor:sponsor_id(id, first_name, last_name, agent_code, rank)')
      .eq('id', id)
      .single();

    if (error || !agentData) {
      return notFoundResponse('Agent not found');
    }

    const agent = agentData as Agent;

    // Get wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('agent_id', id)
      .single();

    // Get recent commissions
    const { data: commissions } = await supabase
      .from('commissions')
      .select('*')
      .eq('agent_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get bonuses
    const { data: bonuses } = await supabase
      .from('bonuses')
      .select('*')
      .eq('agent_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get rank history
    const { data: rankHistory } = await supabase
      .from('rank_history')
      .select('*')
      .eq('agent_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get direct recruits count
    const { count: directRecruits } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('sponsor_id', id);

    // Get matrix position
    const { data: matrixPosition } = await supabase
      .from('matrix_positions')
      .select('*')
      .eq('agent_id', id)
      .single();

    return NextResponse.json({
      agent,
      wallet: wallet || null,
      recentCommissions: commissions || [],
      recentBonuses: bonuses || [],
      rankHistory: rankHistory || [],
      directRecruits: directRecruits || 0,
      matrixPosition: matrixPosition || null,
    });
  } catch (error) {
    console.error('Admin agent GET error:', error);
    return serverErrorResponse();
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = updateAgentSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    // PHASE 2 FIX - Issue #19: Sanitize user input to prevent XSS
    const updates = applySanitization(parseResult.data, {
      textFields: ['first_name', 'last_name', 'bio'],
      urlFields: ['avatar_url'],
      maxLengths: {
        bio: 1000,
      },
    });

    // Get current agent
    const { data: currentData, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentData) {
      return notFoundResponse('Agent not found');
    }

    const currentAgent = currentData as Agent;

    // PHASE 2 FIX - Issue #11: Prevent username change if replicated site is enabled
    if (updates.username && updates.username !== currentAgent.username) {
      if (currentAgent.replicated_site_enabled) {
        return badRequestResponse(
          'Cannot change username while replicated site is enabled. This would break existing marketing URLs, SEO backlinks, and printed materials. Contact support if a username change is absolutely necessary.'
        );
      }

      // Check if new username is already taken
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('username', updates.username)
        .neq('id', id)
        .single();

      if (existingAgent) {
        return badRequestResponse(`Username "${updates.username}" is already taken by another agent.`);
      }
    }

    // PHASE 2 FIX - Issue #17: Validate rank requirements on manual rank changes
    if (updates.rank && updates.rank !== currentAgent.rank) {
      const force_override = body.force_rank_override || false;

      // Skip validation for manually assigned ranks (like 'founder')
      if (!isManuallyAssignedRank(updates.rank as Rank) && !force_override) {
        const eligibility = checkRankEligibility(currentAgent, updates.rank as Rank);

        if (!eligibility.eligible) {
          // Build detailed error message showing what's missing
          const unmetRequirements = [];
          if (!eligibility.requirements.premium90Days.met) {
            unmetRequirements.push(
              `Premium (90 days): $${eligibility.requirements.premium90Days.current.toLocaleString()} / $${eligibility.requirements.premium90Days.required.toLocaleString()}`
            );
          }
          if (!eligibility.requirements.activeAgents.met) {
            unmetRequirements.push(
              `Active Agents: ${eligibility.requirements.activeAgents.current} / ${eligibility.requirements.activeAgents.required}`
            );
          }
          if (!eligibility.requirements.personalRecruits.met) {
            unmetRequirements.push(
              `Personal Recruits: ${eligibility.requirements.personalRecruits.current} / ${eligibility.requirements.personalRecruits.required}`
            );
          }
          if (eligibility.requirements.mgasInDownline && !eligibility.requirements.mgasInDownline.met) {
            unmetRequirements.push(
              `MGAs in Downline: ${eligibility.requirements.mgasInDownline.current} / ${eligibility.requirements.mgasInDownline.required}`
            );
          }
          if (!eligibility.requirements.persistency.met) {
            unmetRequirements.push(
              `Persistency Rate: ${eligibility.requirements.persistency.current}% / ${eligibility.requirements.persistency.required}%`
            );
          }
          if (!eligibility.requirements.placement.met) {
            unmetRequirements.push(
              `Placement Rate: ${eligibility.requirements.placement.current}% / ${eligibility.requirements.placement.required}%`
            );
          }

          return badRequestResponse(
            `Agent does not meet requirements for ${RANK_CONFIG[updates.rank as Rank].name}. Unmet requirements:\n${unmetRequirements.join('\n')}\n\nTo override this validation, set "force_rank_override": true in the request.`
          );
        }
      }
    }

    // Check if rank is changing
    const rankChanging = updates.rank && updates.rank !== currentAgent.rank;
    const previousRank = currentAgent.rank;

    // Remove force_rank_override from updates (it's not a database field)
    const { force_rank_override, ...agentUpdates } = updates as typeof updates & { force_rank_override?: boolean };

    // Update agent
    const { data, error } = await supabase
      .from('agents')
      .update({ ...agentUpdates, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select('*, sponsor:sponsor_id(id, first_name, last_name, agent_code)')
      .single();

    if (error) {
      console.error('Agent update error:', error);
      return serverErrorResponse();
    }

    const updatedAgent = data as Agent;

    // PHASE 2: Log admin action for audit trail
    const changes = createChangeLog(currentAgent, updates as any);
    if (changes) {
      await logAdminAction(
        {
          adminId: admin.agentId,
          adminEmail: admin.agent.email,
          action: rankChanging ? AdminActions.UPDATE_AGENT_RANK : AdminActions.UPDATE_AGENT,
          resourceType: ResourceTypes.AGENT,
          resourceId: id,
          changes,
        },
        request
      );
    }

    // Trigger rank change workflow if rank changed
    let workflowResult = null;
    if (rankChanging && updates.rank) {
      workflowResult = await onRankChanged({
        agent: updatedAgent,
        previousRank: previousRank as Rank,
        newRank: updates.rank as Rank,
      });
    }

    return NextResponse.json({
      agent: data,
      rankChanged: rankChanging,
      workflow: workflowResult,
    });
  } catch (error) {
    console.error('Admin agent PATCH error:', error);
    return serverErrorResponse();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get agent
    const { data: agentData, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !agentData) {
      return notFoundResponse('Agent not found');
    }

    const agent = agentData as Agent;

    // Don't allow deleting admins (Regional MGA+)
    if (RANK_CONFIG[agent.rank].order >= RANK_CONFIG.regional_mga.order) {
      return badRequestResponse('Cannot delete admin-level agents. Demote first.');
    }

    // Check if agent has downline
    const { count: downlineCount } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('sponsor_id', id);

    if (downlineCount && downlineCount > 0) {
      return badRequestResponse(
        `Cannot delete agent with ${downlineCount} downline agents. Reassign them first or terminate the agent instead.`
      );
    }

    // Soft delete - just mark as terminated
    const { error } = await supabase
      .from('agents')
      .update({ status: 'terminated', updated_at: new Date().toISOString() } as never)
      .eq('id', id);

    if (error) {
      console.error('Agent terminate error:', error);
      return serverErrorResponse();
    }

    // PHASE 2: Log termination for audit trail
    await logAdminAction(
      {
        adminId: admin.agentId,
        adminEmail: admin.agent.email,
        action: AdminActions.TERMINATE_AGENT,
        resourceType: ResourceTypes.AGENT,
        resourceId: id,
        changes: {
          before: { status: agent.status },
          after: { status: 'terminated' },
          fields: ['status'],
        },
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Agent terminated successfully',
      agent_id: id,
    });
  } catch (error) {
    console.error('Admin agent DELETE error:', error);
    return serverErrorResponse();
  }
}
