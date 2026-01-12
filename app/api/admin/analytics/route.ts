/**
 * Admin Analytics API
 * GET - Get dashboard analytics and stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { getCurrentPhase } from '@/lib/config/bonuses';
import { RANKS, Rank } from '@/lib/config/ranks';

// Query result types
interface AgentRow {
  id: string;
  rank: Rank;
  status: string;
  created_at: string;
}

interface CommissionRow {
  id: string;
  commission_amount: number | null;
  premium_amount: number | null;
  status: string;
  created_at: string;
  carrier: string;
}

interface OverrideRow {
  id: string;
  override_amount: number | null;
  generation: number;
  status: string;
  created_at: string;
}

interface BonusRow {
  id: string;
  amount: number | null;
  bonus_type: string;
  status: string;
  created_at: string;
}

interface PayoutRow {
  id: string;
  amount: number | null;
  net_amount: number | null;
  fee: number | null;
  status: string;
  method: string;
  created_at: string;
}

interface WalletRow {
  id: string;
  balance: number | null;
  pending_balance: number | null;
  lifetime_earnings: number | null;
}

interface RecentAgentRow {
  id: string;
  created_at: string;
}

interface RankHistoryRow {
  id: string;
  new_rank: Rank;
  created_at: string;
}

// Query params schema
const querySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year', 'all']).default('month'),
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

    const { period } = parseResult.data;

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
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
        startDate = new Date(0); // All time
    }

    const startDateStr = startDate.toISOString();

    // Fetch all data in parallel
    const [
      agentsResult,
      commissionsResult,
      overridesResult,
      bonusesResult,
      payoutsResult,
      walletsResult,
      recentAgentsResult,
      rankHistoryResult,
    ] = await Promise.all([
      // Agents
      supabase.from('agents').select('id, rank, status, created_at'),

      // Commissions
      supabase.from('commissions').select('id, commission_amount, premium_amount, status, created_at, carrier'),

      // Overrides
      supabase.from('overrides').select('id, override_amount, generation, status, created_at'),

      // Bonuses
      supabase.from('bonuses').select('id, amount, bonus_type, status, created_at'),

      // Payouts
      supabase.from('payouts').select('id, amount, net_amount, fee, status, method, created_at'),

      // Wallets
      supabase.from('wallets').select('id, balance, pending_balance, lifetime_earnings'),

      // Recent agents (last 30 days)
      supabase.from('agents').select('id, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Rank history
      supabase.from('rank_history').select('id, new_rank, created_at').gte('created_at', startDateStr),
    ]);

    const agents = (agentsResult.data || []) as AgentRow[];
    const commissions = (commissionsResult.data || []) as CommissionRow[];
    const overrides = (overridesResult.data || []) as OverrideRow[];
    const bonuses = (bonusesResult.data || []) as BonusRow[];
    const payouts = (payoutsResult.data || []) as PayoutRow[];
    const wallets = (walletsResult.data || []) as WalletRow[];
    const recentAgents = (recentAgentsResult.data || []) as RecentAgentRow[];
    const rankHistory = (rankHistoryResult.data || []) as RankHistoryRow[];

    // Filter by period
    const periodCommissions = commissions.filter(c => new Date(c.created_at) >= startDate);
    const periodOverrides = overrides.filter(o => new Date(o.created_at) >= startDate);
    const periodBonuses = bonuses.filter(b => new Date(b.created_at) >= startDate);
    const periodPayouts = payouts.filter(p => new Date(p.created_at) >= startDate);

    // Calculate agent stats
    const activeAgents = agents.filter(a => a.status === 'active').length;
    const currentPhase = getCurrentPhase(activeAgents);

    const agentsByRank = RANKS.reduce((acc, rank) => {
      acc[rank] = agents.filter(a => a.rank === rank).length;
      return acc;
    }, {} as Record<Rank, number>);

    const agentsByStatus = {
      active: agents.filter(a => a.status === 'active').length,
      pending: agents.filter(a => a.status === 'pending').length,
      inactive: agents.filter(a => a.status === 'inactive').length,
      terminated: agents.filter(a => a.status === 'terminated').length,
    };

    // Calculate financial stats
    const totalCommissions = periodCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
    const totalPremium = periodCommissions.reduce((sum, c) => sum + (c.premium_amount || 0), 0);
    const totalOverrides = periodOverrides.reduce((sum, o) => sum + (o.override_amount || 0), 0);
    const totalBonuses = periodBonuses.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalPayouts = periodPayouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.net_amount || 0), 0);
    const pendingPayouts = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);

    // Wallet totals
    const totalWalletBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
    const totalPendingBalance = wallets.reduce((sum, w) => sum + (w.pending_balance || 0), 0);
    const totalLifetimeEarnings = wallets.reduce((sum, w) => sum + (w.lifetime_earnings || 0), 0);

    // Growth metrics
    const newAgentsThisPeriod = agents.filter(a => new Date(a.created_at) >= startDate).length;
    const promotionsThisPeriod = rankHistory.length;

    // Commissions by carrier
    const commissionsByCarrier = periodCommissions.reduce((acc, c) => {
      acc[c.carrier] = (acc[c.carrier] || 0) + (c.commission_amount || 0);
      return acc;
    }, {} as Record<string, number>);

    // Overrides by generation
    const overridesByGeneration = periodOverrides.reduce((acc, o) => {
      acc[o.generation] = (acc[o.generation] || 0) + (o.override_amount || 0);
      return acc;
    }, {} as Record<number, number>);

    // Daily breakdown for charts (last 30 days)
    const dailyData: { date: string; commissions: number; overrides: number; bonuses: number; newAgents: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayCommissions = commissions
        .filter(c => c.created_at.startsWith(dateStr))
        .reduce((sum, c) => sum + (c.commission_amount || 0), 0);

      const dayOverrides = overrides
        .filter(o => o.created_at.startsWith(dateStr))
        .reduce((sum, o) => sum + (o.override_amount || 0), 0);

      const dayBonuses = bonuses
        .filter(b => b.created_at.startsWith(dateStr))
        .reduce((sum, b) => sum + (b.amount || 0), 0);

      const dayNewAgents = agents.filter(a => a.created_at.startsWith(dateStr)).length;

      dailyData.push({
        date: dateStr,
        commissions: dayCommissions,
        overrides: dayOverrides,
        bonuses: dayBonuses,
        newAgents: dayNewAgents,
      });
    }

    return NextResponse.json({
      period,
      currentPhase,

      // Agent stats
      agents: {
        total: agents.length,
        active: activeAgents,
        byRank: agentsByRank,
        byStatus: agentsByStatus,
        newThisPeriod: newAgentsThisPeriod,
        promotionsThisPeriod,
      },

      // Financial stats
      financials: {
        totalPremium,
        totalCommissions,
        totalOverrides,
        totalBonuses,
        totalPayouts,
        pendingPayouts,
        totalEarnings: totalCommissions + totalOverrides + totalBonuses,
      },

      // Wallet stats
      wallets: {
        totalBalance: totalWalletBalance,
        totalPending: totalPendingBalance,
        totalLifetimeEarnings,
      },

      // Breakdowns
      breakdowns: {
        commissionsByCarrier,
        overridesByGeneration,
      },

      // Chart data
      charts: {
        daily: dailyData,
      },

      // Recent activity
      recentActivity: {
        newAgents30Days: recentAgents.length,
        commissionsThisPeriod: periodCommissions.length,
        bonusesThisPeriod: periodBonuses.length,
        payoutsThisPeriod: periodPayouts.length,
      },
    });
  } catch (error) {
    console.error('Admin analytics GET error:', error);
    return serverErrorResponse();
  }
}
