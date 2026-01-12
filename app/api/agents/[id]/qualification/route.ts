/**
 * Agent Qualification API
 * GET - Get qualification status, rank requirements, and recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import {
  checkRankRequirements,
  determinePaidAsRank,
  getQualificationTrend,
  isDemotionRisk,
  getQualificationRecommendations,
  type QualificationSnapshot,
} from '@/lib/engines/qualification-engine';
import { RANK_CONFIG, Rank } from '@/lib/config/ranks';
import type { Agent } from '@/lib/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Verify the user has access to this agent's data
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check if user owns this agent or is admin
    const { data: userAgent } = await supabase
      .from('agents')
      .select('id, rank')
      .eq('user_id', user.id)
      .single() as { data: { id: string; rank: string } | null };

    const isOwnProfile = userAgent?.id === id;
    const isAdmin =
      userAgent && RANK_CONFIG[userAgent.rank as Rank]?.order >= RANK_CONFIG['regional_mga'].order;

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const agentData = agent as Agent;

    // Get qualification snapshots for trend analysis
    const { data: snapshots } = await supabase
      .from('qualification_snapshots')
      .select('*')
      .eq('agent_id', id)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .limit(12);

    // Check requirements for current rank
    const currentRankCheck = checkRankRequirements(agentData, agentData.rank);

    // Check requirements for next rank
    const rankOrder = Object.keys(RANK_CONFIG).indexOf(agentData.rank);
    const ranks = Object.keys(RANK_CONFIG) as Rank[];
    const nextRank = ranks[rankOrder + 1] as Rank | undefined;
    const nextRankCheck = nextRank ? checkRankRequirements(agentData, nextRank) : null;

    // Get the latest snapshot
    const latestSnapshot = snapshots?.[0] as QualificationSnapshot | undefined;

    // Determine paid-as rank
    const paidAsResult = determinePaidAsRank(agentData, latestSnapshot || null);

    // Get qualification trend
    const trend = getQualificationTrend((snapshots || []) as QualificationSnapshot[]);

    // Check demotion risk
    const demotionRisk = isDemotionRisk(agentData, latestSnapshot || null);

    // Get recommendations
    const recommendations = getQualificationRecommendations(agentData, latestSnapshot || null);

    // Build rank progress
    const rankProgress = {
      currentRank: agentData.rank,
      paidAsRank: paidAsResult.paidAsRank,
      qualificationStatus: paidAsResult.status,
      usedGracePeriod: paidAsResult.usedGracePeriod,
      message: paidAsResult.message,
    };

    // Build requirements breakdown
    const requirementsBreakdown = {
      current: {
        rank: agentData.rank,
        met: currentRankCheck.met,
        percentageMet: currentRankCheck.percentageMet,
        requirements: Object.entries(currentRankCheck.requirements).map(([key, value]) => ({
          name: key,
          label: formatRequirementLabel(key),
          required: value.required,
          actual: value.actual,
          met: value.met,
          percentage: value.required > 0 ? Math.min(100, (value.actual / value.required) * 100) : 100,
        })),
      },
      next: nextRankCheck
        ? {
            rank: nextRank!,
            met: nextRankCheck.met,
            percentageMet: nextRankCheck.percentageMet,
            requirements: Object.entries(nextRankCheck.requirements).map(([key, value]) => ({
              name: key,
              label: formatRequirementLabel(key),
              required: value.required,
              actual: value.actual,
              met: value.met,
              percentage: value.required > 0 ? Math.min(100, (value.actual / value.required) * 100) : 100,
            })),
          }
        : null,
    };

    // Grace period info
    const gracePeriods = {
      total: 2, // From DEFAULT_QUALIFICATION_CONFIG
      used: latestSnapshot?.grace_periods_used || 0,
      remaining: latestSnapshot?.grace_periods_remaining ?? 2,
    };

    // Performance metrics
    const metrics = {
      premium90Days: agentData.premium_90_days,
      pbv90Days: agentData.pbv_90_days,
      obv90Days: agentData.obv_90_days,
      activeAgents: agentData.active_agents_count,
      personalRecruits: agentData.personal_recruits_count,
      mgasInDownline: agentData.mgas_in_downline,
      persistencyRate: agentData.persistency_rate,
      placementRate: agentData.placement_rate,
    };

    return NextResponse.json({
      agent: {
        id: agentData.id,
        name: `${agentData.first_name} ${agentData.last_name}`,
        agentCode: agentData.agent_code,
        status: agentData.status,
      },
      rankProgress,
      requirementsBreakdown,
      gracePeriods,
      metrics,
      trend: {
        direction: trend.trend,
        consecutiveQualified: trend.consecutiveQualified,
        consecutiveDemoted: trend.consecutiveDemoted,
        averagePercentageMet: trend.averagePercentageMet,
      },
      demotionRisk: {
        atRisk: demotionRisk.atRisk,
        riskLevel: demotionRisk.riskLevel,
        reasons: demotionRisk.reasons,
      },
      recommendations: recommendations.map((r) => ({
        priority: r.priority,
        action: r.action,
        metric: r.metric,
        gap: r.gap,
      })),
      history: (snapshots || []).slice(0, 6).map((s: QualificationSnapshot) => ({
        period: `${s.period_month}/${s.period_year}`,
        titleRank: s.title_rank,
        paidAsRank: s.paid_as_rank,
        status: s.qualification_status,
        usedGracePeriod: s.grace_periods_used > 0,
      })),
    });
  } catch (error) {
    console.error('Agent qualification GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatRequirementLabel(key: string): string {
  const labels: Record<string, string> = {
    premium90Days: '90-Day Premium',
    activeAgents: 'Active Agents',
    personalRecruits: 'Personal Recruits',
    mgasInDownline: 'MGAs in Downline',
    persistencyRequired: 'Persistency Rate',
    placementRequired: 'Placement Rate',
  };
  return labels[key] || key;
}
