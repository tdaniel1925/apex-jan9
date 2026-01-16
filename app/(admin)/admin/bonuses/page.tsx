'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { RANK_CONFIG } from '@/lib/config/ranks';
import { getCurrentPhase } from '@/lib/config/bonuses';
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
import { Button } from '@/components/ui/button';
import { Award, CheckCircle, Clock, Filter, AlertCircle, Download, RefreshCw, Info, ThumbsUp, ThumbsDown, CheckSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type BonusWithAgent = {
  id: string;
  agent_id: string;
  bonus_type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  agents: { first_name: string; last_name: string; rank: string } | null;
};

const BONUS_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'fast_start', label: 'Fast Start' },
  { value: 'training', label: 'Training' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'contest', label: 'Contest' },
  { value: 'referral', label: 'Referral' },
  { value: 'override', label: 'Override' },
];

export default function AdminBonusesPage() {
  const [allBonuses, setAllBonuses] = useState<BonusWithAgent[]>([]);
  const [stats, setStats] = useState({
    pendingTotal: 0,
    approvedTotal: 0,
    activeAgents: 0,
    phase: 1,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [approvingAll, setApprovingAll] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all bonuses from API
      const response = await fetch('/api/admin/bonuses?limit=100');
      if (!response.ok) {
        throw new Error(`Failed to fetch bonuses: ${response.statusText}`);
      }
      const data = await response.json();
      setAllBonuses(data.bonuses || []);

      // Get active agents count from agents API
      const agentsResponse = await fetch('/api/admin/agents?status=active&limit=1');
      if (!agentsResponse.ok) {
        throw new Error(`Failed to fetch agents: ${agentsResponse.statusText}`);
      }
      const agentsData = await agentsResponse.json();
      const activeAgents = agentsData.stats?.active || 0;

      const phase = getCurrentPhase(activeAgents);

      // Use API stats
      setStats({
        pendingTotal: data.stats?.pendingAmount || 0,
        approvedTotal: data.stats?.totalAmount || 0,
        activeAgents,
        phase,
      });
    } catch (err) {
      console.error('Error fetching bonuses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bonuses');
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
    toast.success('Bonus data refreshed');
  };

  const handleApprove = async (bonusId: string) => {
    setApproving(bonusId);
    try {
      const response = await fetch(`/api/admin/bonuses/${bonusId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve bonus');
      }

      toast.success('Bonus approved');
      await fetchData();
    } catch (err) {
      console.error('Error approving bonus:', err);
      toast.error('Failed to approve bonus');
    } finally {
      setApproving(null);
    }
  };

  const handleDeny = async (bonusId: string) => {
    if (!confirm('Are you sure you want to deny this bonus?')) return;

    setApproving(bonusId);
    try {
      const response = await fetch(`/api/admin/bonuses/${bonusId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'denied' }),
      });

      if (!response.ok) {
        throw new Error('Failed to deny bonus');
      }

      toast.success('Bonus denied');
      await fetchData();
    } catch (err) {
      console.error('Error denying bonus:', err);
      toast.error('Failed to deny bonus');
    } finally {
      setApproving(null);
    }
  };

  const handleApproveAll = async () => {
    const pendingBonuses = allBonuses.filter(b => b.status === 'pending');
    if (pendingBonuses.length === 0) {
      toast.info('No pending bonuses to approve');
      return;
    }

    if (!confirm(`Approve all ${pendingBonuses.length} pending bonuses?`)) return;

    setApprovingAll(true);
    try {
      const response = await fetch('/api/admin/bonuses/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonusIds: pendingBonuses.map(b => b.id) }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve bonuses');
      }

      const result = await response.json();
      toast.success(`${result.approved || pendingBonuses.length} bonuses approved`);
      await fetchData();
    } catch (err) {
      console.error('Error approving all bonuses:', err);
      toast.error('Failed to approve bonuses');
    } finally {
      setApprovingAll(false);
    }
  };

  const handleExport = () => {
    const headers = ['Agent', 'Rank', 'Type', 'Amount', 'Description', 'Status', 'Date'];
    const rows = allBonuses.map(b => [
      `${b.agents?.first_name || ''} ${b.agents?.last_name || ''}`,
      b.agents?.rank || '',
      b.bonus_type.replace('_', ' '),
      b.amount.toFixed(2),
      b.description,
      b.status,
      new Date(b.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bonuses-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Bonus report exported');
  };

  // Filter bonuses by type and status
  const filteredBonuses = allBonuses.filter(bonus => {
    const typeMatch = filterType === 'all' || bonus.bonus_type === filterType;
    const statusMatch = filterStatus === 'all' || bonus.status === filterStatus;
    return typeMatch && statusMatch;
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

      {/* SmartOffice Integration Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Incentive bonuses are calculated in Apex and submitted to SmartOffice for payment processing.
          Base commissions and overrides are synced from SmartOffice for performance tracking.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bonus Management</h1>
          <p className="text-muted-foreground">
            View, approve, and manage agent bonuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            Phase {stats.phase}
          </Badge>
          <Button
            variant="default"
            onClick={handleApproveAll}
            disabled={approvingAll || allBonuses.filter(b => b.status === 'pending').length === 0}
          >
            {approvingAll ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckSquare className="mr-2 h-4 w-4" />
            )}
            Approve All Pending
          </Button>
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
            <CardTitle className="text-sm font-medium">Pending Bonuses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pendingTotal)}</div>
            <p className="text-xs text-muted-foreground">awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.approvedTotal)}</div>
            <p className="text-xs text-muted-foreground">in bonuses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAgents}</div>
            <p className="text-xs text-muted-foreground">eligible for bonuses</p>
          </CardContent>
        </Card>
      </div>

      {/* All Bonuses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Bonuses</CardTitle>
              <CardDescription>
                Bonus records synced from SmartOffice
              </CardDescription>
            </div>
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {(filterType !== 'all' || filterStatus !== 'all') && (
                    <Badge variant="secondary" className="ml-2">
                      {(filterType !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bonus Type</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BONUS_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="denied">Denied</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(filterType !== 'all' || filterStatus !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setFilterType('all');
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
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBonuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">
                      {filterType !== 'all' || filterStatus !== 'all'
                        ? 'No bonuses match this filter'
                        : 'No bonuses yet'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBonuses.map((bonus) => (
                  <TableRow key={bonus.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {bonus.agents?.first_name} {bonus.agents?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {bonus.agents?.rank && RANK_CONFIG[bonus.agents.rank as keyof typeof RANK_CONFIG]?.shortName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {bonus.bonus_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(bonus.amount)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {bonus.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          bonus.status === 'paid'
                            ? 'default'
                            : bonus.status === 'approved'
                            ? 'secondary'
                            : bonus.status === 'pending'
                            ? 'outline'
                            : 'destructive'
                        }
                      >
                        {bonus.status === 'paid' && <CheckCircle className="mr-1 h-3 w-3" />}
                        {bonus.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                        {bonus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(bonus.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {bonus.status === 'pending' ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={approving === bonus.id}
                            >
                              {approving === bonus.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                'Actions'
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleApprove(bonus.id)}>
                              <ThumbsUp className="mr-2 h-4 w-4 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeny(bonus.id)}>
                              <ThumbsDown className="mr-2 h-4 w-4 text-red-600" />
                              Deny
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
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
