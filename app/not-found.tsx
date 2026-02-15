// SPEC: SPEC-PAGES > Error Pages > 404 Page

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <div className="text-9xl font-bold text-blue-600 mb-4">404</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            We couldn't find the page you're looking for. It may have been moved or
            doesn't exist.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-2 text-gray-700 mb-4">
            <Search className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Looking for a distributor?</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Distributor pages are available at: <br />
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              theapexway.net/[username]
            </code>
          </p>
          <p className="text-sm text-gray-500">
            Make sure you have the correct username and try again.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="gap-2">
              <Home className="h-5 w-5" />
              Back to Home
            </Button>
          </Link>
          <Link href="/join">
            <Button size="lg" variant="outline" className="gap-2">
              Join Apex
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
