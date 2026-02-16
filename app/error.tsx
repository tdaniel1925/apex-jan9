// SPEC: SPEC-PAGES > Error Pages > 500 Page

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error handled
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <div className="text-9xl font-bold text-red-600 mb-4">!</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Something Went Wrong
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            We're sorry, but something unexpected happened. Our team has been
            notified and is working on a fix.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            What you can do:
          </h2>
          <ul className="text-left text-gray-600 space-y-2 mb-4">
            <li>• Try refreshing the page</li>
            <li>• Check your internet connection</li>
            <li>• Return to the home page and try again</li>
            <li>
              • If the problem persists, contact support at{" "}
              <a
                href="mailto:support@apexaffinitygroup.com"
                className="text-blue-600 hover:underline"
              >
                support@apexaffinitygroup.com
              </a>
            </li>
          </ul>
          {error.digest && (
            <p className="text-sm text-gray-500">
              Error ID: <code className="bg-gray-100 px-2 py-1 rounded">{error.digest}</code>
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => reset()} className="gap-2">
            <RefreshCw className="h-5 w-5" />
            Try Again
          </Button>
          <Link href="/">
            <Button size="lg" variant="outline" className="gap-2">
              <Home className="h-5 w-5" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
