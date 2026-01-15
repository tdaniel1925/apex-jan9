'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatCurrency, WITHDRAWAL_FEES, MIN_WITHDRAWAL } from '@/lib/engines/wallet-engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WithdrawDialog } from '@/components/wallet/withdraw-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/db/supabase-client';

export default function WalletPage() {
  const { user } = useAuth();
  const t = useTranslations('wallet');
  const tCommon = useTranslations('common');
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
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
        // Get wallet
        const { data: walletData } = await supabase
          .from('wallets')
          .select('*')
          .eq('agent_id', agent.id)
          .single();
        setWallet(walletData);

        // Get recent transactions
        const { data: txData } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('agent_id', agent.id)
          .order('created_at', { ascending: false })
          .limit(20);
        setTransactions(txData || []);

        // Get pending payouts
        const { data: payoutsData } = await supabase
          .from('payouts')
          .select('*')
          .eq('agent_id', agent.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        setPendingPayouts(payoutsData || []);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('pageDescription')}
          </p>
        </div>
        <WithdrawDialog balance={wallet?.balance || 0} />
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('availableBalance')}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(wallet?.balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('readyToWithdraw')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pending')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(wallet?.pending_balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('processing')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('lifetimeEarnings')}</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(wallet?.lifetime_earnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('totalEarned')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('withdrawalMethods')}</CardTitle>
          <CardDescription>{t('choosePreferredMethod')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">{t('achTransfer')}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {t('fee')}: {formatCurrency(WITHDRAWAL_FEES.ach)}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('min')}: {formatCurrency(MIN_WITHDRAWAL.ach)}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('achDays')}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">{t('wireTransfer')}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {t('fee')}: {formatCurrency(WITHDRAWAL_FEES.wire)}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('min')}: {formatCurrency(MIN_WITHDRAWAL.wire)}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('wireDays')}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">{t('check')}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {t('fee')}: {formatCurrency(WITHDRAWAL_FEES.check)}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('min')}: {formatCurrency(MIN_WITHDRAWAL.check)}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('checkDays')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Payouts */}
      {pendingPayouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('pendingPayouts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead>{t('method')}</TableHead>
                  <TableHead>{t('net')}</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                  <TableHead>{tCommon('date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">
                      {formatCurrency(payout.amount)}
                    </TableCell>
                    <TableCell className="uppercase">{payout.method}</TableCell>
                    <TableCell>{formatCurrency(payout.net_amount)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{payout.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(payout.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('transactionHistory')}</CardTitle>
          <CardDescription>{t('recentActivity')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('description')}</TableHead>
                <TableHead>{t('amount')}</TableHead>
                <TableHead>{t('balance')}</TableHead>
                <TableHead>{tCommon('date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">{t('noTransactionsYet')}</p>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tx.type === 'credit' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant="outline">{tx.category}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell
                      className={
                        tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {tx.type === 'credit' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>{formatCurrency(tx.balance_after)}</TableCell>
                    <TableCell>
                      {new Date(tx.created_at).toLocaleDateString()}
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
