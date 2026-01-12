'use client';

import { useEffect, useState } from 'react';
import { RANK_CONFIG, getNextRank, Rank } from '@/lib/config/ranks';
import { getRankProgress } from '@/lib/engines/rank-engine';
import { calculateFastStart } from '@/lib/engines/bonus-engine';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/db/supabase-client';
import {
  DollarSign,
  Users,
  TrendingUp,
  Wallet,
  Clock,
  Award,
  ArrowUpRight,
  Target,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [stats, setStats] = useState({
    commissionsTotal: 0,
    overridesTotal: 0,
    bonusesTotal: 0,
    monthlyTotal: 0,
    teamCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let retryCount = 0;
    const maxRetries = 5;

    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Get agent (with retry since layout might be creating it)
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Handle AbortError silently
        if (agentError?.message?.includes('aborted')) {
          setLoading(false);
          return;
        }

        // If there's an error other than not found, stop loading
        if (agentError && agentError.code !== 'PGRST116') {
          console.error('Agent fetch error:', agentError);
          setLoading(false);
          return;
        }

      if (!agentData && retryCount < maxRetries) {
        // Agent not found yet, layout might be creating it - retry after delay
        retryCount++;
        setTimeout(fetchData, 500);
        return;
      }

      // If agent still not found after retries, stop loading
      if (!agentData) {
        console.error('Agent not found after retries');
        setLoading(false);
        return;
      }

      const typedAgent = agentData as { id: string; [key: string]: unknown } | null;
      if (typedAgent) {
        setAgent(typedAgent);

        // Get wallet
        const { data: walletData } = await supabase
          .from('wallets')
          .select('*')
          .eq('agent_id', typedAgent.id)
          .single();
        setWallet(walletData);

        // Get team count
        const { count } = await supabase
          .from('agents')
          .select('*', { count: 'exact', head: true })
          .eq('sponsor_id', typedAgent.id);

        // Get this month's earnings
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: commissions } = await supabase
          .from('commissions')
          .select('commission_amount')
          .eq('agent_id', typedAgent.id)
          .gte('created_at', startOfMonth.toISOString());

        const { data: overrides } = await supabase
          .from('overrides')
          .select('override_amount')
          .eq('agent_id', typedAgent.id)
          .gte('created_at', startOfMonth.toISOString());

        const { data: bonuses } = await supabase
          .from('bonuses')
          .select('amount')
          .eq('agent_id', typedAgent.id)
          .eq('status', 'paid')
          .gte('created_at', startOfMonth.toISOString());

        const commissionsTotal = (commissions || []).reduce((sum: number, c: { commission_amount: number }) => sum + Number(c.commission_amount), 0);
        const overridesTotal = (overrides || []).reduce((sum: number, o: { override_amount: number }) => sum + Number(o.override_amount), 0);
        const bonusesTotal = (bonuses || []).reduce((sum: number, b: { amount: number }) => sum + Number(b.amount), 0);

        setStats({
          commissionsTotal,
          overridesTotal,
          bonusesTotal,
          monthlyTotal: commissionsTotal + overridesTotal + bonusesTotal,
          teamCount: count || 0,
        });
      }

        setLoading(false);
      } catch (error) {
        // Catch any errors including AbortError
        console.error('Dashboard fetch error:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading || !agent) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const rankProgress = getRankProgress(agent);
  const nextRank = getNextRank(agent.rank);
  const nextRankConfig = nextRank ? RANK_CONFIG[nextRank] : null;
  const fastStart = calculateFastStart(agent, agent.premium_90_days || 0);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {agent.first_name}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your business performance.
        </p>
      </div>

      {/* Fast Start Banner */}
      {fastStart.eligible && fastStart.daysRemaining > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary">Fast Start Bonus Active</p>
              <p className="text-sm text-muted-foreground">
                {fastStart.daysRemaining} days remaining. Current bonus: {formatCurrency(fastStart.repBonus)}
                {fastStart.nextTier && (
                  <> — {formatCurrency(fastStart.premiumNeededForNext)} more premium to next tier!</>
                )}
              </p>
            </div>
            <Badge variant="secondary">{fastStart.currentTier > 0 ? `Tier ${fastStart.currentTier}` : 'No tier yet'}</Badge>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Commissions + Overrides + Bonuses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(wallet?.balance || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Pending: {formatCurrency(wallet?.pending_balance || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamCount}</div>
            <p className="text-xs text-muted-foreground">Direct recruits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">90-Day Premium</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(agent.premium_90_days || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Rolling 90-day total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rank Progress & Earnings Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Rank Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Rank Progress
            </CardTitle>
            <CardDescription>
              Current: {RANK_CONFIG[agent.rank as Rank]?.name || agent.rank}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextRankConfig ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Next: {nextRankConfig.name}</span>
                  <span className="text-sm text-muted-foreground">{rankProgress.progressToNext}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${rankProgress.progressToNext}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                You&apos;ve reached the highest rank!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Earnings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              This Month&apos;s Breakdown
            </CardTitle>
            <CardDescription>Your earnings by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-sm">Commissions</span>
              </div>
              <span className="font-medium">{formatCurrency(stats.commissionsTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-400" />
                <span className="text-sm">Overrides</span>
              </div>
              <span className="font-medium">{formatCurrency(stats.overridesTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm">Bonuses</span>
              </div>
              <span className="font-medium">{formatCurrency(stats.bonusesTotal)}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold">{formatCurrency(stats.monthlyTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/dashboard/crm"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
            >
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Add Contact</p>
                <p className="text-sm text-gray-500">Track a new lead</p>
              </div>
              <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400" />
            </a>
            <a
              href="/dashboard/team"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
            >
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">View Team</p>
                <p className="text-sm text-gray-500">See your downline</p>
              </div>
              <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400" />
            </a>
            <a
              href="/dashboard/wallet"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
            >
              <Wallet className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Withdraw</p>
                <p className="text-sm text-gray-500">Request payout</p>
              </div>
              <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400" />
            </a>
            <a
              href="/dashboard/training"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
            >
              <Target className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Training</p>
                <p className="text-sm text-gray-500">Continue learning</p>
              </div>
              <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
