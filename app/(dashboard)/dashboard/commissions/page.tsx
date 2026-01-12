'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { CARRIER_CONFIG } from '@/lib/config/carriers';
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
import { DollarSign, TrendingUp, Calendar, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient, Tables } from '@/lib/db/supabase-client';

export default function CommissionsPage() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Tables<'commissions'>[]>([]);
  const [stats, setStats] = useState({
    thisMonth: 0,
    lastMonth: 0,
    total90Day: 0,
    lifetime: 0,
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
        // Get commissions
        const { data } = await supabase
          .from('commissions')
          .select('*')
          .eq('agent_id', agent.id)
          .order('created_at', { ascending: false })
          .limit(50);

        const commArr = (data || []) as Tables<'commissions'>[];
        setCommissions(commArr);

        // Calculate stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        const thisMonth = commArr
          .filter((c) => new Date(c.created_at) >= startOfMonth)
          .reduce((sum: number, c) => sum + Number(c.commission_amount), 0);

        const lastMonth = commArr
          .filter((c) => {
            const date = new Date(c.created_at);
            return date >= startOfLastMonth && date <= endOfLastMonth;
          })
          .reduce((sum: number, c) => sum + Number(c.commission_amount), 0);

        const total90Day = commArr
          .filter((c) => new Date(c.created_at) >= ninetyDaysAgo)
          .reduce((sum: number, c) => sum + Number(c.commission_amount), 0);

        const lifetime = commArr.reduce((sum: number, c) => sum + Number(c.commission_amount), 0);

        setStats({ thisMonth, lastMonth, total90Day, lifetime });
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commissions</h1>
        <p className="text-muted-foreground">
          View your commission history and earnings.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.thisMonth)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.lastMonth)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">90-Day Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total90Day)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.lifetime)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Commission History */}
      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
          <CardDescription>Your recent commission records</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Carrier</TableHead>
                <TableHead>Policy #</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No commissions yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {CARRIER_CONFIG[commission.carrier]?.shortName || commission.carrier}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {commission.policy_number}
                    </TableCell>
                    <TableCell>{formatCurrency(commission.premium_amount)}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(commission.commission_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={commission.status === 'paid' ? 'default' : 'secondary'}
                      >
                        {commission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(commission.created_at).toLocaleDateString()}
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
