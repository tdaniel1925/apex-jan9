// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Dashboard Layout
// Dashboard layout with sidebar and navigation

import { requireDistributor } from "@/lib/auth";
import { getNotifications, getUnreadNotificationCount } from "@/lib/actions";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireDistributor();
  const notifications = await getNotifications(10);
  const unreadCount = await getUnreadNotificationCount();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-800 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoUrl} />
              <AvatarFallback>
                {user.firstName[0]}
                {user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
            />
          </div>
        </div>
      </header>

      <div className="lg:flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:border-r lg:bg-white lg:dark:bg-gray-800">
          <div className="flex flex-col h-full">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3 px-6 py-5 border-b">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <p className="text-sm font-semibold">Apex Affinity</p>
                  <p className="text-xs text-muted-foreground">Dashboard</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4">
              <DashboardNav />
            </div>

            {/* User Profile Footer */}
            <div className="border-t px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoUrl} />
                  <AvatarFallback>
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>
                <NotificationBell
                  notifications={notifications}
                  unreadCount={unreadCount}
                />
              </div>
              <form action={logoutAction} className="w-full">
                <Button variant="outline" size="sm" type="submit" className="w-full">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:pl-64 flex-1">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t z-30">
        <DashboardNav isMobile />
      </div>
    </div>
  );
}
