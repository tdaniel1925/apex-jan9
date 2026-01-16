'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import { DollarSign, Download, Search, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

type OverrideWithDetails = {
  id: string;
  agent_id: string;
  commission_id: string;
  generation: number;
  override_rate: number;
  override_amount: number;
  created_at: string;
  agents: { first_name: string; last_name: string; rank: string } | null;
  commissions: {
    policy_number: string;
    carrier: string;
    premium_amount: number;
    agents: { first_name: string; last_name: string } | null;
  } | null;
};

interface OverrideSummary {
  agentId: string;
  agentName: string;
  rank: string;
  totalOverrides: number;
  gen1: number;
  gen2: number;
  gen3: number;
  gen4: number;
  gen5: number;
  gen6: number;
}

export default function AdminOverridesPage() {
  const [overrides, setOverrides] = useState<OverrideWithDetails[]>([]);
  const [summaries, setSummaries] = useState<OverrideSummary[]>([]);
  const [stats, setStats] = useState({
    totalOverrides: 0,
    monthlyTotal: 0,
    avgOverride: 0,
    poolAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/overrides?limit=100');
      if (!response.ok) {
        throw new Error(`Failed to fetch overrides: ${response.statusText}`);
      }

      const data = await response.json();
      setOverrides(data.overrides || []);

      // Use API stats if available, otherwise calculate
      if (data.stats) {
        setStats({
          totalOverrides: data.stats.totalCount || 0,
          monthlyTotal: data.stats.totalAmount || 0,
          avgOverride: data.stats.averageAmount || 0,
          poolAmount: data.stats.poolAmount || 0,
        });
      }

      // Calculate agent summaries from overrides
      if (data.overrides && data.overrides.length > 0) {
        const agentMap = new Map<string, OverrideSummary>();

        data.overrides.forEach((o: OverrideWithDetails) => {
          if (!agentMap.has(o.agent_id)) {
            agentMap.set(o.agent_id, {
              agentId: o.agent_id,
              agentName: o.agents ? `${o.agents.first_name} ${o.agents.last_name}` : 'Unknown',
              rank: o.agents?.rank || 'unknown',
              totalOverrides: 0,
              gen1: 0,
              gen2: 0,
              gen3: 0,
              gen4: 0,
              gen5: 0,
              gen6: 0,
            });
          }

          const summary = agentMap.get(o.agent_id)!;
          summary.totalOverrides += Number(o.override_amount);

          if (o.generation === 1) summary.gen1 += Number(o.override_amount);
          else if (o.generation === 2) summary.gen2 += Number(o.override_amount);
          else if (o.generation === 3) summary.gen3 += Number(o.override_amount);
          else if (o.generation === 4) summary.gen4 += Number(o.override_amount);
          else if (o.generation === 5) summary.gen5 += Number(o.override_amount);
          else if (o.generation === 6) summary.gen6 += Number(o.override_amount);
        });

        const sortedSummaries = Array.from(agentMap.values())
          .sort((a, b) => b.totalOverrides - a.totalOverrides);

        setSummaries(sortedSummaries);
      }
    } catch (err) {
      console.error('Error fetching overrides:', err);
      setError(err instanceof Error ? err.message : 'Failed to load overrides');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Override data refreshed');
  };

  const handleExportReport = () => {
    const headers = ['Recipient', 'Rank', 'Gen 1', 'Gen 2', 'Gen 3', 'Gen 4', 'Gen 5', 'Gen 6', 'Total'];
    const rows = summaries.map(s => [
      s.agentName,
      s.rank,
      s.gen1.toFixed(2),
      s.gen2.toFixed(2),
      s.gen3.toFixed(2),
      s.gen4.toFixed(2),
      s.gen5.toFixed(2),
      s.gen6.toFixed(2),
      s.totalOverrides.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `override-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Override report exported');
  };

  const filteredOverrides = overrides.filter(o => {
    if (!searchQuery) return true;
    const agentName = o.agents ? `${o.agents.first_name} ${o.agents.last_name}`.toLowerCase() : '';
    const policyNumber = o.commissions?.policy_number?.toLowerCase() || '';
    return agentName.includes(searchQuery.toLowerCase()) || policyNumber.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* SmartOffice Sync Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Override data is synced from SmartOffice. All override calculations and payments are processed in SmartOffice.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Override Report</h1>
          <p className="text-muted-foreground">
            View 6-generation override data synced from SmartOffice.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Overrides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOverrides}</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Override Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyTotal)}</div>
            <p className="text-xs text-muted-foreground">paid to upline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Override</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgOverride)}</div>
            <p className="text-xs text-muted-foreground">per transaction</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leadership Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.poolAmount)}</div>
            <p className="text-xs text-muted-foreground">0.5% contribution</p>
          </CardContent>
        </Card>
      </div>

      {/* Generation Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Breakdown</CardTitle>
          <CardDescription>Override rates by generation level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            {[
              { gen: 1, rate: '15%', label: 'Gen 1' },
              { gen: 2, rate: '5%', label: 'Gen 2' },
              { gen: 3, rate: '3%', label: 'Gen 3' },
              { gen: 4, rate: '2%', label: 'Gen 4' },
              { gen: 5, rate: '1%', label: 'Gen 5' },
              { gen: 6, rate: '0.5%', label: 'Gen 6' },
            ].map((item) => (
              <div
                key={item.gen}
                className="text-center p-4 rounded-lg bg-muted/50"
              >
                <div className="text-2xl font-bold text-primary">{item.rate}</div>
                <div className="text-sm text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Override by Agent</CardTitle>
          <CardDescription>Monthly override earnings by agent synced from SmartOffice</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead className="text-right">Gen 1</TableHead>
                <TableHead className="text-right">Gen 2</TableHead>
                <TableHead className="text-right">Gen 3</TableHead>
                <TableHead className="text-right">Gen 4</TableHead>
                <TableHead className="text-right">Gen 5</TableHead>
                <TableHead className="text-right">Gen 6</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No overrides synced yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                summaries.slice(0, 20).map((summary) => (
                  <TableRow key={summary.agentId}>
                    <TableCell className="font-medium">{summary.agentName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {RANK_CONFIG[summary.rank as Rank]?.shortName || summary.rank}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{summary.gen1 > 0 ? formatCurrency(summary.gen1) : '-'}</TableCell>
                    <TableCell className="text-right">{summary.gen2 > 0 ? formatCurrency(summary.gen2) : '-'}</TableCell>
                    <TableCell className="text-right">{summary.gen3 > 0 ? formatCurrency(summary.gen3) : '-'}</TableCell>
                    <TableCell className="text-right">{summary.gen4 > 0 ? formatCurrency(summary.gen4) : '-'}</TableCell>
                    <TableCell className="text-right">{summary.gen5 > 0 ? formatCurrency(summary.gen5) : '-'}</TableCell>
                    <TableCell className="text-right">{summary.gen6 > 0 ? formatCurrency(summary.gen6) : '-'}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(summary.totalOverrides)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Overrides */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Overrides</CardTitle>
              <CardDescription>Individual override transactions synced from SmartOffice</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by agent or policy..."
                className="pl-9 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>From Agent</TableHead>
                <TableHead>Policy</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Gen</TableHead>
                <TableHead>Override</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOverrides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No overrides match your search' : 'No overrides synced yet'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOverrides.slice(0, 50).map((override) => (
                  <TableRow key={override.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {override.agents?.first_name} {override.agents?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {override.agents?.rank && RANK_CONFIG[override.agents.rank as Rank]?.shortName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {override.commissions?.agents?.first_name} {override.commissions?.agents?.last_name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {override.commissions?.policy_number}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(override.commissions?.premium_amount || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Gen {override.generation}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(override.override_amount)}
                    </TableCell>
                    <TableCell>
                      {new Date(override.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
