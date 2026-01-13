'use client';

import { useEffect, useState } from 'react';
import { RANK_CONFIG, Rank } from '@/lib/config/ranks';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, TrendingUp, Award, UserPlus, BarChart3, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/db/supabase-client';

export default function TeamPage() {
  const { user } = useAuth();
  const [directRecruits, setDirectRecruits] = useState<any[]>([]);
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
        // Get direct recruits
        const { data } = await supabase
          .from('agents')
          .select('*')
          .eq('sponsor_id', agent.id)
          .order('created_at', { ascending: false });

        setDirectRecruits(data || []);
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

  // Calculate team stats
  const totalTeam = directRecruits.length;
  const activeTeam = directRecruits.filter((a) => a.status === 'active').length;
  const teamPremium = directRecruits.reduce((sum, a) => sum + Number(a.premium_90_days || 0), 0);
  const mgaCount = directRecruits.filter((a) =>
    RANK_CONFIG[a.rank as Rank]?.order >= RANK_CONFIG.mga.order
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground">
          View and manage your direct recruits.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Direct Recruits</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeam}</div>
            <p className="text-xs text-muted-foreground">
              {activeTeam} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Premium</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(teamPremium)}</div>
            <p className="text-xs text-muted-foreground">
              90-day total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MGAs</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mgaCount}</div>
            <p className="text-xs text-muted-foreground">
              In your frontline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalTeam > 0 ? formatCurrency(teamPremium / totalTeam) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per agent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Metrics Link */}
      <Link href="/dashboard/team/metrics">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Team Metrics</h3>
                <p className="text-sm text-muted-foreground">
                  View detailed production metrics, growth trends, and top performers
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      {/* Team List */}
      <Card>
        <CardHeader>
          <CardTitle>Direct Recruits</CardTitle>
          <CardDescription>
            Agents you have personally recruited
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>90-Day Premium</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directRecruits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">No direct recruits yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Share your referral link to start building your team.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                directRecruits.map((recruit) => (
                  <TableRow key={recruit.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={recruit.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {recruit.first_name?.[0]}{recruit.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {recruit.first_name} {recruit.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {recruit.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {RANK_CONFIG[recruit.rank as Rank]?.shortName || recruit.rank}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={recruit.status === 'active' ? 'default' : 'secondary'}
                      >
                        {recruit.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(recruit.premium_90_days || 0)}
                    </TableCell>
                    <TableCell>
                      {new Date(recruit.created_at).toLocaleDateString()}
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
