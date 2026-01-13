'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Users,
  UserCheck,
  UserX,
  Award,
  Trash2,
} from 'lucide-react';
import { RANK_CONFIG, Rank, RANKS } from '@/lib/config/ranks';
import { toast } from 'sonner';

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  rank: Rank;
  status: string;
  avatar_url: string | null;
  created_at: string;
}

interface BulkResult {
  operation: string;
  success: number;
  failed: number;
  errors: string[];
  message: string;
}

export default function BulkOperationsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [rankFilter, setRankFilter] = useState<string>('');

  // Operation state
  const [operation, setOperation] = useState<string | null>(null);
  const [operationData, setOperationData] = useState<any>({});
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/admin/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  // Filter agents
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      !search ||
      `${agent.first_name} ${agent.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      agent.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || agent.status === statusFilter;
    const matchesRank = !rankFilter || agent.rank === rankFilter;

    return matchesSearch && matchesStatus && matchesRank;
  });

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAgents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAgents.map((a) => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Execute bulk operation
  const executeBulkOperation = async () => {
    if (!operation || selectedIds.size === 0) return;

    setProcessing(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          ids: Array.from(selectedIds),
          data: operationData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        toast.success(data.message);
        // Refresh data
        fetchAgents();
        // Clear selection if all succeeded
        if (data.failed === 0) {
          setSelectedIds(new Set());
        }
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Bulk operation failed:', error);
      toast.error('Operation failed');
    } finally {
      setProcessing(false);
      setOperation(null);
      setOperationData({});
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bulk Operations</h1>
        <p className="text-muted-foreground">
          Perform actions on multiple agents at once
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{agents.length}</p>
                <p className="text-sm text-muted-foreground">Total Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {agents.filter((a) => a.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {agents.filter((a) => a.status === 'pending').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                {selectedIds.size}
              </div>
              <div>
                <p className="text-2xl font-bold">{selectedIds.size}</p>
                <p className="text-sm text-muted-foreground">Selected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedIds.size} Agent{selectedIds.size > 1 ? 's' : ''} Selected
            </CardTitle>
            <CardDescription>Choose an action to perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOperation('agents_status_change');
                  setOperationData({ status: 'active' });
                }}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setOperation('agents_status_change');
                  setOperationData({ status: 'inactive' });
                }}
              >
                <UserX className="h-4 w-4 mr-2" />
                Deactivate
              </Button>
              <Button
                variant="outline"
                onClick={() => setOperation('agents_rank_change')}
              >
                <Award className="h-4 w-4 mr-2" />
                Change Rank
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-600"
                onClick={() => setOperation('agents_delete')}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={rankFilter} onValueChange={setRankFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Ranks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Ranks</SelectItem>
                {RANKS.map((rank) => (
                  <SelectItem key={rank} value={rank}>
                    {RANK_CONFIG[rank]?.name || rank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
          <CardDescription>
            {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      filteredAgents.length > 0 &&
                      selectedIds.size === filteredAgents.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">No agents found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgents.map((agent) => (
                  <TableRow
                    key={agent.id}
                    className={selectedIds.has(agent.id) ? 'bg-primary/5' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(agent.id)}
                        onCheckedChange={() => toggleSelect(agent.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {agent.first_name[0]}
                            {agent.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {agent.first_name} {agent.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {agent.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {RANK_CONFIG[agent.rank]?.shortName || agent.rank}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(agent.status)}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(agent.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Result display */}
      {result && (
        <Card className={result.failed > 0 ? 'border-yellow-200' : 'border-green-200'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {result.failed > 0 ? (
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              ) : (
                <CheckCircle className="h-6 w-6 text-green-600" />
              )}
              <div>
                <p className="font-medium">{result.message}</p>
                {result.errors.length > 0 && (
                  <p className="text-sm text-red-600">{result.errors.join(', ')}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rank Change Dialog */}
      <Dialog
        open={operation === 'agents_rank_change'}
        onOpenChange={(open) => !open && setOperation(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Rank</DialogTitle>
            <DialogDescription>
              Select a new rank for {selectedIds.size} selected agent{selectedIds.size > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>New Rank</Label>
            <Select
              value={operationData.rank || ''}
              onValueChange={(value) => setOperationData({ rank: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select rank" />
              </SelectTrigger>
              <SelectContent>
                {RANKS.map((rank) => (
                  <SelectItem key={rank} value={rank}>
                    {RANK_CONFIG[rank]?.name || rank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOperation(null)}>
              Cancel
            </Button>
            <Button
              onClick={executeBulkOperation}
              disabled={!operationData.rank || processing}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Apply to {selectedIds.size} Agent{selectedIds.size > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog for Activate/Deactivate */}
      <Dialog
        open={operation === 'agents_status_change'}
        onOpenChange={(open) => !open && setOperation(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {operationData.status === 'active' ? 'Activate' : 'Deactivate'} Agents
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to{' '}
              {operationData.status === 'active' ? 'activate' : 'deactivate'}{' '}
              {selectedIds.size} agent{selectedIds.size > 1 ? 's' : ''}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOperation(null)}>
              Cancel
            </Button>
            <Button onClick={executeBulkOperation} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {operationData.status === 'active' ? 'Activate' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog for Delete */}
      <Dialog
        open={operation === 'agents_delete'}
        onOpenChange={(open) => !open && setOperation(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Agents</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} agent
              {selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOperation(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={executeBulkOperation}
              disabled={processing}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete {selectedIds.size} Agent{selectedIds.size > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
