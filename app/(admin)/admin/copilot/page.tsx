/**
 * Admin Copilot Management Page
 * Manage AI Copilot subscriptions, trials, and usage
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Search,
  Sparkles,
  Users,
  Clock,
  DollarSign,
  MoreVertical,
  RefreshCw,
  XCircle,
  CheckCircle,
  ArrowUpCircle,
  Calendar,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Subscription {
  id: string;
  agent_id: string;
  stripe_subscription_id: string | null;
  tier: string;
  status: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  daily_message_limit: number | null;
  daily_messages_used: number;
  created_at: string;
  agents: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    rank: string;
  };
}

interface Stats {
  total: number;
  active: number;
  trialing: number;
  cancelled: number;
  byTier: {
    basic: number;
    pro: number;
    agency: number;
  };
}

const TIER_CONFIG: Record<string, { name: string; color: string; price: number }> = {
  basic: { name: 'Basic', color: 'bg-blue-500', price: 29 },
  pro: { name: 'Pro', color: 'bg-purple-500', price: 79 },
  agency: { name: 'Agency', color: 'bg-amber-500', price: 199 },
};

export default function AdminCopilotPage() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog states
  const [extendTrialDialog, setExtendTrialDialog] = useState<Subscription | null>(null);
  const [changeTierDialog, setChangeTierDialog] = useState<Subscription | null>(null);
  const [extendDays, setExtendDays] = useState(7);
  const [newTier, setNewTier] = useState('');

  useEffect(() => {
    loadSubscriptions();
  }, [statusFilter, tierFilter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (tierFilter !== 'all') params.set('tier', tierFilter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/copilot/subscriptions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions);
        setStats(data.stats);
      } else {
        throw new Error('Failed to load subscriptions');
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (subscriptionId: string, action: string, data?: Record<string, unknown>) => {
    try {
      setActionLoading(subscriptionId);
      const response = await fetch('/api/admin/copilot/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, action, data }),
      });

      if (response.ok) {
        await loadSubscriptions();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Action failed');
      }
    } catch (err) {
      console.error('Action failed:', err);
      alert('Action failed. Please try again.');
    } finally {
      setActionLoading(null);
      setExtendTrialDialog(null);
      setChangeTierDialog(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'trialing':
        return <Badge variant="secondary">Trial</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'past_due':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Past Due</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    const config = TIER_CONFIG[tier];
    if (!config) return <Badge variant="outline">{tier}</Badge>;
    return (
      <Badge className={config.color}>
        {config.name}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (dateString: string | null) => {
    if (!dateString) return null;
    const endDate = new Date(dateString);
    const now = new Date();
    const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // Filter subscriptions by search
  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const name = `${sub.agents?.first_name || ''} ${sub.agents?.last_name || ''}`.toLowerCase();
    const email = (sub.agents?.email || '').toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });

  if (loading && !subscriptions.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Copilot Management</h1>
          <p className="text-muted-foreground">Manage subscriptions, trials, and usage</p>
        </div>
        <Button onClick={loadSubscriptions} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Total Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.active || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Trialing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.trialing || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Est. MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${(
                (stats?.byTier.basic || 0) * 29 +
                (stats?.byTier.pro || 0) * 79 +
                (stats?.byTier.agency || 0) * 199
              ).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm">Basic: {stats?.byTier.basic || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <span className="text-sm">Pro: {stats?.byTier.pro || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-sm">Agency: {stats?.byTier.agency || 0}</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Cancelled: {stats?.cancelled || 0}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="cancelled">Cancelled</option>
          <option value="past_due">Past Due</option>
        </select>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="all">All Tiers</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="agency">Agency</option>
        </select>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>{filteredSubscriptions.length} subscriptions found</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No subscriptions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-sm">
                        {sub.agents?.first_name?.[0]}{sub.agents?.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {sub.agents?.first_name} {sub.agents?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{sub.agents?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      {getTierBadge(sub.tier)}
                      {getStatusBadge(sub.status)}
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {sub.daily_messages_used} / {sub.daily_message_limit || '∞'}
                      </p>
                      <p className="text-xs text-muted-foreground">messages today</p>
                    </div>

                    {sub.status === 'trialing' && sub.trial_ends_at && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-600">
                          {getDaysRemaining(sub.trial_ends_at)} days
                        </p>
                        <p className="text-xs text-muted-foreground">trial remaining</p>
                      </div>
                    )}

                    <div className="text-right text-sm text-muted-foreground">
                      {formatDate(sub.created_at)}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={actionLoading === sub.id}>
                          {actionLoading === sub.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={() => handleAction(sub.id, 'reset_usage')}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset Usage
                        </DropdownMenuItem>

                        {sub.status === 'trialing' && (
                          <DropdownMenuItem onClick={() => {
                            setExtendTrialDialog(sub);
                            setExtendDays(7);
                          }}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Extend Trial
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem onClick={() => {
                          setChangeTierDialog(sub);
                          setNewTier(sub.tier);
                        }}>
                          <ArrowUpCircle className="h-4 w-4 mr-2" />
                          Change Tier
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {sub.status === 'cancelled' ? (
                          <DropdownMenuItem onClick={() => handleAction(sub.id, 'activate')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Reactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleAction(sub.id, 'cancel')}
                            className="text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Subscription
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extend Trial Dialog */}
      <Dialog open={!!extendTrialDialog} onOpenChange={() => setExtendTrialDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Trial</DialogTitle>
            <DialogDescription>
              Extend the trial period for {extendTrialDialog?.agents?.first_name} {extendTrialDialog?.agents?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="extendDays">Days to extend</Label>
            <Input
              id="extendDays"
              type="number"
              min={1}
              max={30}
              value={extendDays}
              onChange={(e) => setExtendDays(parseInt(e.target.value) || 7)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendTrialDialog(null)}>
              Cancel
            </Button>
            <Button onClick={() => extendTrialDialog && handleAction(extendTrialDialog.id, 'extend_trial', { days: extendDays })}>
              Extend Trial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Tier Dialog */}
      <Dialog open={!!changeTierDialog} onOpenChange={() => setChangeTierDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Tier</DialogTitle>
            <DialogDescription>
              Change the subscription tier for {changeTierDialog?.agents?.first_name} {changeTierDialog?.agents?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newTier">New Tier</Label>
            <select
              id="newTier"
              value={newTier}
              onChange={(e) => setNewTier(e.target.value)}
              className="mt-2 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="basic">Basic ($29/mo)</option>
              <option value="pro">Pro ($79/mo)</option>
              <option value="agency">Agency ($199/mo)</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeTierDialog(null)}>
              Cancel
            </Button>
            <Button onClick={() => changeTierDialog && handleAction(changeTierDialog.id, 'change_tier', { tier: newTier })}>
              Change Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
