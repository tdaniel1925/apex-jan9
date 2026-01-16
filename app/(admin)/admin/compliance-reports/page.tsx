'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Download,
  AlertTriangle,
  ArrowUpRight,
  Ban,
  FileWarning,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ComplianceLog {
  id: string;
  agent_id: string;
  event_type: string;
  policy_id: string | null;
  commission_id: string | null;
  override_id: string | null;
  description: string;
  action_taken: string;
  regulatory_reference: string;
  original_amount: number | null;
  rolled_up_to_agent_id: string | null;
  triggered_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  agent?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  rolled_up_to_agent?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface Summary {
  totalEvents: number;
  overridesPrevented: number;
  commissionsRolledUp: number;
  commissionsForfeited: number;
  licenseChanges: number;
  amountRolledUp: number;
  amountForfeited: number;
  totalAmountAffected: number;
}

interface AgentStats {
  unlicensedCount: number;
  expiringLicensesCount: number;
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  unlicensed_override_prevented: {
    label: 'Override Prevented',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: <Ban className="h-3 w-3" />,
  },
  commission_rolled_up: {
    label: 'Commission Rolled Up',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: <ArrowUpRight className="h-3 w-3" />,
  },
  commission_forfeited: {
    label: 'Commission Forfeited',
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
    icon: <FileWarning className="h-3 w-3" />,
  },
  license_status_change: {
    label: 'License Change',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    icon: <RefreshCw className="h-3 w-3" />,
  },
  compliance_review_required: {
    label: 'Review Required',
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

export default function ComplianceReportsPage() {
  const [logs, setLogs] = useState<ComplianceLog[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ComplianceLog | null>(null);

  // Filters
  const [eventType, setEventType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (eventType && eventType !== 'all') {
        params.set('event_type', eventType);
      }
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const response = await fetch(`/api/admin/compliance-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch logs');

      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load compliance logs');
    }
  }, [page, eventType, startDate, endDate]);

  const fetchSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const response = await fetch(`/api/admin/compliance-logs/summary?${params}`);
      if (!response.ok) throw new Error('Failed to fetch summary');

      const data = await response.json();
      setSummary(data.summary);
      setAgentStats(data.agents);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchLogs(), fetchSummary()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchLogs, fetchSummary]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Build CSV content
      const headers = [
        'Date',
        'Event Type',
        'Agent Name',
        'Agent Email',
        'Description',
        'Action Taken',
        'Amount',
        'Rolled Up To',
        'Regulatory Reference',
      ];

      // Fetch all logs for export (up to 10000)
      const params = new URLSearchParams({ limit: '10000' });
      if (eventType && eventType !== 'all') params.set('event_type', eventType);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const response = await fetch(`/api/admin/compliance-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch logs for export');

      const data = await response.json();
      const exportLogs = data.logs as ComplianceLog[];

      const rows = exportLogs.map((log) => [
        new Date(log.created_at).toISOString(),
        log.event_type,
        log.agent ? `${log.agent.first_name} ${log.agent.last_name}` : 'Unknown',
        log.agent?.email || '',
        `"${log.description.replace(/"/g, '""')}"`,
        `"${log.action_taken.replace(/"/g, '""')}"`,
        log.original_amount?.toFixed(2) || '',
        log.rolled_up_to_agent
          ? `${log.rolled_up_to_agent.first_name} ${log.rolled_up_to_agent.last_name}`
          : '',
        `"${log.regulatory_reference}"`,
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${exportLogs.length} compliance records`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export compliance logs');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance Reports</h1>
          <p className="text-muted-foreground">
            Audit trail for commission compliance events
          </p>
        </div>
        <Button onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                All compliance events recorded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overrides Prevented
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.overridesPrevented}</div>
              <p className="text-xs text-muted-foreground">
                Blocked due to unlicensed status
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Amount Rolled Up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.amountRolledUp)}
              </div>
              <p className="text-xs text-muted-foreground">
                Passed to licensed uplines
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Amount Forfeited
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.amountForfeited)}
              </div>
              <p className="text-xs text-muted-foreground">
                Retained by company
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Alerts */}
      {agentStats && (agentStats.unlicensedCount > 0 || agentStats.expiringLicensesCount > 0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>License Attention Required</AlertTitle>
          <AlertDescription>
            {agentStats.unlicensedCount > 0 && (
              <span className="block">
                {agentStats.unlicensedCount} agent{agentStats.unlicensedCount > 1 ? 's' : ''} currently unlicensed
              </span>
            )}
            {agentStats.expiringLicensesCount > 0 && (
              <span className="block">
                {agentStats.expiringLicensesCount} license{agentStats.expiringLicensesCount > 1 ? 's' : ''} expiring in the next 30 days
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter compliance events by type and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={eventType} onValueChange={(v) => { setEventType(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="unlicensed_override_prevented">Override Prevented</SelectItem>
                  <SelectItem value="commission_rolled_up">Commission Rolled Up</SelectItem>
                  <SelectItem value="commission_forfeited">Commission Forfeited</SelectItem>
                  <SelectItem value="license_status_change">License Change</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEventType('all');
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Events</CardTitle>
          <CardDescription>
            Showing {logs.length} of {total} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No compliance events found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const config = EVENT_TYPE_CONFIG[log.event_type] || {
                    label: log.event_type,
                    color: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
                    icon: <Shield className="h-3 w-3" />,
                  };

                  return (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={config.color}>
                          {config.icon}
                          <span className="ml-1">{config.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.agent ? (
                          <div>
                            <div className="font-medium">
                              {log.agent.first_name} {log.agent.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.agent.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="truncate text-sm">{log.description}</p>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {log.original_amount
                          ? formatCurrency(log.original_amount)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compliance Event Details</DialogTitle>
            <DialogDescription>
              Full audit trail entry for regulatory examination
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Event Type</Label>
                  <p className="font-medium">
                    {EVENT_TYPE_CONFIG[selectedLog.event_type]?.label || selectedLog.event_type}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date/Time</Label>
                  <p className="font-medium">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Agent</Label>
                <p className="font-medium">
                  {selectedLog.agent
                    ? `${selectedLog.agent.first_name} ${selectedLog.agent.last_name} (${selectedLog.agent.email})`
                    : 'Unknown'}
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="font-medium">{selectedLog.description}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Action Taken</Label>
                <p className="font-medium">{selectedLog.action_taken}</p>
              </div>

              {selectedLog.original_amount && (
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-medium text-lg">
                    {formatCurrency(selectedLog.original_amount)}
                  </p>
                </div>
              )}

              {selectedLog.rolled_up_to_agent && (
                <div>
                  <Label className="text-muted-foreground">Rolled Up To</Label>
                  <p className="font-medium">
                    {selectedLog.rolled_up_to_agent.first_name}{' '}
                    {selectedLog.rolled_up_to_agent.last_name}
                  </p>
                </div>
              )}

              <div className="bg-muted p-3 rounded-lg">
                <Label className="text-muted-foreground">Regulatory Reference</Label>
                <p className="text-sm font-mono">{selectedLog.regulatory_reference}</p>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Additional Metadata</Label>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[200px]">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="text-xs text-muted-foreground border-t pt-4">
                <p>Event ID: {selectedLog.id}</p>
                <p>Triggered by: {selectedLog.triggered_by || 'system'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Regulatory Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Audit Trail Requirements</AlertTitle>
        <AlertDescription>
          These compliance logs are immutable and retained for regulatory examination.
          Records cannot be modified or deleted. Export to CSV for external reporting requirements.
        </AlertDescription>
      </Alert>
    </div>
  );
}
