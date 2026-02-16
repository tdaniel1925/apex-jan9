// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 5 > Admin Panel
// Admin layout with sidebar and navigation

import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-purple-200 dark:border-purple-900">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Admin Panel</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="lg:flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:border-r lg:border-purple-200 lg:dark:border-purple-900 lg:bg-white lg:dark:bg-gray-800">
          <div className="flex flex-col h-full">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-purple-200 dark:border-purple-900">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Apex Affinity</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    Admin Panel
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4">
              <AdminNav />
            </div>

            {/* User Profile Footer */}
            <div className="border-t border-purple-200 dark:border-purple-900 px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10 border-2 border-purple-200 dark:border-purple-800">
                  <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    {user.role.replace("_", " ")}
                  </p>
                </div>
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-purple-200 dark:border-purple-900 z-30">
        <AdminNav isMobile />
      </div>
    </div>
  );
}
