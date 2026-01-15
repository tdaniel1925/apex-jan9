'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/engines/wallet-engine';
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
import { Award, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient, Tables } from '@/lib/db/supabase-client';

export default function BonusesPage() {
  const { user } = useAuth();
  const t = useTranslations('bonuses');
  const tCommon = useTranslations('common');
  const [bonuses, setBonuses] = useState<Tables<'bonuses'>[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    paid: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const supabase = createClient();

      // Get agent
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const agent = agentData as { id: string } | null;
      if (agent) {
        // Get bonuses
        const { data } = await supabase
          .from('bonuses')
          .select('*')
          .eq('agent_id', agent.id)
          .order('created_at', { ascending: false });

        const bonusArr = (data || []) as Tables<'bonuses'>[];
        setBonuses(bonusArr);

        // Calculate stats
        const pending = bonusArr
          .filter((b) => b.status === 'pending' || b.status === 'approved')
          .reduce((sum: number, b) => sum + Number(b.amount), 0);

        const paid = bonusArr
          .filter((b) => b.status === 'paid')
          .reduce((sum: number, b) => sum + Number(b.amount), 0);

        const total = bonusArr.reduce((sum: number, b) => sum + Number(b.amount), 0);

        setStats({ pending, paid, total });
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatBonusType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pending')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pending)}</div>
            <p className="text-xs text-muted-foreground">{t('awaitingPayment')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('paid')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</div>
            <p className="text-xs text-muted-foreground">{t('received')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalEarned')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground">{t('allTime')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bonus Types Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('availableBonuses')}</CardTitle>
          <CardDescription>{t('waysToEarn')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">{t('fastStart')}</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('fastStartDesc')}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">{t('rankAdvancement')}</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('rankAdvancementDesc')}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">{t('teamBuilder')}</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('teamBuilderDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonus History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('bonusHistory')}</CardTitle>
          <CardDescription>{t('yourEarnedBonuses')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('amount')}</TableHead>
                <TableHead>{tCommon('description')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
                <TableHead>{tCommon('date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bonuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">{t('noBonusesYet')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('keepWorking')}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                bonuses.map((bonus) => (
                  <TableRow key={bonus.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {formatBonusType(bonus.bonus_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(bonus.amount)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {bonus.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          bonus.status === 'paid'
                            ? 'default'
                            : bonus.status === 'approved'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {t(bonus.status as 'pending' | 'paid' | 'approved' | 'denied')}
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
