'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Trophy,
  Medal,
  Award,
  DollarSign,
  Users,
  TrendingUp,
  Loader2,
  Crown,
  Star,
} from 'lucide-react';
import { RANK_CONFIG, Rank, RANKS } from '@/lib/config/ranks';
import { formatCurrency } from '@/lib/engines/wallet-engine';

// Helper to safely get rank config - returns undefined if rank is invalid
function safeGetRankConfig(rank: unknown): { name: string; shortName: string } | undefined {
  if (!rank || typeof rank !== 'string') return undefined;
  if (!RANKS.includes(rank as Rank)) return undefined;
  return RANK_CONFIG[rank as Rank];
}

// Helper to get rank display name with fallback
function getRankDisplayName(rank: unknown, short: boolean = false): string {
  const config = safeGetRankConfig(rank);
  if (!config) return 'Agent';
  return short ? config.shortName : config.name;
}

interface Performer {
  rank: number;
  agent: {
    id: string;
    name: string;
    rank: Rank;
    avatarUrl: string | null;
  } | null;
  value: number;
}

interface LeaderboardData {
  metric: string;
  period: string;
  performers: Performer[];
  currentUser: {
    rank: number | null;
    value: number | null;
    totalParticipants: number;
  };
}

const METRICS = [
  { value: 'commissions', label: 'Commissions', icon: DollarSign },
  { value: 'premium', label: 'Premium', icon: TrendingUp },
  { value: 'recruits', label: 'Recruits', icon: Users },
];

const PERIODS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
];

function getRankIcon(position: number) {
  switch (position) {
    case 1:
      return <Crown className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Medal className="h-6 w-6 text-amber-600" />;
    default:
      return <span className="text-lg font-bold text-muted-foreground">{position}</span>;
  }
}

function getRankBackground(position: number) {
  switch (position) {
    case 1:
      return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800';
    case 2:
      return 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700';
    case 3:
      return 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800';
    default:
      return '';
  }
}

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard');
  const [metric, setMetric] = useState('commissions');
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [metric, period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/leaderboard?metric=${metric}&period=${period}&limit=25`
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number) => {
    if (metric === 'recruits') {
      return value.toString();
    }
    return formatCurrency(value);
  };

  const getMetricLabel = () => {
    return t(`metrics.${metric}`);
  };

  const getPeriodLabel = (periodValue: string) => {
    return t(`periods.${periodValue}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {getPeriodLabel(p.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Your Position Card */}
      {data?.currentUser.rank && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('yourPosition')}</p>
                  <p className="text-2xl font-bold">
                    #{data.currentUser.rank}{' '}
                    <span className="text-sm font-normal text-muted-foreground">
                      {t('ofTotal', { total: data.currentUser.totalParticipants })}
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{getMetricLabel()}</p>
                <p className="text-2xl font-bold">
                  {data.currentUser.value !== null
                    ? formatValue(data.currentUser.value)
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric Tabs */}
      <Tabs value={metric} onValueChange={setMetric}>
        <TabsList className="grid w-full grid-cols-3">
          {METRICS.map((m) => (
            <TabsTrigger key={m.value} value={m.value} className="gap-2">
              <m.icon className="h-4 w-4" />
              {t(`metrics.${m.value}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {METRICS.map((m) => (
          <TabsContent key={m.value} value={m.value} className="space-y-4">
            {/* Top 3 Podium - only render if all 3 performers have valid agents */}
            {!loading && data && data.performers.length >= 3 &&
             data.performers[0]?.agent && data.performers[1]?.agent && data.performers[2]?.agent && (
              <div className="grid grid-cols-3 gap-4 py-4">
                {/* 2nd Place */}
                <div className="flex flex-col items-center pt-8">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-4 border-gray-300">
                      <AvatarImage src={data.performers[1]?.agent?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-gray-200 text-lg">
                        {data.performers[1]?.agent?.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('') || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center font-bold">
                      2
                    </div>
                  </div>
                  <p className="mt-4 font-semibold text-center truncate max-w-full">
                    {data.performers[1]?.agent?.name}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {getRankDisplayName(data.performers[1]?.agent?.rank, true)}
                  </Badge>
                  <p className="mt-2 text-lg font-bold text-gray-600">
                    {formatValue(data.performers[1]?.value || 0)}
                  </p>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center">
                  <Crown className="h-8 w-8 text-yellow-500 mb-2" />
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-yellow-400">
                      <AvatarImage src={data.performers[0]?.agent?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-yellow-100 text-xl">
                        {data.performers[0]?.agent?.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('') || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center font-bold">
                      1
                    </div>
                  </div>
                  <p className="mt-4 font-semibold text-center truncate max-w-full">
                    {data.performers[0]?.agent?.name}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {getRankDisplayName(data.performers[0]?.agent?.rank, true)}
                  </Badge>
                  <p className="mt-2 text-xl font-bold text-yellow-600">
                    {formatValue(data.performers[0]?.value || 0)}
                  </p>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center pt-12">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-4 border-amber-600">
                      <AvatarImage src={data.performers[2]?.agent?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-amber-100">
                        {data.performers[2]?.agent?.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('') || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
                      3
                    </div>
                  </div>
                  <p className="mt-4 font-semibold text-center truncate max-w-full">
                    {data.performers[2]?.agent?.name}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {getRankDisplayName(data.performers[2]?.agent?.rank, true)}
                  </Badge>
                  <p className="mt-2 text-lg font-bold text-amber-600">
                    {formatValue(data.performers[2]?.value || 0)}
                  </p>
                </div>
              </div>
            )}

            {/* Full List */}
            <Card>
              <CardHeader>
                <CardTitle>{t('rankings')}</CardTitle>
                <CardDescription>
                  {t('topPerformersBy', { metric: t(`metrics.${m.value}`).toLowerCase(), period: getPeriodLabel(period) })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : data?.performers.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">
                      {t('noDataYet')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data?.performers.map((performer) => (
                      <div
                        key={performer.rank}
                        className={`flex items-center gap-4 p-3 rounded-lg border ${getRankBackground(
                          performer.rank
                        )}`}
                      >
                        <div className="w-10 flex justify-center">
                          {getRankIcon(performer.rank)}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={performer.agent?.avatarUrl || undefined}
                          />
                          <AvatarFallback>
                            {performer.agent?.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('') || '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {performer.agent?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getRankDisplayName(performer.agent?.rank)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatValue(performer.value)}</p>
                          <p className="text-xs text-muted-foreground">
                            {t(`metrics.${m.value}`)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
