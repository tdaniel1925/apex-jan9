// Legal page: Privacy Policy
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 md:p-12">
            <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              Privacy Policy
            </h1>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-6 mb-8">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  ⚠️ <strong>Important:</strong> This is a placeholder page. A complete privacy policy
                  compliant with GDPR, CCPA, and other regulations should be drafted by a legal
                  professional before launching this platform.
                </p>
              </div>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  1. Information We Collect
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Name and contact information (email, phone)</li>
                  <li>Account credentials (username, password)</li>
                  <li>Profile information (photo, bio)</li>
                  <li>Payment and billing information</li>
                  <li>Communications with us and other users</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  2. How We Use Your Information
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Monitor and analyze trends and usage</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  3. Information Sharing
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We do not sell your personal information. We may share your information in
                  limited circumstances, such as with your consent, to comply with legal
                  obligations, or with service providers who assist in our operations.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  4. Data Security
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We take reasonable measures to protect your personal information from
                  unauthorized access, use, or disclosure. However, no internet transmission
                  is ever fully secure.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  5. Your Rights
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You have the right to access, update, or delete your personal information.
                  You may also have additional rights depending on your location.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  6. Cookies and Tracking
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We use cookies and similar tracking technologies to collect information about
                  your browsing activities and to remember your preferences.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  7. Contact Us
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  If you have any questions about this Privacy Policy, please contact us at{" "}
                  <a href="mailto:privacy@apexaffinitygroup.com" className="text-primary hover:underline">
                    privacy@apexaffinitygroup.com
                  </a>
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
