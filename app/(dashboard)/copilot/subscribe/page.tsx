/**
 * Copilot Subscribe Page
 * Allows agents to start trial or upgrade to paid tiers
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Sparkles, Zap, Building2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

interface TierConfig {
  tier: string;
  name: string;
  priceCents: number;
  bonusVolume: number;
  dailyMessageLimit: number | null;
  features: string[];
}

interface SubscriptionData {
  hasSubscription: boolean;
  canStartTrial?: boolean;
  trialDuration?: number;
  subscription?: {
    status: string;
    tier: string;
    tierName: string;
    isTrialing: boolean;
    trialExpired: boolean;
    trialEndsAt: string | null;
  };
}

const TIERS: TierConfig[] = [
  {
    tier: 'basic',
    name: 'Basic',
    priceCents: 2900,
    bonusVolume: 20,
    dailyMessageLimit: 50,
    features: [
      'AI-powered lead responses',
      '50 messages per day',
      'Basic email templates',
      'Widget customization',
      '20 BV commission credit',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    priceCents: 7900,
    bonusVolume: 60,
    dailyMessageLimit: 200,
    features: [
      'Everything in Basic',
      '200 messages per day',
      'Advanced AI personas',
      'Priority support',
      'Analytics dashboard',
      '60 BV commission credit',
    ],
  },
  {
    tier: 'agency',
    name: 'Agency',
    priceCents: 19900,
    bonusVolume: 150,
    dailyMessageLimit: null,
    features: [
      'Everything in Pro',
      'Unlimited messages',
      'Multi-site support',
      'Custom AI training',
      'White-label options',
      'API access',
      '150 BV commission credit',
    ],
  },
];

export default function CopilotSubscribePage() {
  const router = useRouter();
  const { agent } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [startingTrial, setStartingTrial] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/copilot/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setError('Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      setStartingTrial(true);
      setError(null);

      const response = await fetch('/api/copilot/trial', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start trial');
      }

      // Reload subscription data and redirect
      await loadSubscription();
      router.push('/copilot');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start trial');
    } finally {
      setStartingTrial(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    try {
      setCheckoutLoading(tier);
      setError(null);

      const response = await fetch('/api/copilot/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          successUrl: `${window.location.origin}/copilot?upgraded=true`,
          cancelUrl: `${window.location.origin}/copilot/subscribe`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setCheckoutLoading(null);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'basic':
        return <Sparkles className="h-6 w-6" />;
      case 'pro':
        return <Zap className="h-6 w-6" />;
      case 'agency':
        return <Building2 className="h-6 w-6" />;
      default:
        return <Sparkles className="h-6 w-6" />;
    }
  };

  const isCurrentTier = (tier: string) => {
    return subscription?.subscription?.tier === tier;
  };

  const canUpgradeTo = (tier: string) => {
    if (!subscription?.subscription) return true;
    const currentTierIndex = TIERS.findIndex((t) => t.tier === subscription.subscription?.tier);
    const targetTierIndex = TIERS.findIndex((t) => t.tier === tier);
    return targetTierIndex > currentTierIndex;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">AI Copilot for Your Business</h1>
        <p className="text-muted-foreground mt-2">
          Automate lead engagement with AI-powered conversations. Let your website work for you 24/7.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Trial CTA - Show if no subscription */}
      {subscription?.canStartTrial && !subscription?.hasSubscription && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-8 text-center">
            <Badge className="mb-4" variant="secondary">
              Limited Time Offer
            </Badge>
            <h2 className="text-2xl font-bold mb-2">Start Your 7-Day Free Trial</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Try the AI Copilot free for 7 days. No credit card required. 20 messages per day
              included.
            </p>
            <Button size="lg" onClick={handleStartTrial} disabled={startingTrial}>
              {startingTrial ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Trial...
                </>
              ) : (
                <>
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription Status */}
      {subscription?.hasSubscription && subscription.subscription && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-xl font-semibold">{subscription.subscription.tierName}</p>
                {subscription.subscription.isTrialing && (
                  <Badge variant="outline" className="mt-1">
                    Trial ends{' '}
                    {subscription.subscription.trialEndsAt
                      ? new Date(subscription.subscription.trialEndsAt).toLocaleDateString()
                      : 'soon'}
                  </Badge>
                )}
              </div>
              <Button variant="outline" onClick={() => router.push('/copilot')}>
                View Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Tiers */}
      <div className="grid gap-6 md:grid-cols-3">
        {TIERS.map((tier, index) => (
          <Card
            key={tier.tier}
            className={`relative ${index === 1 ? 'border-primary shadow-lg scale-105' : ''}`}
          >
            {index === 1 && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
            )}

            <CardHeader>
              <div className="flex items-center gap-2 text-primary">{getTierIcon(tier.tier)}</div>
              <CardTitle className="text-xl">{tier.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">
                  ${(tier.priceCents / 100).toFixed(0)}
                </span>
                <span className="text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              {isCurrentTier(tier.tier) ? (
                <Button className="w-full" variant="outline" disabled>
                  Current Plan
                </Button>
              ) : canUpgradeTo(tier.tier) ? (
                <Button
                  className="w-full"
                  variant={index === 1 ? 'default' : 'outline'}
                  onClick={() => handleUpgrade(tier.tier)}
                  disabled={checkoutLoading !== null}
                >
                  {checkoutLoading === tier.tier ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : subscription?.hasSubscription ? (
                    'Upgrade'
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              ) : (
                <Button className="w-full" variant="outline" disabled>
                  Current or Lower Tier
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">What happens after the trial?</h3>
            <p className="text-sm text-muted-foreground">
              After your 7-day trial, you can choose to subscribe to any plan. If you don&apos;t
              subscribe, your widget will stop responding to visitors.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Can I change plans later?</h3>
            <p className="text-sm text-muted-foreground">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your
              next billing cycle.
            </p>
          </div>
          <div>
            <h3 className="font-medium">What are Bonus Volume (BV) credits?</h3>
            <p className="text-sm text-muted-foreground">
              BV credits are used to calculate your commissions. Higher tier subscriptions earn more
              BV, which means higher potential commissions for you and your upline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
