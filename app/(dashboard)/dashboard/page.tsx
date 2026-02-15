// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Dashboard Home
// Temporary placeholder for dashboard - will be built in Stage 5

import { requireDistributor } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await requireDistributor();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
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
              Dashboard Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your distributor dashboard will be available here. This is a
              placeholder for Stage 5.
            </p>
          </div>

          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Stage 2 Complete
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Authentication, middleware, and RLS are now active. You are
              accessing this page as an authenticated distributor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
