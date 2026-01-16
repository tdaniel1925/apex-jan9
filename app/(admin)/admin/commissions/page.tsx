'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { CARRIER_CONFIG } from '@/lib/config/carriers';
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
import { Download, CheckCircle, AlertCircle, Clock, RefreshCw, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RequirePermission, PERMISSIONS } from '@/components/admin/permission-gate';
import { toast } from 'sonner';

type CommissionWithAgent = {
  id: string;
  agent_id: string;
  carrier: string;
  policy_number: string;
  premium_amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
  agents: { first_name: string; last_name: string } | null;
};

export default function AdminCommissionsPage() {
  const [recentCommissions, setRecentCommissions] = useState<CommissionWithAgent[]>([]);
  const [stats, setStats] = useState({
    monthlyCount: 0,
    totalPremium: 0,
    totalCommissions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/commissions?limit=50');

      if (!response.ok) {
        throw new Error(`Failed to fetch commissions: ${response.statusText}`);
      }

      const data = await response.json();
      setRecentCommissions(data.commissions || []);

      // Use API stats
      setStats({
        monthlyCount: data.stats?.totalCommissions || 0,
        totalPremium: data.stats?.totalAmount || 0,
        totalCommissions: data.stats?.totalAmount || 0,
      });
    } catch (err) {
      console.error('Error fetching commissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load commissions');
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
    toast.success('Commission data refreshed');
  };

  const handleExport = () => {
    const headers = ['Agent', 'Carrier', 'Policy #', 'Premium', 'Commission', 'Status', 'Date'];
    const rows = recentCommissions.map(c => [
      `${c.agents?.first_name || ''} ${c.agents?.last_name || ''}`,
      c.carrier,
      c.policy_number,
      c.premium_amount.toFixed(2),
      c.commission_amount.toFixed(2),
      c.status,
      new Date(c.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commissions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Commission report exported');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <RequirePermission permission={PERMISSIONS.COMMISSIONS_VIEW}>
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
          Commission data is synced from SmartOffice. All commission processing and payments are handled in SmartOffice.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commission History</h1>
          <p className="text-muted-foreground">
            View commission records synced from SmartOffice.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyCount}</div>
            <p className="text-xs text-muted-foreground">commission records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Premium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPremium)}</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCommissions)}</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commissions</CardTitle>
          <CardDescription>
            Commission records synced from SmartOffice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Policy #</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCommissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No commissions synced yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                recentCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <div className="font-medium">
                        {commission.agents?.first_name} {commission.agents?.last_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CARRIER_CONFIG[commission.carrier as keyof typeof CARRIER_CONFIG]?.shortName || commission.carrier}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {commission.policy_number}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(commission.premium_amount)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(commission.commission_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          commission.status === 'paid'
                            ? 'default'
                            : commission.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {commission.status === 'paid' && <CheckCircle className="mr-1 h-3 w-3" />}
                        {commission.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                        {commission.status === 'reversed' && <AlertCircle className="mr-1 h-3 w-3" />}
                        {commission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(commission.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </RequirePermission>
  );
}
