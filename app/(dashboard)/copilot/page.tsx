/**
 * Copilot Dashboard Page
 * Shows usage statistics, subscription status, and quick actions
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  MessageSquare,
  TrendingUp,
  Clock,
  Settings,
  Code,
  AlertTriangle,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

interface UsageData {
  today: number;
  limit: number | 'unlimited';
  remaining: number | 'unlimited';
}

interface SubscriptionInfo {
  id: string;
  status: string;
  tier: string;
  tierName: string;
  priceCents: number;
  isTrialing: boolean;
  trialExpired: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

interface DashboardData {
  hasSubscription: boolean;
  canStartTrial?: boolean;
  subscription?: SubscriptionInfo;
  usage?: UsageData;
  features?: string[];
}

export default function CopilotDashboardPage() {
  const { agent } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/copilot/subscription');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      } else {
        throw new Error('Failed to load dashboard');
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = () => {
    if (!data?.usage) return 0;
    if (data.usage.limit === 'unlimited') return 0;
    return Math.min(100, (data.usage.today / data.usage.limit) * 100);
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-primary';
  };

  const getDaysRemaining = () => {
    if (!data?.subscription?.trialEndsAt) return null;
    const endDate = new Date(data.subscription.trialEndsAt);
    const now = new Date();
    const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No subscription - show CTA
  if (!data?.hasSubscription) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Copilot</h1>
          <p className="text-muted-foreground">Automate your lead engagement with AI</p>
        </div>

        <Card className="border-primary bg-primary/5">
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Get Started with AI Copilot</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add an AI-powered chat widget to your website. Engage leads 24/7 and convert more
              visitors into clients.
            </p>
            <Button size="lg" asChild>
              <Link href="/copilot/subscribe">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subscription = data.subscription!;
  const usage = data.usage!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Copilot</h1>
          <p className="text-muted-foreground">Your AI assistant is active and ready</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/copilot/widget">
              <Code className="mr-2 h-4 w-4" />
              Get Widget Code
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/copilot/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Trial Warning */}
      {subscription.isTrialing && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Trial Period - {getDaysRemaining()} days remaining
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Upgrade now to keep your AI copilot running without interruption
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link href="/copilot/subscribe">Upgrade Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Usage Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-bold ${getUsageColor()}`}>{usage.today}</span>
              <span className="text-muted-foreground mb-1">
                / {usage.limit === 'unlimited' ? '∞' : usage.limit} messages
              </span>
            </div>
            {usage.limit !== 'unlimited' && (
              <Progress value={getUsagePercentage()} className="mt-3" />
            )}
            {usage.limit !== 'unlimited' && (
              <p className="text-xs text-muted-foreground mt-2">
                {usage.remaining} messages remaining today
              </p>
            )}
          </CardContent>
        </Card>

        {/* Plan Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{subscription.tierName}</span>
              {subscription.isTrialing && (
                <Badge variant="secondary" className="ml-2">
                  Trial
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ${(subscription.priceCents / 100).toFixed(0)}/month
            </p>
            {!subscription.isTrialing && subscription.currentPeriodEnd && (
              <p className="text-xs text-muted-foreground mt-2">
                Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Widget Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xl font-semibold">Active</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Your widget is live and responding to visitors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Conversations
            </CardTitle>
            <CardDescription>View conversations from your widget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Conversations will appear here</p>
              <p className="text-sm">Once visitors start chatting with your widget</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance
            </CardTitle>
            <CardDescription>How your AI is performing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total conversations</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Leads captured</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg. response time</span>
                <span className="font-medium">&lt;1s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      {data.features && data.features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Plan Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {data.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {feature}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade CTA */}
      {subscription.tier !== 'agency' && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Need more messages?</h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade your plan for higher limits and advanced features
                </p>
              </div>
              <Button asChild>
                <Link href="/copilot/subscribe">View Plans</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
