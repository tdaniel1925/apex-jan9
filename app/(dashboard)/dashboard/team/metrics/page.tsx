'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Award,
  BarChart3,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { RANK_CONFIG, Rank } from '@/lib/config/ranks';

interface TeamMetrics {
  summary: {
    totalDownline: number;
    activeAgents: number;
    inactiveAgents: number;
    generationsDeep: number;
  };
  production: {
    thisMonth: number;
    lastMonth: number;
    thisQuarter: number;
    lastQuarter: number;
    ytd: number;
    momGrowth: number;
    qoqGrowth: number;
  };
  growth: {
    newRecruitsThisMonth: number;
    newRecruitsLastMonth: number;
    recruitmentGrowth: number;
  };
  generationMetrics: Array<{
    generation: number;
    agents: number;
    premium: number;
    activeAgents: number;
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    rank: string;
    avatarUrl: string | null;
    premium: number;
  }>;
  monthlyBreakdown: Array<{
    month: number;
    monthName: string;
    premium: number;
    producers: number;
  }>;
}

export default function TeamMetricsPage() {
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/team/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        setError('Failed to load metrics');
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">{error || 'No metrics available'}</p>
        <Button className="mt-4" onClick={fetchMetrics}>
          Retry
        </Button>
      </div>
    );
  }

  const maxMonthlyPremium = Math.max(...metrics.monthlyBreakdown.map(m => m.premium), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/team">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Metrics</h1>
          <p className="text-muted-foreground">
            Detailed production and growth metrics for your organization
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Downline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.summary.totalDownline}</p>
            <p className="text-xs text-muted-foreground">
              {metrics.summary.activeAgents} active, {metrics.summary.inactiveAgents} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(metrics.production.thisMonth)}</p>
            <div className="flex items-center gap-1 text-xs">
              {metrics.production.momGrowth >= 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{metrics.production.momGrowth.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{metrics.production.momGrowth.toFixed(1)}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              YTD Premium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(metrics.production.ytd)}</p>
            <p className="text-xs text-muted-foreground">Year to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Generations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.summary.generationsDeep}</p>
            <p className="text-xs text-muted-foreground">Levels deep</p>
          </CardContent>
        </Card>
      </div>

      {/* Growth & Quarterly Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recruitment Growth</CardTitle>
            <CardDescription>New team members this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{metrics.growth.newRecruitsThisMonth}</p>
                <p className="text-sm text-muted-foreground">New recruits</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {metrics.growth.recruitmentGrowth >= 0 ? (
                    <>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-lg font-semibold text-green-600">
                        +{metrics.growth.recruitmentGrowth.toFixed(0)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="text-lg font-semibold text-red-600">
                        {metrics.growth.recruitmentGrowth.toFixed(0)}%
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">vs last month ({metrics.growth.newRecruitsLastMonth})</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quarterly Comparison</CardTitle>
            <CardDescription>This quarter vs last quarter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{formatCurrency(metrics.production.thisQuarter)}</p>
                <p className="text-sm text-muted-foreground">This quarter</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {metrics.production.qoqGrowth >= 0 ? (
                    <>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-lg font-semibold text-green-600">
                        +{metrics.production.qoqGrowth.toFixed(0)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="text-lg font-semibold text-red-600">
                        {metrics.production.qoqGrowth.toFixed(0)}%
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Last quarter: {formatCurrency(metrics.production.lastQuarter)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Production</CardTitle>
          <CardDescription>Team premium by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.monthlyBreakdown.map((month) => (
              <div key={month.month} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium w-12">{month.monthName}</span>
                  <span className="text-muted-foreground">{month.producers} producers</span>
                  <span className="font-semibold w-24 text-right">{formatCurrency(month.premium)}</span>
                </div>
                <Progress value={(month.premium / maxMonthlyPremium) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Generation Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Production by Generation</CardTitle>
            <CardDescription>This month&apos;s premium by level</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.generationMetrics.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No downline data</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Generation</TableHead>
                    <TableHead className="text-right">Agents</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                    <TableHead className="text-right">Premium</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.generationMetrics.map((gen) => (
                    <TableRow key={gen.generation}>
                      <TableCell>
                        <Badge variant="outline">Gen {gen.generation}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{gen.agents}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600">{gen.activeAgents}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(gen.premium)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>Highest producers this month</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.topPerformers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No production data</p>
            ) : (
              <div className="space-y-3">
                {metrics.topPerformers.map((performer, index) => (
                  <div key={performer.id} className="flex items-center gap-3">
                    <div className="w-6 text-center">
                      {index < 3 ? (
                        <span className={`text-lg font-bold ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          'text-amber-600'
                        }`}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{index + 1}</span>
                      )}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={performer.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {performer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{performer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {RANK_CONFIG[performer.rank as Rank]?.shortName || performer.rank}
                      </p>
                    </div>
                    <span className="font-semibold text-sm">
                      {formatCurrency(performer.premium)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
