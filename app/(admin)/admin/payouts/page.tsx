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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Wallet, CheckCircle, Clock, XCircle, Filter, AlertCircle, Download, RefreshCw, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const PAYOUT_METHODS = [
  { value: 'all', label: 'All Methods' },
  { value: 'ach', label: 'ACH Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'wire', label: 'Wire Transfer' },
];

type PayoutWithAgent = {
  id: string;
  agent_id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  agents: { first_name: string; last_name: string; email: string } | null;
};

export default function AdminPayoutsPage() {
  const [allPayouts, setAllPayouts] = useState<PayoutWithAgent[]>([]);
  const [stats, setStats] = useState({
    pendingTotal: 0,
    pendingCount: 0,
    processedTotal: 0,
    processedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all payouts from API
      const response = await fetch('/api/admin/payouts?limit=100');
      if (!response.ok) {
        throw new Error(`Failed to fetch payouts: ${response.statusText}`);
      }
      const data = await response.json();
      setAllPayouts(data.payouts || []);

      // Use API stats
      setStats({
        pendingTotal: data.stats?.pendingAmount || 0,
        pendingCount: data.stats?.pendingCount || 0,
        processedTotal: data.stats?.totalAmount || 0,
        processedCount: data.stats?.completedCount || 0,
      });
    } catch (err) {
      console.error('Error fetching payouts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payouts');
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
    toast.success('Payout data refreshed');
  };

  const handleExport = () => {
    const headers = ['Agent', 'Email', 'Amount', 'Method', 'Status', 'Requested', 'Processed'];
    const rows = allPayouts.map(p => [
      `${p.agents?.first_name || ''} ${p.agents?.last_name || ''}`,
      p.agents?.email || '',
      p.amount.toFixed(2),
      p.method,
      p.status,
      new Date(p.created_at).toLocaleDateString(),
      p.processed_at ? new Date(p.processed_at).toLocaleDateString() : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Payout report exported');
  };

  // Filter payouts by method and status
  const filteredPayouts = allPayouts.filter(payout => {
    const methodMatch = filterMethod === 'all' || payout.method === filterMethod;
    const statusMatch = filterStatus === 'all' || payout.status === filterStatus;
    return methodMatch && statusMatch;
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
          Payout data is synced from SmartOffice. All payment processing is handled in SmartOffice.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payout History</h1>
          <p className="text-muted-foreground">
            View agent payout records synced from SmartOffice.
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
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.pendingTotal)} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.processedTotal)}</div>
            <p className="text-xs text-muted-foreground">in payouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processedCount}</div>
            <p className="text-xs text-muted-foreground">completed</p>
          </CardContent>
        </Card>
      </div>

      {/* All Payouts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Payouts</CardTitle>
              <CardDescription>
                Payout records synced from SmartOffice
              </CardDescription>
            </div>
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {(filterMethod !== 'all' || filterStatus !== 'all') && (
                    <Badge variant="secondary" className="ml-2">
                      {(filterMethod !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={filterMethod} onValueChange={setFilterMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYOUT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(filterMethod !== 'all' || filterStatus !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setFilterMethod('all');
                        setFilterStatus('all');
                        setIsFilterOpen(false);
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Processed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Wallet className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">
                      {filterMethod !== 'all' || filterStatus !== 'all'
                        ? 'No payouts match this filter'
                        : 'No payouts synced yet'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payout.agents?.first_name} {payout.agents?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payout.agents?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-lg">
                      {formatCurrency(payout.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payout.method === 'ach' && 'ACH Transfer'}
                        {payout.method === 'check' && 'Check'}
                        {payout.method === 'wire' && 'Wire Transfer'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payout.status === 'completed'
                            ? 'default'
                            : payout.status === 'processing'
                            ? 'secondary'
                            : payout.status === 'pending'
                            ? 'outline'
                            : 'destructive'
                        }
                      >
                        {payout.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                        {payout.status === 'processing' && <Clock className="mr-1 h-3 w-3" />}
                        {payout.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                        {payout.status === 'failed' && <XCircle className="mr-1 h-3 w-3" />}
                        {payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(payout.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {payout.processed_at
                        ? new Date(payout.processed_at).toLocaleDateString()
                        : '-'}
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
