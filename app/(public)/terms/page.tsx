// Legal page: Terms of Service
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function TermsPage() {
  return (
    <MarketingLayout variant="corporate">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 md:p-12">
            <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              Terms of Service
            </h1>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-6 mb-8">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  ⚠️ <strong>Important:</strong> This is a placeholder page. Complete terms of service
                  should be drafted by a legal professional before launching this platform.
                </p>
              </div>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  By accessing and using the Apex Affinity Group platform, you accept and agree
                  to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  2. Distributor Agreement
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  By registering as a distributor, you agree to comply with all applicable laws
                  and regulations regarding multi-level marketing and network marketing in your
                  jurisdiction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  3. User Conduct
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Users agree not to engage in any activity that interferes with or disrupts
                  the platform or servers.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  4. Limitation of Liability
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Apex Affinity Group shall not be liable for any indirect, incidental, special,
                  consequential, or punitive damages resulting from your use of the platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  5. Changes to Terms
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We reserve the right to modify these terms at any time. Continued use of the
                  platform after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/join"
                  className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Back to Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
