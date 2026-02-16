// SPEC: SPEC-PAGES > Dashboard Home
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Dashboard Home
// Dashboard home page with stats and quick links

import { requireDistributor } from "@/lib/auth";
import { getDashboardStats, getRecentActivity } from "@/lib/actions";
import { StatsCard } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, TrendingUp, Mail, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { CopyUrlButton } from "@/components/dashboard/copy-url-button";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard";

async function DashboardContent() {
  const user = await requireDistributor();
  const stats = await getDashboardStats();
  const recentActivity = await getRecentActivity(10);

  const replicatedUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${user.username}`;

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user.firstName}!</h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your organization
        </p>
      </div>

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
          title="New This Month"
          value={stats.newThisMonth}
          icon={TrendingUp}
        />
        <StatsCard
          title="Unread Messages"
          value={stats.unreadContacts}
          icon={Mail}
        />
      </div>

      {/* Replicated URL Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Replicated Site</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Share this link to grow your team:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm">
                {replicatedUrl}
              </div>
              <div className="flex gap-2">
                <CopyUrlButton url={replicatedUrl} />
                <Button variant="outline" size="default" asChild>
                  <Link href={`/${user.username}`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {stats.totalOrg === 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-200">
                Get Started!
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Your replicated site is live! Share your link on social media, email it
                to friends, or add it to your email signature to start building your
                team.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity</p>
                <p className="text-sm mt-1">
                  Activity will appear here as your team grows
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b last:border-b-0"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {formatActivityAction(activity.action)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleDateString()}{" "}
                        {new Date(activity.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/profile">
                <Users className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/team">
                <UserPlus className="h-4 w-4 mr-2" />
                View My Team
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/contacts">
                <Mail className="h-4 w-4 mr-2" />
                Check Messages
                {stats.unreadContacts > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {stats.unreadContacts}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/stats">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Stats
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatActivityAction(action: string): string {
  const actionMap: Record<string, string> = {
    "distributor.signed_up": "New distributor signed up",
    "contact.submitted": "New contact form submission",
    "profile.updated": "Profile updated",
    "profile.photo_updated": "Profile photo updated",
    "profile.password_changed": "Password changed",
  };

  return actionMap[action] || action;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
