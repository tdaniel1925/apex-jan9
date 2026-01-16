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
  RotateCcw,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  Eye,
  Download,
  RefreshCw,
  Info,
  MoreHorizontal,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type Clawback = {
  id: string;
  commission_id: string;
  clawback_type: string;
  original_amount: number;
  clawback_amount: number;
  reason: string;
  status: string;
  created_at: string;
  commission?: {
    id: string;
    policy_number: string;
    premium_amount: number;
    commission_amount: number;
    agent?: {
      id: string;
      first_name: string;
      last_name: string;
      agent_code: string;
    };
  };
};

type Stats = {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  totalAmount: number;
};

export default function AdminClawbacksPage() {
  const [clawbacks, setClawbacks] = useState<Clawback[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClawback, setSelectedClawback] = useState<Clawback | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/clawbacks?limit=50');

      if (!response.ok) {
        throw new Error(`Failed to fetch clawbacks: ${response.statusText}`);
      }

      const data = await response.json();
      setClawbacks(data.clawbacks || []);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching clawbacks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load clawbacks');
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
    toast.success('Clawback data refreshed');
  };

  const handleExport = () => {
    const headers = ['Agent', 'Agent Code', 'Policy', 'Type', 'Original', 'Clawback', 'Reason', 'Status', 'Date'];
    const rows = clawbacks.map(c => [
      `${c.commission?.agent?.first_name || ''} ${c.commission?.agent?.last_name || ''}`,
      c.commission?.agent?.agent_code || '',
      c.commission?.policy_number || '',
      c.clawback_type.replace('_', ' '),
      c.original_amount.toFixed(2),
      c.clawback_amount.toFixed(2),
      `"${c.reason.replace(/"/g, '""')}"`,
      c.status,
      new Date(c.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clawbacks-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Clawback report exported');
  };

  const handleUpdateStatus = async (clawbackId: string, newStatus: string) => {
    setProcessing(clawbackId);
    try {
      const response = await fetch(`/api/admin/clawbacks/${clawbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update clawback status`);
      }

      toast.success(`Clawback ${newStatus}`);
      await fetchData();
    } catch (err) {
      console.error('Error updating clawback:', err);
      toast.error('Failed to update clawback');
    } finally {
      setProcessing(null);
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      refund: 'bg-blue-100 text-blue-800',
      chargeback: 'bg-orange-100 text-orange-800',
      fraud: 'bg-red-100 text-red-800',
      lapse: 'bg-yellow-100 text-yellow-800',
      admin_adjustment: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge variant="outline" className={colors[type] || ''}>
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'processing':
        return <Badge><PlayCircle className="mr-1 h-3 w-3" />Processing</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><XCircle className="mr-1 h-3 w-3" />Cancelled</Badge>;
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

      {/* SmartOffice Integration Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Clawback data is synced from SmartOffice. Process and complete clawbacks here, then submit to SmartOffice for payment adjustments.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clawback Management</h1>
          <p className="text-muted-foreground">
            View and manage commission reversals.
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
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">fully processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clawed Back</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
      </div>

      {/* Clawbacks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clawback Records</CardTitle>
          <CardDescription>Commission reversals synced from SmartOffice</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Policy</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Original</TableHead>
                <TableHead>Clawback</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clawbacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RotateCcw className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No clawbacks yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                clawbacks.map((clawback) => (
                  <TableRow key={clawback.id}>
                    <TableCell>
                      <div className="font-medium">
                        {clawback.commission?.agent?.first_name} {clawback.commission?.agent?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {clawback.commission?.agent?.agent_code}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {clawback.commission?.policy_number}
                    </TableCell>
                    <TableCell>{getTypeBadge(clawback.clawback_type)}</TableCell>
                    <TableCell>{formatCurrency(clawback.original_amount)}</TableCell>
                    <TableCell className="font-medium text-red-600">
                      -{formatCurrency(clawback.clawback_amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(clawback.status)}</TableCell>
                    <TableCell>{new Date(clawback.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processing === clawback.id}
                          >
                            {processing === clawback.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedClawback(clawback);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {clawback.status === 'pending' && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(clawback.id, 'processing')}
                            >
                              <PlayCircle className="mr-2 h-4 w-4 text-blue-600" />
                              Start Processing
                            </DropdownMenuItem>
                          )}
                          {clawback.status === 'processing' && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(clawback.id, 'completed')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Mark Completed
                            </DropdownMenuItem>
                          )}
                          {(clawback.status === 'pending' || clawback.status === 'processing') && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(clawback.id, 'cancelled')}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Clawback Details</DialogTitle>
            <DialogDescription>
              View clawback information synced from SmartOffice.
            </DialogDescription>
          </DialogHeader>
          {selectedClawback && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Agent</label>
                  <p className="font-medium">
                    {selectedClawback.commission?.agent?.first_name}{' '}
                    {selectedClawback.commission?.agent?.last_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Policy</label>
                  <p className="font-mono">{selectedClawback.commission?.policy_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p>{getTypeBadge(selectedClawback.clawback_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p>{getStatusBadge(selectedClawback.status)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Original Amount</label>
                  <p className="font-medium">{formatCurrency(selectedClawback.original_amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Clawback Amount</label>
                  <p className="font-medium text-red-600">
                    -{formatCurrency(selectedClawback.clawback_amount)}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason</label>
                <p className="mt-1 p-3 bg-muted rounded-md text-sm">{selectedClawback.reason}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
