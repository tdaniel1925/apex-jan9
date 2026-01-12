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
  Plus,
  DollarSign,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPeriodType, setNewPeriodType] = useState<string>('monthly');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const handleCreatePeriod = async () => {
    try {
      setActionLoading('create');
      const response = await fetch('/api/admin/pay-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_type: newPeriodType }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create pay period');
      }

      setShowCreateDialog(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pay period');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (periodId: string, action: string) => {
    try {
      setActionLoading(periodId);
      const response = await fetch(`/api/admin/pay-periods/${periodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} pay period`);
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} pay period`);
    } finally {
      setActionLoading(null);
    }
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pay Periods</h1>
          <p className="text-muted-foreground">
            Manage commission batching and payout cycles.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Pay Period
        </Button>
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
          <CardDescription>All pay periods and their status</CardDescription>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payPeriods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No pay periods created yet</p>
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
                    <TableCell>
                      <div className="flex gap-2">
                        {period.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(period.id, 'lock')}
                            disabled={actionLoading === period.id}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        )}
                        {period.status === 'locked' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(period.id, 'unlock')}
                              disabled={actionLoading === period.id}
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAction(period.id, 'process')}
                              disabled={actionLoading === period.id}
                            >
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {period.status === 'processing' && (
                          <Button
                            size="sm"
                            onClick={() => handleAction(period.id, 'pay')}
                            disabled={actionLoading === period.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Pay
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Pay Period</DialogTitle>
            <DialogDescription>
              Create a new pay period to batch commissions for payout.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Period Type</label>
            <Select value={newPeriodType} onValueChange={setNewPeriodType}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePeriod} disabled={actionLoading === 'create'}>
              {actionLoading === 'create' ? 'Creating...' : 'Create Period'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
