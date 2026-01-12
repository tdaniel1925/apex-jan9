'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GenealogyTree } from '@/components/genealogy/genealogy-tree';
import { Users, TrendingUp, Award, Network } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/db/supabase-client';

export default function GenealogyPage() {
  const { user } = useAuth();
  const [downlineStats, setDownlineStats] = useState({
    total: 0,
    active: 0,
    directRecruits: 0,
    generations: 0,
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
        // Get agent's matrix position
        const { data: positionData } = await supabase
          .from('matrix_positions')
          .select('*')
          .eq('agent_id', agent.id)
          .single();

        const myPosition = positionData as { path: string } | null;
        if (myPosition) {
          // Count total downline
          const { count: totalDownline } = await supabase
            .from('matrix_positions')
            .select('*', { count: 'exact', head: true })
            .like('path', `${myPosition.path}.%`);

          // Count direct recruits
          const { count: directRecruits } = await supabase
            .from('agents')
            .select('*', { count: 'exact', head: true })
            .eq('sponsor_id', agent.id);

          setDownlineStats({
            total: totalDownline || 0,
            active: 0, // Simplified for now
            directRecruits: directRecruits || 0,
            generations: 0, // Simplified for now
          });
        }
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
        <h1 className="text-2xl font-bold tracking-tight">Genealogy</h1>
        <p className="text-muted-foreground">
          View your downline organization and team structure.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downline</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{downlineStats.total}</div>
            <p className="text-xs text-muted-foreground">
              in your organization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{downlineStats.active}</div>
            <p className="text-xs text-muted-foreground">
              producing agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Direct Recruits</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{downlineStats.directRecruits}</div>
            <p className="text-xs text-muted-foreground">
              personally sponsored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generations Deep</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{downlineStats.generations}</div>
            <p className="text-xs text-muted-foreground">
              levels in matrix
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tree View */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Tree</CardTitle>
          <CardDescription>
            Interactive view of your downline. Zoom, pan, and explore your team structure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenealogyTree />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-primary bg-background" />
              <span className="text-muted-foreground">You (Root)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-border bg-background" />
              <span className="text-muted-foreground">Team Member</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-muted-foreground">Inactive/Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
