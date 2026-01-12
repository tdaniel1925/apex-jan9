'use client';

import { useEffect, useState } from 'react';
import { RANK_CONFIG, Rank } from '@/lib/config/ranks';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, UserPlus, X, AlertCircle } from 'lucide-react';
import { useTableSearch } from '@/lib/hooks/use-table-search';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/admin/agents');

        if (!response.ok) {
          throw new Error(`Failed to fetch agents: ${response.statusText}`);
        }

        const data = await response.json();
        setAgents(data.agents || []);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Search and filter
  const { filtered, search, setSearch, filters, setFilter, clearFilters, hasActiveFilters, activeFilterCount } =
    useTableSearch(agents, {
      searchKeys: ['first_name', 'last_name', 'email'],
      filterKeys: ['status', 'rank'],
      enableUrlParams: true,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Agents</h1>
          <p className="text-muted-foreground">
            View and manage all agents in the system.
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Agent
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
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
              <Select value={(filters.status as string) || ''} onValueChange={(value) => setFilter('status', value || null)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__clear__" onClick={() => setFilter('status', null)}>
                    All Statuses
                  </SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={(filters.rank as string) || ''} onValueChange={(value) => setFilter('rank', value || null)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__clear__" onClick={() => setFilter('rank', null)}>
                    All Ranks
                  </SelectItem>
                  <SelectItem value="pre_associate">Pre-Associate</SelectItem>
                  <SelectItem value="associate">Associate</SelectItem>
                  <SelectItem value="senior_associate">Senior Associate</SelectItem>
                  <SelectItem value="team_leader">Team Leader</SelectItem>
                  <SelectItem value="regional_director">Regional Director</SelectItem>
                  <SelectItem value="national_director">National Director</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
          <CardDescription>
            {filtered.length} of {agents.length} agents
            {hasActiveFilters && ' (filtered)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sponsor</TableHead>
                <TableHead>90-Day Premium</TableHead>
                <TableHead>Recruits</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {hasActiveFilters ? 'No agents match your filters' : 'No agents found'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {agent.first_name?.[0]}{agent.last_name?.[0]}
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
                        {RANK_CONFIG[agent.rank as Rank]?.shortName || agent.rank}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={agent.status === 'active' ? 'default' : 'secondary'}
                      >
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {agent.sponsor_id ? (
                        <span className="text-sm">ID: {agent.sponsor_id.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(agent.premium_90_days || 0)}
                    </TableCell>
                    <TableCell>
                      {agent.personal_recruits_count || 0}
                    </TableCell>
                    <TableCell>
                      {new Date(agent.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
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
