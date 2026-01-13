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
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { CommissionImportDialog } from '@/components/admin/commission-import-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RequirePermission, PermissionGate, PERMISSIONS } from '@/components/admin/permission-gate';

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
  const [error, setError] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Commissions</h1>
          <p className="text-muted-foreground">
            Upload carrier commission files and manage commission records.
          </p>
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

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Commission File</CardTitle>
          <CardDescription>
            Upload a CSV file to import commission records in bulk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Import Commissions from CSV</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Bulk import with column mapping, validation, and error reporting.
            </p>
            <PermissionGate permission={PERMISSIONS.COMMISSIONS_IMPORT}>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={() => setShowImportDialog(true)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Import Commissions
              </Button>
            </div>
            </PermissionGate>
          </div>
        </CardContent>
      </Card>

      {/* Recent Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commissions</CardTitle>
          <CardDescription>
            Latest imported commission records
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
                    <p className="text-muted-foreground">No commissions imported yet</p>
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

      {/* Import Dialog */}
      <CommissionImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={fetchData}
      />
    </div>
    </RequirePermission>
  );
}
