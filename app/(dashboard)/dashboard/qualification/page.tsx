'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { RANK_CONFIG, Rank } from '@/lib/config/ranks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/db/supabase-client';
import {
  Award,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  ArrowRight,
  Lightbulb,
  Users,
  DollarSign,
  Activity,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Recommendation = {
  type: string;
  priority: string;
  message: string;
  action: string;
  impact: string;
};

type Requirement = {
  name: string;
  label: string;
  required: number;
  actual: number;
  met: boolean;
  percentage: number;
};

type QualificationData = {
  agent: {
    id: string;
    name: string;
    agentCode: string;
    status: string;
  };
  rankProgress: {
    currentRank: string;
    paidAsRank: string;
    qualificationStatus: string;
    usedGracePeriod: boolean;
    gracePeriodDetails?: {
      periodsUsed: number;
      periodsRemaining: number;
    };
  };
  requirementsBreakdown: {
    current: {
      rank: string;
      met: boolean;
      percentageMet: number;
      requirements: Requirement[];
    };
    next: {
      rank: string;
      met: boolean;
      percentageMet: number;
      requirements: Requirement[];
    } | null;
  };
  gracePeriods: {
    total: number;
    used: number;
    remaining: number;
  };
  metrics: {
    premium90Days: number;
    pbv90Days: number;
    obv90Days: number;
    activeAgents: number;
    personalRecruits: number;
    mgasInDownline: number;
    persistencyRate: number;
    placementRate: number;
  };
  trend: {
    direction: string;
    consecutiveQualified: number;
    consecutiveDemoted: number;
    averagePercentageMet: number;
  };
  demotionRisk: {
    atRisk: boolean;
    riskLevel: string;
    reasons: string[];
    recommendations: string[];
  };
  recommendations: Recommendation[];
  history: {
    period: string;
    titleRank: string;
    paidAsRank: string;
    status: string;
    usedGracePeriod: boolean;
  }[];
};

export default function QualificationPage() {
  const t = useTranslations('qualification');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [data, setData] = useState<QualificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // First get the agent ID
  useEffect(() => {
    if (!user) return;

    const fetchAgentId = async () => {
      const supabase = createClient();
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single() as { data: { id: string } | null };

      if (agent) {
        setAgentId(agent.id);
      }
    };

    fetchAgentId();
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/agents/${agentId}/qualification`);

      if (!response.ok) {
        throw new Error('Failed to fetch qualification data');
      }

      const qualData = await response.json();
      setData(qualData);
    } catch (err) {
      console.error('Error fetching qualification:', err);
      setError(err instanceof Error ? err.message : 'Failed to load qualification data');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (agentId) {
      fetchData();
    }
  }, [agentId, fetchData]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'qualified':
        return 'bg-green-600';
      case 'grace_period':
        return 'bg-yellow-600';
      case 'demoted':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge variant="destructive">{t('highRisk')}</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-600">{t('mediumRisk')}</Badge>;
      case 'low':
        return <Badge variant="secondary">{t('lowRisk')}</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* Demotion Risk Alert */}
      {data.demotionRisk.atRisk && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('demotionRiskDetected')}</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {data.demotionRisk.reasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Rank Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              {t('currentRank')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {RANK_CONFIG[data.rankProgress.currentRank as Rank]?.name || data.rankProgress.currentRank}
            </div>
            <p className="text-xs text-muted-foreground">{t('titleRank')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t('paidAsRank')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {RANK_CONFIG[data.rankProgress.paidAsRank as Rank]?.name || data.rankProgress.paidAsRank}
            </div>
            <Badge className={getStatusColor(data.rankProgress.qualificationStatus)}>
              {data.rankProgress.qualificationStatus === 'grace_period' ? t('gracePeriod') : data.rankProgress.qualificationStatus}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('gracePeriods')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.gracePeriods.remaining} / {data.gracePeriods.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('usedThisYear', { used: data.gracePeriods.used })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Rank Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t('currentRankRequirements')}
          </CardTitle>
          <CardDescription>
            {t('progressTowardMaintaining', { rank: RANK_CONFIG[data.requirementsBreakdown.current.rank as Rank]?.name })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{t('overallProgress')}</span>
            <span className="text-lg font-bold">
              {Math.round(data.requirementsBreakdown.current.percentageMet * 100)}%
            </span>
          </div>
          <Progress value={data.requirementsBreakdown.current.percentageMet * 100} className="h-3" />

          <div className="grid gap-4 md:grid-cols-2">
            {data.requirementsBreakdown.current.requirements.map((req) => (
              <div key={req.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {req.met ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                  <div>
                    <p className="font-medium">{req.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {req.name.includes('Rate') ? `${req.actual}%` : formatCurrency(req.actual)} {t('ofRequired', { required: req.name.includes('Rate') ? `${req.required}%` : formatCurrency(req.required) })}
                    </p>
                  </div>
                </div>
                <div className="w-20">
                  <Progress value={req.percentage} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Rank Requirements */}
      {data.requirementsBreakdown.next && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              {t('nextRankTitle', { rank: RANK_CONFIG[data.requirementsBreakdown.next.rank as Rank]?.name })}
            </CardTitle>
            <CardDescription>
              {t('whatYouNeedToAdvance')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{t('progressToNextRank')}</span>
              <span className="text-lg font-bold">
                {Math.round(data.requirementsBreakdown.next.percentageMet * 100)}%
              </span>
            </div>
            <Progress value={data.requirementsBreakdown.next.percentageMet * 100} className="h-3" />

            <div className="grid gap-4 md:grid-cols-2">
              {data.requirementsBreakdown.next.requirements.map((req) => (
                <div key={req.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {req.met ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Target className="h-5 w-5 text-blue-600" />
                    )}
                    <div>
                      <p className="font-medium">{req.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {req.name.includes('Rate') ? `${req.actual}%` : formatCurrency(req.actual)} {t('ofRequired', { required: req.name.includes('Rate') ? `${req.required}%` : formatCurrency(req.required) })}
                      </p>
                    </div>
                  </div>
                  <div className="w-20">
                    <Progress value={req.percentage} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend & Recommendations */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Qualification Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getTrendIcon(data.trend.direction)}
              {t('qualificationTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>{t('trendDirection')}</span>
              <Badge variant={data.trend.direction === 'improving' ? 'default' : data.trend.direction === 'declining' ? 'destructive' : 'secondary'}>
                {t(data.trend.direction)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('consecutiveQualifiedMonths')}</span>
              <span className="font-bold text-green-600">{data.trend.consecutiveQualified}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('averageRequirementsMet')}</span>
              <span className="font-bold">{Math.round(data.trend.averagePercentageMet * 100)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('demotionRisk')}</span>
              {getRiskBadge(data.demotionRisk.riskLevel)}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              {t('recommendations')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recommendations.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>{t('youreOnTrack')}</span>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recommendations.slice(0, 4).map((rec, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start gap-2">
                      <Badge
                        variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                        className="mt-0.5"
                      >
                        {rec.priority}
                      </Badge>
                      <div>
                        <p className="font-medium">{rec.message}</p>
                        <p className="text-sm text-muted-foreground">{rec.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Qualification History */}
      {data.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('recentQualificationHistory')}</CardTitle>
            <CardDescription>{t('qualificationStatusOverMonths')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.history.map((h, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 p-3 rounded-lg border ${
                    h.status === 'qualified'
                      ? 'border-green-200 bg-green-50'
                      : h.status === 'grace_period'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <p className="font-medium text-sm">{h.period}</p>
                  <p className="text-xs text-muted-foreground">
                    {RANK_CONFIG[h.paidAsRank as Rank]?.name || h.paidAsRank}
                  </p>
                  {h.usedGracePeriod && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {t('grace')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>{t('keyPerformanceMetrics')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">{t('ninetyDayPremium')}</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(data.metrics.premium90Days)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">{t('activeAgents')}</span>
              </div>
              <p className="text-xl font-bold">{data.metrics.activeAgents}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Activity className="h-4 w-4" />
                <span className="text-sm">{t('persistencyRate')}</span>
              </div>
              <p className="text-xl font-bold">{data.metrics.persistencyRate}%</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span className="text-sm">{t('placementRate')}</span>
              </div>
              <p className="text-xl font-bold">{data.metrics.placementRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
