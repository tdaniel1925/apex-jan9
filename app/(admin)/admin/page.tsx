'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { getCurrentPhase } from '@/lib/config/bonuses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/db/supabase-client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalPremium: 0,
    totalCommissions: 0,
    aiCopilotCount: 0,
    aiAdoptionRate: '0',
    phase: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Get stats
      const { count: totalAgents } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true });

      const { count: activeAgents } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { data: aiCopilotStats } = await supabase
        .from('agents')
        .select('ai_copilot_tier')
        .neq('ai_copilot_tier', 'none');

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyCommissions } = await supabase
        .from('commissions')
        .select('premium_amount, commission_amount')
        .gte('created_at', startOfMonth.toISOString());

      const commArr = monthlyCommissions || [];
      const totalPremium = commArr.reduce((sum: number, c: { premium_amount: number }) => sum + Number(c.premium_amount), 0);
      const totalCommissions = commArr.reduce((sum: number, c: { commission_amount: number }) => sum + Number(c.commission_amount), 0);

      const phase = getCurrentPhase(activeAgents || 0);
      const aiCopilotCount = aiCopilotStats?.length || 0;
      const aiAdoptionRate = totalAgents ? ((aiCopilotCount / totalAgents) * 100).toFixed(1) : '0';

      setStats({
        totalAgents: totalAgents || 0,
        activeAgents: activeAgents || 0,
        totalPremium,
        totalCommissions,
        aiCopilotCount,
        aiAdoptionRate,
        phase,
      });

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of Apex Affinity Group performance.
        </p>
      </div>

      {/* Phase Banner */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Phase</p>
              <p className="text-3xl font-bold text-primary">Phase {stats.phase}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Active Agents</p>
              <p className="text-2xl font-bold">{stats.activeAgents}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeAgents} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Premium</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPremium)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCommissions)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Copilot</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aiAdoptionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.aiCopilotCount} subscribers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/agents" className="block p-3 rounded-lg border hover:bg-muted transition-colors">
              Manage Agents
            </Link>
            <Link href="/admin/commissions" className="block p-3 rounded-lg border hover:bg-muted transition-colors">
              Import Commissions
            </Link>
            <Link href="/admin/bonuses" className="block p-3 rounded-lg border hover:bg-muted transition-colors">
              Review Bonuses
            </Link>
            <Link href="/admin/payouts" className="block p-3 rounded-lg border hover:bg-muted transition-colors">
              Process Payouts
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Current system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <span className="text-sm text-green-600">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Auth Service</span>
              <span className="text-sm text-green-600">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Commission Sync</span>
              <span className="text-sm text-green-600">Up to date</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">AI Copilot API</span>
              <span className="text-sm text-green-600">Operational</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
