/**
 * Leaderboard API - Accessible to all authenticated agents
 * GET - Get top performers by various metrics
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { ApiErrors, apiSuccess, handleZodError } from '@/lib/api/response';
import type { Rank } from '@/lib/config/ranks';

// Local types for query results
interface CommissionRow {
  agent_id: string;
  commission_amount: number | null;
  premium_amount?: number | null;
}

interface AgentRow {
  sponsor_id: string | null;
}

interface AgentDetailRow {
  id: string;
  first_name: string;
  last_name: string;
  agent_code: string;
  rank: Rank;
  avatar_url: string | null;
}

// Query params schema
const querySchema = z.object({
  metric: z.enum(['commissions', 'recruits', 'premium']).default('commissions'),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiErrors.unauthorized();
    }

    // Check user is an agent
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as unknown as { data: { id: string } | null };

    if (!agent) {
      return ApiErrors.notFound('Agent');
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { metric, period, limit } = parseResult.data;

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const startDateStr = startDate.toISOString();

    let performers: { agent_id: string; value: number }[] = [];

    switch (metric) {
      case 'commissions': {
        const { data } = await supabase
          .from('commissions')
          .select('agent_id, commission_amount')
          .gte('created_at', startDateStr);

        const rows = (data || []) as CommissionRow[];
        const byAgent = rows.reduce((acc, c) => {
          acc[c.agent_id] = (acc[c.agent_id] || 0) + Number(c.commission_amount || 0);
          return acc;
        }, {} as Record<string, number>);

        performers = Object.entries(byAgent)
          .map(([agent_id, value]) => ({ agent_id, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, limit);
        break;
      }

      case 'premium': {
        const { data } = await supabase
          .from('commissions')
          .select('agent_id, premium_amount')
          .gte('created_at', startDateStr);

        const rows = (data || []) as CommissionRow[];
        const byAgent = rows.reduce((acc, c) => {
          acc[c.agent_id] = (acc[c.agent_id] || 0) + Number(c.premium_amount || 0);
          return acc;
        }, {} as Record<string, number>);

        performers = Object.entries(byAgent)
          .map(([agent_id, value]) => ({ agent_id, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, limit);
        break;
      }

      case 'recruits': {
        const { data } = await supabase
          .from('agents')
          .select('sponsor_id')
          .gte('created_at', startDateStr)
          .not('sponsor_id', 'is', null);

        const rows = (data || []) as AgentRow[];
        const byAgent = rows.reduce((acc, a) => {
          if (a.sponsor_id) {
            acc[a.sponsor_id] = (acc[a.sponsor_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        performers = Object.entries(byAgent)
          .map(([agent_id, value]) => ({ agent_id, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, limit);
        break;
      }
    }

    // Fetch agent details (limited info for privacy)
    const agentIds = performers.map((p) => p.agent_id);

    if (agentIds.length === 0) {
      return apiSuccess({
        metric,
        period,
        performers: [],
        currentUser: {
          rank: null,
          value: null,
          totalParticipants: 0,
        },
      });
    }

    const { data: agentsData } = await supabase
      .from('agents')
      .select('id, first_name, last_name, agent_code, rank, avatar_url')
      .in('id', agentIds);

    const agentRows = (agentsData || []) as AgentDetailRow[];
    const agentsById = new Map(agentRows.map((a) => [a.id, a]));

    const results = performers.map((p, index) => {
      const agentInfo = agentsById.get(p.agent_id);
      return {
        rank: index + 1,
        agent: agentInfo
          ? {
              id: agentInfo.id,
              name: `${agentInfo.first_name} ${agentInfo.last_name}`,
              rank: agentInfo.rank,
              avatarUrl: agentInfo.avatar_url,
            }
          : null,
        value: p.value,
      };
    });

    // Find current user's rank in the full list
    let currentUserRank: number | null = null;
    let currentUserValue: number | null = null;

    // Get all performers to find current user's position
    const allPerformers = await getAllPerformersForMetric(
      supabase,
      metric,
      startDateStr
    );
    const userIndex = allPerformers.findIndex((p) => p.agent_id === agent.id);
    if (userIndex !== -1) {
      currentUserRank = userIndex + 1;
      currentUserValue = allPerformers[userIndex].value;
    }

    return apiSuccess({
      metric,
      period,
      performers: results,
      currentUser: {
        rank: currentUserRank,
        value: currentUserValue,
        totalParticipants: allPerformers.length,
      },
    });
  } catch (error) {
    console.error('Leaderboard GET error:', error);
    return ApiErrors.internal();
  }
}

// Helper to get all performers for calculating user's rank
async function getAllPerformersForMetric(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  metric: string,
  startDateStr: string
): Promise<{ agent_id: string; value: number }[]> {
  let performers: { agent_id: string; value: number }[] = [];

  switch (metric) {
    case 'commissions': {
      const { data } = await supabase
        .from('commissions')
        .select('agent_id, commission_amount')
        .gte('created_at', startDateStr);

      const rows = (data || []) as CommissionRow[];
      const byAgent = rows.reduce((acc, c) => {
        acc[c.agent_id] = (acc[c.agent_id] || 0) + Number(c.commission_amount || 0);
        return acc;
      }, {} as Record<string, number>);

      performers = Object.entries(byAgent)
        .map(([agent_id, value]) => ({ agent_id, value }))
        .sort((a, b) => b.value - a.value);
      break;
    }

    case 'premium': {
      const { data } = await supabase
        .from('commissions')
        .select('agent_id, premium_amount')
        .gte('created_at', startDateStr);

      const rows = (data || []) as CommissionRow[];
      const byAgent = rows.reduce((acc, c) => {
        acc[c.agent_id] = (acc[c.agent_id] || 0) + Number(c.premium_amount || 0);
        return acc;
      }, {} as Record<string, number>);

      performers = Object.entries(byAgent)
        .map(([agent_id, value]) => ({ agent_id, value }))
        .sort((a, b) => b.value - a.value);
      break;
    }

    case 'recruits': {
      const { data } = await supabase
        .from('agents')
        .select('sponsor_id')
        .gte('created_at', startDateStr)
        .not('sponsor_id', 'is', null);

      const rows = (data || []) as AgentRow[];
      const byAgent = rows.reduce((acc, a) => {
        if (a.sponsor_id) {
          acc[a.sponsor_id] = (acc[a.sponsor_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      performers = Object.entries(byAgent)
        .map(([agent_id, value]) => ({ agent_id, value }))
        .sort((a, b) => b.value - a.value);
      break;
    }
  }

  return performers;
}
