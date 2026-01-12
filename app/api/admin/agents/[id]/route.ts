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
import type { Agent } from '@/lib/types/database';

// Update schema
const updateAgentSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  rank: z.enum(RANKS as unknown as [string, ...string[]]).optional(),
  status: z.enum(['pending', 'active', 'inactive', 'terminated']).optional(),
  sponsor_id: z.string().uuid().nullable().optional(),
  licensed_date: z.string().nullable().optional(),
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
      .select('*, sponsor:agents!agents_sponsor_id_fkey(id, first_name, last_name, agent_code, rank)')
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

    const updates = parseResult.data;

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

    // Check if rank is changing
    const rankChanging = updates.rank && updates.rank !== currentAgent.rank;
    const previousRank = currentAgent.rank;

    // Update agent
    const { data, error } = await supabase
      .from('agents')
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select('*, sponsor:agents!agents_sponsor_id_fkey(id, first_name, last_name, agent_code)')
      .single();

    if (error) {
      console.error('Agent update error:', error);
      return serverErrorResponse();
    }

    const updatedAgent = data as Agent;

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
