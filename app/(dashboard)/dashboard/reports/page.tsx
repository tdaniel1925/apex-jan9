'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, DollarSign, Download, Calendar, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/db/supabase-client';
import { toast } from 'sonner';

export default function ReportsPage() {
  const t = useTranslations('reports');
  const { user } = useAuth();
  const [period, setPeriod] = useState('month');
  const [stats, setStats] = useState({
    totalPremium: 0,
    totalCommissions: 0,
    totalOverrides: 0,
    totalBonuses: 0,
    teamProduction: 0,
    newRecruits: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const supabase = createClient();

      // Get agent
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const agent = agentData as { id: string } | null;
      if (agent) {
        // Calculate date range based on period
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

        // Fetch commissions
        const { data: commissions } = await supabase
          .from('commissions')
          .select('premium_amount, commission_amount')
          .eq('agent_id', agent.id)
          .gte('created_at', startDate.toISOString());

        // Fetch overrides
        const { data: overrides } = await supabase
          .from('overrides')
          .select('override_amount')
          .eq('agent_id', agent.id)
          .gte('created_at', startDate.toISOString());

        // Fetch bonuses
        const { data: bonuses } = await supabase
          .from('bonuses')
          .select('amount')
          .eq('agent_id', agent.id)
          .eq('status', 'paid')
          .gte('created_at', startDate.toISOString());

        // Fetch team recruits
        const { count: newRecruits } = await supabase
          .from('agents')
          .select('*', { count: 'exact', head: true })
          .eq('sponsor_id', agent.id)
          .gte('created_at', startDate.toISOString());

        // Calculate totals
        const totalPremium = (commissions || []).reduce((sum: number, c: { premium_amount: number }) => sum + Number(c.premium_amount), 0);
        const totalCommissions = (commissions || []).reduce((sum: number, c: { commission_amount: number }) => sum + Number(c.commission_amount), 0);
        const totalOverrides = (overrides || []).reduce((sum: number, o: { override_amount: number }) => sum + Number(o.override_amount), 0);
        const totalBonuses = (bonuses || []).reduce((sum: number, b: { amount: number }) => sum + Number(b.amount), 0);

        setStats({
          totalPremium,
          totalCommissions,
          totalOverrides,
          totalBonuses,
          teamProduction: 0, // Would need to aggregate team commissions
          newRecruits: newRecruits || 0,
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [user, period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalEarnings = stats.totalCommissions + stats.totalOverrides + stats.totalBonuses;

  const handleExport = () => {
    const periodLabel = t(`periods.${period}`);

    const headers = [t('csvHeaders.metric'), t('csvHeaders.value')];
    const rows = [
      [t('csvHeaders.period'), periodLabel],
      [t('totalPremium'), `$${stats.totalPremium.toFixed(2)}`],
      [t('directCommissions'), `$${stats.totalCommissions.toFixed(2)}`],
      [t('overrideCommissions'), `$${stats.totalOverrides.toFixed(2)}`],
      [t('bonuses'), `$${stats.totalBonuses.toFixed(2)}`],
      [t('totalEarnings'), `$${totalEarnings.toFixed(2)}`],
      [t('newRecruits'), stats.newRecruits.toString()],
    ];

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('exportSuccess'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t('periods.week')}</SelectItem>
              <SelectItem value="month">{t('periods.month')}</SelectItem>
              <SelectItem value="quarter">{t('periods.quarter')}</SelectItem>
              <SelectItem value="year">{t('periods.year')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('export')}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalPremium')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPremium)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalEarnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('newRecruits')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newRecruits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('overrideEarnings')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalOverrides)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Documents Link */}
      <Link href="/dashboard/reports/tax-documents">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">{t('taxDocuments')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('taxDocumentsDesc')}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      {/* Earnings Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t('earningsBreakdown')}</CardTitle>
          <CardDescription>{t('earningsDistribution')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded bg-primary" />
                <span>{t('directCommissions')}</span>
              </div>
              <span className="font-semibold">{formatCurrency(stats.totalCommissions)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded bg-blue-500" />
                <span>{t('overrideCommissions')}</span>
              </div>
              <span className="font-semibold">{formatCurrency(stats.totalOverrides)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded bg-red-500" />
                <span>{t('bonuses')}</span>
              </div>
              <span className="font-semibold">{formatCurrency(stats.totalBonuses)}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t('total')}</span>
                <span className="text-xl font-bold">{formatCurrency(totalEarnings)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>{t('productionTrend')}</CardTitle>
          <CardDescription>{t('productionOverTime')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">{t('chartComingSoon')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
