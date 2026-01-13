/**
 * Team Metrics API
 * GET - Get detailed team production metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/supabase-server';

interface Commission {
  agent_id: string;
  premium_amount: number;
  commission_amount: number;
  created_at: string;
}

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  rank: string;
  status: string;
  avatar_url: string | null;
  created_at: string;
}

interface MatrixPosition {
  agent_id: string;
  level: number;
  path: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agentData as { id: string };

    // Get agent's matrix position
    const { data: positionData } = await supabase
      .from('matrix_positions')
      .select('path, level')
      .eq('agent_id', agent.id)
      .single();

    const myPosition = positionData as { path: string; level: number } | null;

    // Get all downline agents
    let downlineAgents: Agent[] = [];
    let downlinePositions: MatrixPosition[] = [];

    if (myPosition) {
      const { data: positions } = await supabase
        .from('matrix_positions')
        .select('agent_id, level, path')
        .like('path', `${myPosition.path}.%`);

      downlinePositions = (positions || []) as MatrixPosition[];
      const downlineIds = downlinePositions.map(p => p.agent_id);

      if (downlineIds.length > 0) {
        const { data: agents } = await supabase
          .from('agents')
          .select('id, first_name, last_name, rank, status, avatar_url, created_at')
          .in('id', downlineIds);

        downlineAgents = (agents || []) as Agent[];
      }
    }

    // Calculate date ranges
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const thisQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const lastQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
    const lastQuarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 0);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    // Get all downline commissions for the year
    const downlineIds = downlineAgents.map(a => a.id);
    let allCommissions: Commission[] = [];

    if (downlineIds.length > 0) {
      const { data: commissions } = await supabase
        .from('commissions')
        .select('agent_id, premium_amount, commission_amount, created_at')
        .in('agent_id', downlineIds)
        .gte('created_at', thisYearStart.toISOString());

      allCommissions = (commissions || []) as Commission[];
    }

    // Calculate metrics by time period
    const thisMonthCommissions = allCommissions.filter(c => new Date(c.created_at) >= thisMonthStart);
    const lastMonthCommissions = allCommissions.filter(c => {
      const date = new Date(c.created_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });
    const thisQuarterCommissions = allCommissions.filter(c => new Date(c.created_at) >= thisQuarterStart);
    const lastQuarterCommissions = allCommissions.filter(c => {
      const date = new Date(c.created_at);
      return date >= lastQuarterStart && date <= lastQuarterEnd;
    });

    const thisMonthPremium = thisMonthCommissions.reduce((sum, c) => sum + Number(c.premium_amount), 0);
    const lastMonthPremium = lastMonthCommissions.reduce((sum, c) => sum + Number(c.premium_amount), 0);
    const thisQuarterPremium = thisQuarterCommissions.reduce((sum, c) => sum + Number(c.premium_amount), 0);
    const lastQuarterPremium = lastQuarterCommissions.reduce((sum, c) => sum + Number(c.premium_amount), 0);
    const ytdPremium = allCommissions.reduce((sum, c) => sum + Number(c.premium_amount), 0);

    // Calculate month-over-month growth
    const momGrowth = lastMonthPremium > 0 ? ((thisMonthPremium - lastMonthPremium) / lastMonthPremium) * 100 : 0;
    const qoqGrowth = lastQuarterPremium > 0 ? ((thisQuarterPremium - lastQuarterPremium) / lastQuarterPremium) * 100 : 0;

    // Calculate production by generation
    const generationMetrics: Record<number, { agents: number; premium: number; activeAgents: number }> = {};

    for (const pos of downlinePositions) {
      const generation = pos.level - (myPosition?.level || 0);
      if (!generationMetrics[generation]) {
        generationMetrics[generation] = { agents: 0, premium: 0, activeAgents: 0 };
      }

      const agentData = downlineAgents.find(a => a.id === pos.agent_id);
      generationMetrics[generation].agents++;

      if (agentData?.status === 'active') {
        generationMetrics[generation].activeAgents++;
      }

      const agentCommissions = thisMonthCommissions.filter(c => c.agent_id === pos.agent_id);
      generationMetrics[generation].premium += agentCommissions.reduce((sum, c) => sum + Number(c.premium_amount), 0);
    }

    // Calculate top performers (this month)
    const agentProduction: { agent: Agent; premium: number }[] = [];
    for (const agent of downlineAgents) {
      const agentCommissions = thisMonthCommissions.filter(c => c.agent_id === agent.id);
      const premium = agentCommissions.reduce((sum, c) => sum + Number(c.premium_amount), 0);
      if (premium > 0) {
        agentProduction.push({ agent, premium });
      }
    }
    const topPerformers = agentProduction
      .sort((a, b) => b.premium - a.premium)
      .slice(0, 10);

    // Monthly breakdown for the year
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(now.getFullYear(), i, 1);
      const monthEnd = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59);

      const monthCommissions = allCommissions.filter(c => {
        const date = new Date(c.created_at);
        return date >= monthStart && date <= monthEnd;
      });

      const premium = monthCommissions.reduce((sum, c) => sum + Number(c.premium_amount), 0);
      const uniqueProducers = new Set(monthCommissions.map(c => c.agent_id)).size;

      return {
        month: i + 1,
        monthName: monthStart.toLocaleString('default', { month: 'short' }),
        premium,
        producers: uniqueProducers,
      };
    }).filter((_, i) => i <= now.getMonth()); // Only show past months

    // New recruits this month
    const newRecruitsThisMonth = downlineAgents.filter(a => new Date(a.created_at) >= thisMonthStart).length;
    const newRecruitsLastMonth = downlineAgents.filter(a => {
      const date = new Date(a.created_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    }).length;

    // Active vs inactive breakdown
    const activeAgents = downlineAgents.filter(a => a.status === 'active').length;
    const inactiveAgents = downlineAgents.filter(a => a.status !== 'active').length;

    return NextResponse.json({
      summary: {
        totalDownline: downlineAgents.length,
        activeAgents,
        inactiveAgents,
        generationsDeep: Object.keys(generationMetrics).length,
      },
      production: {
        thisMonth: thisMonthPremium,
        lastMonth: lastMonthPremium,
        thisQuarter: thisQuarterPremium,
        lastQuarter: lastQuarterPremium,
        ytd: ytdPremium,
        momGrowth,
        qoqGrowth,
      },
      growth: {
        newRecruitsThisMonth,
        newRecruitsLastMonth,
        recruitmentGrowth: newRecruitsLastMonth > 0 ? ((newRecruitsThisMonth - newRecruitsLastMonth) / newRecruitsLastMonth) * 100 : 0,
      },
      generationMetrics: Object.entries(generationMetrics)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([gen, data]) => ({
          generation: Number(gen),
          ...data,
        })),
      topPerformers: topPerformers.map(({ agent, premium }) => ({
        id: agent.id,
        name: `${agent.first_name} ${agent.last_name}`,
        rank: agent.rank,
        avatarUrl: agent.avatar_url,
        premium,
      })),
      monthlyBreakdown,
    });
  } catch (error) {
    console.error('Team metrics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
