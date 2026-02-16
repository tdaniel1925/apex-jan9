// SPEC: SPEC-PAGES > Admin Dashboard (/admin)
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 5 > Admin Dashboard
// Admin dashboard with stats, funnel, and activity feed

import { requireAdmin } from "@/lib/auth";
import {
  getAdminStats,
  getSignupFunnel,
  getAdminRecentActivity,
} from "@/lib/actions";
import { StatsCard } from "@/components/admin/stats-card";
import { SignupFunnelChart } from "@/components/admin/signup-funnel-chart";
import { ActivityFeed } from "@/components/admin/activity-feed";
import {
  Users,
  UserCheck,
  UserX,
  UserMinus,
  TrendingUp,
  Calendar,
} from "lucide-react";

export default async function AdminDashboard() {
  await requireAdmin();

  // Get stats
  const stats = await getAdminStats();

  // Get signup funnel for last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const funnelData = await getSignupFunnel({ start: startDate, end: endDate });

  // Get recent activity
  const activities = await getAdminRecentActivity(20);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          System overview and recent activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Distributors"
          value={stats.totalDistributors}
          icon={Users}
          trend={stats.newThisMonth > 0 ? "up" : "neutral"}
          trendLabel={`+${stats.newThisMonth} this month`}
        />
        <StatsCard
          title="Active"
          value={stats.activeDistributors}
          icon={UserCheck}
          color="green"
        />
        <StatsCard
          title="Inactive"
          value={stats.inactiveDistributors}
          icon={UserX}
          color="gray"
        />
        <StatsCard
          title="Suspended"
          value={stats.suspendedDistributors}
          icon={UserMinus}
          color="red"
        />
        <StatsCard
          title="New This Week"
          value={stats.newThisWeek}
          icon={TrendingUp}
          color="blue"
        />
        <StatsCard
          title="New This Month"
          value={stats.newThisMonth}
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* Signup Funnel Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">
          Sign-Up Funnel (Last 30 Days)
        </h2>
        <SignupFunnelChart data={funnelData} />
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
}
