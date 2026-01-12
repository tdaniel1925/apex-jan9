/**
 * Admin Top Performers API
 * GET - Get top performing agents by various metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { Rank } from '@/lib/config/ranks';

// Query result types
interface CommissionRow {
  agent_id: string;
  commission_amount: number | null;
  premium_amount?: number | null;
}

interface AgentRow {
  sponsor_id: string | null;
}

interface OverrideRow {
  agent_id: string;
  override_amount: number | null;
}

interface AgentDetailRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  agent_code: string;
  rank: Rank;
  avatar_url: string | null;
}

// Query params schema
const querySchema = z.object({
  metric: z.enum(['commissions', 'recruits', 'premium', 'overrides_received']).default('commissions'),
  period: z.enum(['week', 'month', 'quarter', 'year', 'all']).default('month'),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return badRequestResponse('Invalid query parameters', parseResult.error.flatten());
    }

    const { metric, period, limit } = parseResult.data;

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(0);
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
          acc[c.agent_id] = (acc[c.agent_id] || 0) + (c.commission_amount || 0);
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
          acc[c.agent_id] = (acc[c.agent_id] || 0) + (c.premium_amount || 0);
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

      case 'overrides_received': {
        const { data } = await supabase
          .from('overrides')
          .select('agent_id, override_amount')
          .gte('created_at', startDateStr);

        const rows = (data || []) as OverrideRow[];
        const byAgent = rows.reduce((acc, o) => {
          acc[o.agent_id] = (acc[o.agent_id] || 0) + (o.override_amount || 0);
          return acc;
        }, {} as Record<string, number>);

        performers = Object.entries(byAgent)
          .map(([agent_id, value]) => ({ agent_id, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, limit);
        break;
      }
    }

    // Fetch agent details
    const agentIds = performers.map(p => p.agent_id);
    const { data: agentsData } = await supabase
      .from('agents')
      .select('id, first_name, last_name, email, agent_code, rank, avatar_url')
      .in('id', agentIds);

    const agentRows = (agentsData || []) as AgentDetailRow[];
    const agentsById = new Map(agentRows.map(a => [a.id, a]));

    const results = performers.map((p, index) => ({
      rank: index + 1,
      agent: agentsById.get(p.agent_id) || null,
      value: p.value,
      metric,
    }));

    return NextResponse.json({
      metric,
      period,
      performers: results,
    });
  } catch (error) {
    console.error('Admin top performers GET error:', error);
    return serverErrorResponse();
  }
}
