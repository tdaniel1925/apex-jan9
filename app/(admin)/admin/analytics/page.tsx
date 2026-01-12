'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { RANK_CONFIG, Rank } from '@/lib/config/ranks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Award,
  Sparkles,
  Download,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/db/supabase-client';

interface RankDistribution {
  rank: string;
  count: number;
  percentage: number;
}

interface TopProducer {
  id: string;
  first_name: string;
  last_name: string;
  rank: string;
  premium_90_days: number;
  personal_recruits_count: number;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    monthlyPremium: 0,
    lastMonthPremium: 0,
    monthlyCommissions: 0,
    monthlyBonuses: 0,
    aiCopilotAdoption: 0,
    aiCopilotRevenue: 0,
  });
  const [rankDistribution, setRankDistribution] = useState<RankDistribution[]>([]);
  const [topProducers, setTopProducers] = useState<TopProducer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Get agent counts
      const { count: totalAgents } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true });

      const { count: activeAgents } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get monthly premium and commissions
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const startOfLastMonth = new Date(startOfMonth);
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

      const { data: monthlyCommissions } = await supabase
        .from('commissions')
        .select('premium_amount, commission_amount')
        .gte('created_at', startOfMonth.toISOString());

      const { data: lastMonthCommissions } = await supabase
        .from('commissions')
        .select('premium_amount')
        .gte('created_at', startOfLastMonth.toISOString())
        .lt('created_at', startOfMonth.toISOString());

      const commArr = monthlyCommissions || [];
      const lastCommArr = lastMonthCommissions || [];
      const monthlyPremium = commArr.reduce((sum: number, c: { premium_amount: number }) => sum + Number(c.premium_amount), 0);
      const lastMonthPremium = lastCommArr.reduce((sum: number, c: { premium_amount: number }) => sum + Number(c.premium_amount), 0);
      const monthlyComm = commArr.reduce((sum: number, c: { commission_amount: number }) => sum + Number(c.commission_amount), 0);

      // Get monthly bonuses
      const { data: bonusData } = await supabase
        .from('bonuses')
        .select('amount')
        .gte('created_at', startOfMonth.toISOString())
        .in('status', ['approved', 'paid']);

      const bonusArr = bonusData || [];
      const monthlyBonuses = bonusArr.reduce((sum: number, b: { amount: number }) => sum + Number(b.amount), 0);

      // Get AI Copilot stats
      const { data: aiData } = await supabase
        .from('agents')
        .select('ai_copilot_tier')
        .neq('ai_copilot_tier', 'none');

      const aiCopilotCount = aiData?.length || 0;
      const aiAdoption = totalAgents ? (aiCopilotCount / totalAgents) * 100 : 0;

      // Estimate AI revenue (basic: $49, pro: $99, agency: $199)
      let aiRevenue = 0;
      if (aiData) {
        aiData.forEach((a: { ai_copilot_tier: string }) => {
          if (a.ai_copilot_tier === 'basic') aiRevenue += 49;
          else if (a.ai_copilot_tier === 'pro') aiRevenue += 99;
          else if (a.ai_copilot_tier === 'agency') aiRevenue += 199;
        });
      }

      setStats({
        totalAgents: totalAgents || 0,
        activeAgents: activeAgents || 0,
        monthlyPremium,
        lastMonthPremium,
        monthlyCommissions: monthlyComm,
        monthlyBonuses,
        aiCopilotAdoption: aiAdoption,
        aiCopilotRevenue: aiRevenue,
      });

      // Get rank distribution
      const { data: agentsData } = await supabase
        .from('agents')
        .select('rank');

      if (agentsData) {
        const rankCounts: Record<string, number> = {};
        agentsData.forEach((a: { rank: string }) => {
          rankCounts[a.rank] = (rankCounts[a.rank] || 0) + 1;
        });

        const distribution: RankDistribution[] = Object.entries(rankCounts)
          .map(([rank, count]) => ({
            rank,
            count,
            percentage: (count / agentsData.length) * 100,
          }))
          .sort((a, b) => (RANK_CONFIG[b.rank as Rank]?.order || 0) - (RANK_CONFIG[a.rank as Rank]?.order || 0));

        setRankDistribution(distribution);
      }

      // Get top producers
      const { data: producersData } = await supabase
        .from('agents')
        .select('id, first_name, last_name, rank, premium_90_days, personal_recruits_count')
        .order('premium_90_days', { ascending: false })
        .limit(10);

      setTopProducers((producersData || []) as TopProducer[]);

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const premiumTrend = stats.lastMonthPremium > 0
    ? ((stats.monthlyPremium - stats.lastMonthPremium) / stats.lastMonthPremium) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Performance metrics and business insights.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Premium</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyPremium)}</div>
            <div className="flex items-center text-xs">
              {premiumTrend >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
              )}
              <span className={premiumTrend >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(premiumTrend).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyCommissions)}</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonuses Paid</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyBonuses)}</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Copilot Revenue</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.aiCopilotRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.aiCopilotAdoption.toFixed(1)}% adoption rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Rank Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rank Distribution</CardTitle>
            <CardDescription>Agents by rank level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankDistribution.map((item) => (
                <div key={item.rank} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {RANK_CONFIG[item.rank as Rank]?.shortName || item.rank}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {RANK_CONFIG[item.rank as Rank]?.name || item.rank}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Producers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Producers</CardTitle>
            <CardDescription>By 90-day premium</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead className="text-right">90-Day</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducers.slice(0, 5).map((producer, index) => (
                  <TableRow key={producer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-medium">
                          {index + 1}.
                        </span>
                        <span className="font-medium">
                          {producer.first_name} {producer.last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {RANK_CONFIG[producer.rank as Rank]?.shortName || producer.rank}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(producer.premium_90_days || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>Monthly revenue sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Override Revenue</span>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.monthlyPremium * 0.02)}
              </p>
              <p className="text-xs text-muted-foreground">~2% of premium</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">AI Copilot Revenue</span>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.aiCopilotRevenue)}
              </p>
              <p className="text-xs text-muted-foreground">50% margin</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Gross Margin</span>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency((stats.monthlyPremium * 0.02) + (stats.aiCopilotRevenue * 0.5))}
              </p>
              <p className="text-xs text-muted-foreground">total monthly</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
