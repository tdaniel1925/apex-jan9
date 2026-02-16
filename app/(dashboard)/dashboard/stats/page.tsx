// SPEC: SPEC-PAGES > Stats Page
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Stats Page
// Stats page with charts and metrics

import { requireDistributor } from "@/lib/auth";
import { getStatsData } from "@/lib/actions";
import { StatsCard } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, UserPlus, Layers, TrendingUp } from "lucide-react";
import { SignupsChart } from "@/components/dashboard/signups-chart";
import { Suspense } from "react";
import { ChartSkeleton } from "@/components/dashboard";

async function StatsContent() {
  const user = await requireDistributor();
  const stats = await getStatsData();

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Organization"
          value={stats.totalOrg}
          icon={Users}
        />
        <StatsCard
          title="Direct Enrollees"
          value={stats.directEnrollees}
          icon={UserPlus}
        />
        <StatsCard
          title="Levels Filled"
          value={`${stats.levelsFilled} of 7`}
          icon={Layers}
        />
        <StatsCard
          title="New This Month"
          value={stats.newThisMonth}
          icon={TrendingUp}
        />
      </div>

      {/* Sign-ups Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sign-Ups Over Time (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.signupsByDay.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No sign-ups in the last 30 days</p>
            </div>
          ) : (
            <SignupsChart data={stats.signupsByDay} />
          )}
        </CardContent>
      </Card>

      {/* Org Breakdown by Level */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Breakdown by Level</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.orgByLevel.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No organization data yet</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.orgByLevel.map((level) => (
                    <TableRow key={level.level}>
                      <TableCell className="font-medium">
                        Level {level.level}
                      </TableCell>
                      <TableCell>{level.count}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {stats.totalOrg > 0
                          ? ((level.count / stats.totalOrg) * 100).toFixed(1)
                          : 0}
                        %
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-medium bg-gray-50 dark:bg-gray-800">
                    <TableCell>Total</TableCell>
                    <TableCell>{stats.totalOrg}</TableCell>
                    <TableCell>100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Statistics</h1>
        <p className="text-muted-foreground mt-1">
          View your organization growth and metrics
        </p>
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        <StatsContent />
      </Suspense>
    </div>
  );
}
