'use client';

import { useEffect, useState, useCallback } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, LogIn, LogOut, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminAuth } from '@/components/admin/admin-auth-provider';

interface AuditEntry {
  id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const actionIcons: Record<string, typeof Eye> = {
  view: Eye,
  create: Plus,
  update: Pencil,
  delete: Trash2,
  login: LogIn,
  logout: LogOut,
};

const actionColors: Record<string, string> = {
  view: 'bg-gray-100 text-gray-800',
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-purple-100 text-purple-800',
  logout: 'bg-orange-100 text-orange-800',
};

export default function AdminAuditPage() {
  const { token } = useAdminAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState(0);
  const limit = 25;

  const fetchAuditLog = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });

      if (actionFilter !== 'all') {
        params.set('action', actionFilter);
      }
      if (resourceFilter !== 'all') {
        params.set('resource_type', resourceFilter);
      }

      const response = await fetch(`/api/admin/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch audit log');
      }

      const data = await response.json();
      setEntries(data.data.entries || []);
      setTotal(data.data.total || 0);
    } catch (err) {
      console.error('Error fetching audit log:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [token, page, actionFilter, resourceFilter]);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [actionFilter, resourceFilter]);

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatResourceType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading && entries.length === 0) {
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

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          Track all admin actions and changes in the system.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="admin_user">Admin Users</SelectItem>
                <SelectItem value="admin_users">Admin Users List</SelectItem>
                <SelectItem value="admin_roles">Roles</SelectItem>
                <SelectItem value="session">Sessions</SelectItem>
                <SelectItem value="agent">Agents</SelectItem>
                <SelectItem value="commission">Commissions</SelectItem>
                <SelectItem value="payout">Payouts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {total} total entries
            {(actionFilter !== 'all' || resourceFilter !== 'all') && ' (filtered)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No audit entries found</p>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const ActionIcon = actionIcons[entry.action] || Eye;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(entry.created_at)}
                      </TableCell>
                      <TableCell>
                        {entry.user ? (
                          <div>
                            <p className="font-medium">
                              {entry.user.first_name} {entry.user.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.user.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${actionColors[entry.action] || ''} flex items-center gap-1 w-fit`}
                        >
                          <ActionIcon className="h-3 w-3" />
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {formatResourceType(entry.resource_type)}
                          </p>
                          {entry.resource_id && (
                            <p className="text-xs text-muted-foreground">
                              ID: {entry.resource_id.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {entry.new_values ? (
                          <div className="text-xs text-muted-foreground truncate">
                            {Object.entries(entry.new_values)
                              .slice(0, 2)
                              .map(([key, value]) => `${key}: ${String(value)}`)
                              .join(', ')}
                            {Object.keys(entry.new_values).length > 2 && '...'}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.ip_address || (
                          <span className="text-muted-foreground">-</span>
                        )}
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
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
