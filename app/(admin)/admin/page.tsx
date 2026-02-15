// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 5 > Admin Dashboard
// Temporary placeholder for admin - will be built in Stage 6

import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {user.firstName} {user.lastName} ({user.role})
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {user.email}
              </p>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Admin Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Admin panel features will be available here. This is a placeholder
              for Stage 6.
            </p>
          </div>

          <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md p-4">
            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Stage 2 Complete
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
              Authentication, middleware, and RLS are now active. You are
              accessing this page as an authenticated admin with role: {user.role}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
