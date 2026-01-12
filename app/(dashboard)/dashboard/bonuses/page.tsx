'use client';

import { useEffect, useState } from 'react';
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
        <h1 className="text-2xl font-bold tracking-tight">Bonuses</h1>
        <p className="text-muted-foreground">
          Track your bonus earnings and achievements.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pending)}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</div>
            <p className="text-xs text-muted-foreground">Received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Bonus Types Info */}
      <Card>
        <CardHeader>
          <CardTitle>Available Bonuses</CardTitle>
          <CardDescription>Ways to earn bonuses at Apex</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Fast Start</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Earn up to $5,000 in your first 90 days based on premium written.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Rank Advancement</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Bonus for each rank promotion you achieve.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Team Builder</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Earn bonuses when your recruits hit production milestones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonus History */}
      <Card>
        <CardHeader>
          <CardTitle>Bonus History</CardTitle>
          <CardDescription>Your earned bonuses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bonuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No bonuses earned yet</p>
                    <p className="text-sm text-muted-foreground">
                      Keep working towards your goals!
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
