/**
 * Commissions Dashboard Page
 * Shows agent earnings from copilot subscriptions and overrides
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  ArrowUpRight,
  Calendar,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

interface Commission {
  id: string;
  type: string;
  retail_amount: number;
  bonus_volume: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
}

interface CommissionData {
  commissions: Commission[];
  summary: {
    totalEarnings: number;
    personalSales: number;
    overrides: number;
    pendingAmount: number;
    subscriptionCount: number;
    periodTotal: number;
    periodPending: number;
    periodPaid: number;
  };
  agentRank: string;
}

const RANK_DISPLAY: Record<string, string> = {
  associate: 'Associate',
  senior_associate: 'Senior Associate',
  district_manager: 'District Manager',
  regional_manager: 'Regional Manager',
  national_manager: 'National Manager',
  executive_director: 'Executive Director',
};

const COMMISSION_RATES: Record<string, number> = {
  associate: 0.30,
  senior_associate: 0.35,
  district_manager: 0.40,
  regional_manager: 0.45,
  national_manager: 0.50,
  executive_director: 0.55,
};

export default function CommissionsDashboardPage() {
  const { agent } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CommissionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('month');
  const [typeFilter, setTypeFilter] = useState<'all' | 'personal' | 'override'>('all');

  useEffect(() => {
    loadCommissions();
  }, [period, typeFilter]);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('period', period);
      params.set('type', typeFilter);

      const response = await fetch(`/api/commissions?${params.toString()}`);
      if (response.ok) {
        const commissionData = await response.json();
        setData(commissionData);
      } else {
        throw new Error('Failed to load commissions');
      }
    } catch (err) {
      console.error('Failed to load commissions:', err);
      setError('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Paid</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ai_copilot':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Personal Sale</Badge>;
      case 'override':
        return <Badge variant="outline" className="border-purple-500 text-purple-600">Override</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const summary = data?.summary;
  const commissions = data?.commissions || [];
  const agentRank = data?.agentRank || 'associate';
  const commissionRate = COMMISSION_RATES[agentRank] || 0.30;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commissions</h1>
          <p className="text-muted-foreground">Track your earnings from AI Copilot subscriptions</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {RANK_DISPLAY[agentRank] || 'Associate'} ({(commissionRate * 100).toFixed(0)}% rate)
          </Badge>
        </div>
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
              <DollarSign className="h-4 w-4" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(summary?.totalEarnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Personal Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(summary?.personalSales || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.subscriptionCount || 0} subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Override Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatCurrency(summary?.overrides || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From team sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {formatCurrency(summary?.pendingAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payout</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Rate Info */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowUpRight className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Your Commission Rate: {(commissionRate * 100).toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">
                  Advance to {getNextRank(agentRank)} for {getNextRate(agentRank)}% rate
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/team">View Rank Requirements</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'all' | 'month' | 'week')}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'personal' | 'override')}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Types</option>
            <option value="personal">Personal Sales</option>
            <option value="override">Overrides</option>
          </select>
        </div>

        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Commission History */}
      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
          <CardDescription>
            {period === 'week'
              ? 'Last 7 days'
              : period === 'month'
                ? 'Last 30 days'
                : 'All time'}{' '}
            • {formatCurrency(summary?.periodTotal || 0)} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No commissions yet</p>
              <p className="text-sm">Commissions will appear here when you or your team make copilot sales</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commissions.map((commission) => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {commission.type === 'override' ? (
                        <Users className="h-5 w-5 text-purple-600" />
                      ) : (
                        <DollarSign className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getTypeBadge(commission.type)}
                        {getStatusBadge(commission.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {commission.notes || `${commission.bonus_volume} BV × ${(commission.commission_rate * 100).toFixed(0)}%`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(commission.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {formatCurrency(commission.commission_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {commission.bonus_volume} BV
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Structure Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Structure</CardTitle>
          <CardDescription>AI Copilot commission rates by rank</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(COMMISSION_RATES).map(([rank, rate]) => (
              <div
                key={rank}
                className={`p-3 rounded-lg border ${
                  rank === agentRank ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{RANK_DISPLAY[rank]}</span>
                  <Badge variant={rank === agentRank ? 'default' : 'outline'}>
                    {(rate * 100).toFixed(0)}%
                  </Badge>
                </div>
                {rank === agentRank && (
                  <p className="text-xs text-primary mt-1">Your current rank</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getNextRank(currentRank: string): string {
  const ranks = Object.keys(COMMISSION_RATES);
  const currentIndex = ranks.indexOf(currentRank);
  if (currentIndex < ranks.length - 1) {
    return RANK_DISPLAY[ranks[currentIndex + 1]] || 'Next Rank';
  }
  return 'Maximum Rank';
}

function getNextRate(currentRank: string): number {
  const ranks = Object.keys(COMMISSION_RATES);
  const currentIndex = ranks.indexOf(currentRank);
  if (currentIndex < ranks.length - 1) {
    return (COMMISSION_RATES[ranks[currentIndex + 1]] || 0) * 100;
  }
  return (COMMISSION_RATES[currentRank] || 0) * 100;
}
