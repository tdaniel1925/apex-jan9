'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '@/lib/engines/wallet-engine';
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
  Calendar,
  Lock,
  Unlock,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Users,
  Download,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

type PayPeriod = {
  id: string;
  period_type: string;
  period_number: number;
  year: number;
  start_date: string;
  end_date: string;
  cutoff_date: string;
  payout_date: string;
  status: string;
  total_commissions: number;
  total_overrides: number;
  total_bonuses: number;
  total_payout: number;
  agent_count: number;
};

type Stats = {
  total: number;
  open: number;
  locked: number;
  processing: number;
  paid: number;
  totalPayout: number;
  totalAgents: number;
};

export default function AdminPayPeriodsPage() {
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    open: 0,
    locked: 0,
    processing: 0,
    paid: 0,
    totalPayout: 0,
    totalAgents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/pay-periods?limit=50');

      if (!response.ok) {
        throw new Error(`Failed to fetch pay periods: ${response.statusText}`);
      }

      const data = await response.json();
      setPayPeriods(data.payPeriods || []);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching pay periods:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pay periods');
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
    toast.success('Pay period data refreshed');
  };

  const handleExport = () => {
    const headers = ['Period', 'Type', 'Start Date', 'End Date', 'Agents', 'Total Payout', 'Status'];
    const rows = payPeriods.map(p => [
      `#${p.period_number}/${p.year}`,
      p.period_type,
      new Date(p.start_date).toLocaleDateString(),
      new Date(p.end_date).toLocaleDateString(),
      p.agent_count.toString(),
      p.total_payout.toFixed(2),
      p.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pay-periods-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Pay period report exported');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="secondary"><Unlock className="mr-1 h-3 w-3" />Open</Badge>;
      case 'locked':
        return <Badge variant="outline"><Lock className="mr-1 h-3 w-3" />Locked</Badge>;
      case 'processing':
        return <Badge><PlayCircle className="mr-1 h-3 w-3" />Processing</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
          Pay period data is synced from SmartOffice. Pay period management and processing is handled in SmartOffice.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pay Periods</h1>
          <p className="text-muted-foreground">
            View pay period status synced from SmartOffice.
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Periods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground">accepting commissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">ready for payout</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPayout)}</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Agents Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">across all periods</p>
          </CardContent>
        </Card>
      </div>

      {/* Pay Periods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pay Period History</CardTitle>
          <CardDescription>Pay periods synced from SmartOffice</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Agents</TableHead>
                <TableHead>Total Payout</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payPeriods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No pay periods synced yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                payPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">
                      #{period.period_number}/{period.year}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {period.period_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{new Date(period.start_date).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        to {new Date(period.end_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {period.agent_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {formatCurrency(period.total_payout)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(period.status)}</TableCell>
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
