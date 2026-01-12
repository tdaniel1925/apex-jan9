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
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  Eye,
  Search,
  ArrowUpCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
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
import { Textarea } from '@/components/ui/textarea';

type ComplianceHold = {
  id: string;
  agent_id: string;
  hold_type: string;
  reason: string;
  severity: string;
  status: string;
  amount_held: number;
  evidence: string[];
  required_documents: string[];
  submitted_documents: string[];
  created_at: string;
  agent?: {
    id: string;
    first_name: string;
    last_name: string;
    agent_code: string;
    rank: string;
    status: string;
    email: string;
  };
  reviewer?: {
    id: string;
    first_name: string;
    last_name: string;
  };
};

type Stats = {
  total: number;
  active: number;
  underReview: number;
  resolved: number;
  escalated: number;
  critical: number;
  high: number;
  totalAmountHeld: number;
};

export default function AdminCompliancePage() {
  const [holds, setHolds] = useState<ComplianceHold[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    underReview: 0,
    resolved: 0,
    escalated: 0,
    critical: 0,
    high: 0,
    totalAmountHeld: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHold, setSelectedHold] = useState<ComplianceHold | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/compliance/holds?limit=50');

      if (!response.ok) {
        throw new Error(`Failed to fetch compliance holds: ${response.statusText}`);
      }

      const data = await response.json();
      setHolds(data.holds || []);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching compliance holds:', err);
      setError(err instanceof Error ? err.message : 'Failed to load compliance holds');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (holdId: string, action: string, notes?: string) => {
    try {
      setActionLoading(holdId);
      const response = await fetch(`/api/admin/compliance/holds/${holdId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes, resolution: notes }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} hold`);
      }

      setShowDetailDialog(false);
      setResolutionNotes('');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} hold`);
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      suspicious_activity: 'Suspicious Activity',
      compliance_violation: 'Compliance Violation',
      family_stacking: 'Family Stacking',
      high_lapse_rate: 'High Lapse Rate',
      documentation_required: 'Documentation Required',
      regulatory_review: 'Regulatory Review',
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive"><ShieldX className="mr-1 h-3 w-3" />Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-600"><ShieldAlert className="mr-1 h-3 w-3" />High</Badge>;
      case 'medium':
        return <Badge variant="secondary"><AlertTriangle className="mr-1 h-3 w-3" />Medium</Badge>;
      case 'low':
        return <Badge variant="outline"><ShieldCheck className="mr-1 h-3 w-3" />Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Active</Badge>;
      case 'under_review':
        return <Badge><Search className="mr-1 h-3 w-3" />Under Review</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Resolved</Badge>;
      case 'escalated':
        return <Badge variant="destructive"><ArrowUpCircle className="mr-1 h-3 w-3" />Escalated</Badge>;
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
          <h1 className="text-2xl font-bold tracking-tight">Compliance Holds</h1>
          <p className="text-muted-foreground">
            Review and manage compliance holds, violations, and required documentation.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Holds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">requiring attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.underReview}</div>
            <p className="text-xs text-muted-foreground">being investigated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical/High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical + stats.high}</div>
            <p className="text-xs text-muted-foreground">priority items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Amount Held</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmountHeld)}</div>
            <p className="text-xs text-muted-foreground">frozen funds</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Holds Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Hold Queue</CardTitle>
          <CardDescription>All active and recent compliance holds</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Amount Held</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <ShieldCheck className="mx-auto h-8 w-8 text-green-600 mb-2" />
                    <p className="text-muted-foreground">No compliance holds</p>
                  </TableCell>
                </TableRow>
              ) : (
                holds.map((hold) => (
                  <TableRow key={hold.id}>
                    <TableCell>
                      <div className="font-medium">
                        {hold.agent?.first_name} {hold.agent?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {hold.agent?.agent_code}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(hold.hold_type)}</TableCell>
                    <TableCell>{getSeverityBadge(hold.severity)}</TableCell>
                    <TableCell>
                      {hold.amount_held > 0 ? formatCurrency(hold.amount_held) : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(hold.status)}</TableCell>
                    <TableCell>{new Date(hold.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedHold(hold);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {hold.status === 'active' && (
                          <Button
                            size="sm"
                            onClick={() => handleAction(hold.id, 'review')}
                            disabled={actionLoading === hold.id}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        )}
                        {['active', 'under_review'].includes(hold.status) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(hold.id, 'escalate')}
                            disabled={actionLoading === hold.id}
                          >
                            <ArrowUpCircle className="h-4 w-4" />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compliance Hold Details</DialogTitle>
            <DialogDescription>
              Review hold information, evidence, and take action.
            </DialogDescription>
          </DialogHeader>
          {selectedHold && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Agent</label>
                  <p className="font-medium">
                    {selectedHold.agent?.first_name} {selectedHold.agent?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedHold.agent?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p>{getTypeBadge(selectedHold.hold_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Severity</label>
                  <p>{getSeverityBadge(selectedHold.severity)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p>{getStatusBadge(selectedHold.status)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount Held</label>
                  <p className="font-medium">
                    {selectedHold.amount_held > 0 ? formatCurrency(selectedHold.amount_held) : 'None'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p>{new Date(selectedHold.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason</label>
                <p className="mt-1 p-3 bg-muted rounded-md text-sm">{selectedHold.reason}</p>
              </div>

              {selectedHold.evidence && selectedHold.evidence.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Evidence</label>
                  <ul className="mt-1 space-y-1">
                    {selectedHold.evidence.map((e, i) => (
                      <li key={i} className="text-sm p-2 bg-muted rounded">
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedHold.required_documents && selectedHold.required_documents.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Required Documents</label>
                  <ul className="mt-1 space-y-1">
                    {selectedHold.required_documents.map((doc, i) => {
                      const isSubmitted = selectedHold.submitted_documents?.some((s) =>
                        s.includes(doc)
                      );
                      return (
                        <li
                          key={i}
                          className={`text-sm p-2 rounded flex items-center gap-2 ${
                            isSubmitted ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
                          }`}
                        >
                          {isSubmitted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                          {doc}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {['active', 'under_review'].includes(selectedHold.status) && (
                <div>
                  <label className="text-sm font-medium">Resolution Notes</label>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter notes for resolution..."
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
            {selectedHold && ['active', 'under_review'].includes(selectedHold.status) && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleAction(selectedHold.id, 'resolve', resolutionNotes)}
                disabled={actionLoading === selectedHold.id}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Resolve Hold
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
