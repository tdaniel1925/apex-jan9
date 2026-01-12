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
import { Button } from '@/components/ui/button';
import { Award, CheckCircle, Clock, XCircle, Filter, AlertCircle } from 'lucide-react';
import { BonusActions } from '@/components/admin/bonus-actions';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export default function AdminBonusesPage() {
  const [pendingBonuses, setPendingBonuses] = useState<BonusWithAgent[]>([]);
  const [monthlyBonuses, setMonthlyBonuses] = useState<BonusWithAgent[]>([]);
  const [stats, setStats] = useState({
    pendingTotal: 0,
    approvedTotal: 0,
    activeAgents: 0,
    phase: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get pending bonuses from API
      const pendingResponse = await fetch('/api/admin/bonuses?status=pending');
      if (!pendingResponse.ok) {
        throw new Error(`Failed to fetch pending bonuses: ${pendingResponse.statusText}`);
      }
      const pendingData = await pendingResponse.json();
      setPendingBonuses(pendingData.bonuses || []);

      // Get all bonuses from API for monthly view
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const monthlyResponse = await fetch(`/api/admin/bonuses?from_date=${startOfMonth.toISOString()}`);
      if (!monthlyResponse.ok) {
        throw new Error(`Failed to fetch monthly bonuses: ${monthlyResponse.statusText}`);
      }
      const monthlyData = await monthlyResponse.json();
      setMonthlyBonuses(monthlyData.bonuses || []);

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
        pendingTotal: pendingData.stats?.pendingAmount || 0,
        approvedTotal: monthlyData.stats?.totalAmount || 0,
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
          <h1 className="text-2xl font-bold tracking-tight">Review Bonuses</h1>
          <p className="text-muted-foreground">
            Approve or deny pending bonus requests.
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Phase {stats.phase}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBonuses.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.pendingTotal)} total
            </p>
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

      {/* Pending Bonuses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Bonuses</CardTitle>
              <CardDescription>
                Bonuses awaiting admin approval
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button size="sm">Approve All</Button>
            </div>
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
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingBonuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No pending bonuses to review</p>
                  </TableCell>
                </TableRow>
              ) : (
                pendingBonuses.map((bonus) => (
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
                      {new Date(bonus.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <BonusActions
                        bonusId={bonus.id}
                        agentName={`${bonus.agents?.first_name} ${bonus.agents?.last_name}`}
                        amount={bonus.amount}
                        bonusType={bonus.bonus_type}
                        onSuccess={fetchData}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* All Monthly Bonuses */}
      <Card>
        <CardHeader>
          <CardTitle>All Bonuses This Month</CardTitle>
          <CardDescription>
            Complete history of bonus activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyBonuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">No bonuses this month</p>
                  </TableCell>
                </TableRow>
              ) : (
                monthlyBonuses.map((bonus) => (
                  <TableRow key={bonus.id}>
                    <TableCell>
                      {bonus.agents?.first_name} {bonus.agents?.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {bonus.bonus_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(bonus.amount)}
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
