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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [error, setError] = useState<string | null>(null);
  const [selectedClawback, setSelectedClawback] = useState<Clawback | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const handleAction = async (clawbackId: string, action: string, notes?: string) => {
    try {
      setActionLoading(clawbackId);
      const response = await fetch(`/api/admin/clawbacks/${clawbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} clawback`);
      }

      setShowDetailDialog(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} clawback`);
    } finally {
      setActionLoading(null);
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clawbacks</h1>
          <p className="text-muted-foreground">
            Manage commission reversals for refunds, chargebacks, and fraud.
          </p>
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
          <CardTitle>Clawback Queue</CardTitle>
          <CardDescription>All clawback requests and their status</CardDescription>
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
                    <p className="text-muted-foreground">No clawbacks recorded</p>
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
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClawback(clawback);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {clawback.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAction(clawback.id, 'process')}
                              disabled={actionLoading === clawback.id}
                            >
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(clawback.id, 'cancel')}
                              disabled={actionLoading === clawback.id}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {clawback.status === 'processing' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAction(clawback.id, 'complete')}
                            disabled={actionLoading === clawback.id}
                          >
                            <CheckCircle className="h-4 w-4" />
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Clawback Details</DialogTitle>
            <DialogDescription>
              Review clawback information and take action.
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
