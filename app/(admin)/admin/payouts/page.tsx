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
import { Checkbox } from '@/components/ui/checkbox';
import { Wallet, CheckCircle, Clock, XCircle, Filter, AlertTriangle, AlertCircle } from 'lucide-react';
import { PayoutActions } from '@/components/admin/payout-actions';
import { BulkPayoutDialog } from '@/components/admin/bulk-payout-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [pendingPayouts, setPendingPayouts] = useState<PayoutWithAgent[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<PayoutWithAgent[]>([]);
  const [stats, setStats] = useState({
    pendingTotal: 0,
    pendingCount: 0,
    processedTotal: 0,
    processedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get pending payouts from API
      const pendingResponse = await fetch('/api/admin/payouts?status=pending&limit=100');
      if (!pendingResponse.ok) {
        throw new Error(`Failed to fetch pending payouts: ${pendingResponse.statusText}`);
      }
      const pendingData = await pendingResponse.json();
      setPendingPayouts(pendingData.payouts || []);

      // Get recent payouts (non-pending) from API
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const recentResponse = await fetch(`/api/admin/payouts?status=completed&from_date=${startOfMonth.toISOString()}&limit=50`);
      if (!recentResponse.ok) {
        throw new Error(`Failed to fetch recent payouts: ${recentResponse.statusText}`);
      }
      const recentData = await recentResponse.json();
      setRecentPayouts(recentData.payouts || []);

      // Use API stats
      setStats({
        pendingTotal: pendingData.stats?.pendingAmount || 0,
        pendingCount: pendingData.stats?.pendingCount || 0,
        processedTotal: recentData.stats?.totalAmount || 0,
        processedCount: recentData.stats?.completedCount || 0,
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

  const handleSelectAll = () => {
    if (selectedIds.length === pendingPayouts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingPayouts.map((p) => p.id));
    }
  };

  const handleToggle = (payoutId: string) => {
    setSelectedIds((prev) =>
      prev.includes(payoutId)
        ? prev.filter((id) => id !== payoutId)
        : [...prev, payoutId]
    );
  };

  const handleBulkSuccess = () => {
    setSelectedIds([]);
    setShowBulkDialog(false);
    fetchData();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Process Payouts</h1>
          <p className="text-muted-foreground">
            Review and process agent withdrawal requests.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{stats.pendingCount}</div>
            <p className="text-xs text-amber-700">
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
            <CardTitle className="text-sm font-medium">Monthly Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processedCount}</div>
            <p className="text-xs text-muted-foreground">transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Warning if pending payouts */}
      {stats.pendingCount > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">
                  {stats.pendingCount} payout{stats.pendingCount > 1 ? 's' : ''} awaiting processing
                </p>
                <p className="text-sm text-amber-700">
                  Total amount: {formatCurrency(stats.pendingTotal)}
                </p>
              </div>
              <Button
                className="ml-auto"
                size="sm"
                onClick={() => {
                  setSelectedIds(pendingPayouts.map((p) => p.id));
                  setShowBulkDialog(true);
                }}
                disabled={stats.pendingCount === 0}
              >
                Process All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Payouts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Payouts</CardTitle>
              <CardDescription>
                Withdrawal requests awaiting processing
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedIds.length === pendingPayouts.length && pendingPayouts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Wallet className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No pending payouts</p>
                  </TableCell>
                </TableRow>
              ) : (
                pendingPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(payout.id)}
                        onCheckedChange={() => handleToggle(payout.id)}
                      />
                    </TableCell>
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
                      {new Date(payout.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <PayoutActions
                        payoutId={payout.id}
                        agentName={`${payout.agents?.first_name} ${payout.agents?.last_name}`}
                        amount={payout.amount}
                        method={payout.method}
                        status={payout.status}
                        onSuccess={fetchData}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Payouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payouts</CardTitle>
          <CardDescription>
            Processed payout history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">No payout history</p>
                  </TableCell>
                </TableRow>
              ) : (
                recentPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      {payout.agents?.first_name} {payout.agents?.last_name}
                    </TableCell>
                    <TableCell className="font-semibold">
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
                            : 'destructive'
                        }
                      >
                        {payout.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                        {payout.status === 'processing' && <Clock className="mr-1 h-3 w-3" />}
                        {payout.status === 'failed' && <XCircle className="mr-1 h-3 w-3" />}
                        {payout.status}
                      </Badge>
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

      <BulkPayoutDialog
        payouts={pendingPayouts.filter((p) => selectedIds.includes(p.id))}
        action="process"
        open={showBulkDialog}
        onOpenChange={setShowBulkDialog}
        onSuccess={handleBulkSuccess}
      />
    </div>
  );
}
