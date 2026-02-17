// Admin Email Management
// View and edit all email templates

import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { newcomerTrack, licensedAgentTrack } from "@/lib/email/drip-content";

export default async function EmailsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
        <p className="text-muted-foreground mt-1">
          Manage welcome and drip campaign email templates
        </p>
      </div>

      {/* Welcome Email */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Welcome Email</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sent immediately after signup
          </p>
        </div>
        <div className="p-6">
          <Link
            href="/admin/emails/welcome"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Welcome Email
          </Link>
        </div>
      </div>

      {/* Newcomer Track */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Newcomer Track (Not Licensed)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            20 emails for people new to insurance • Sent every 3 days
          </p>
        </div>
        <div className="divide-y">
          {newcomerTrack.map((email) => (
            <div key={email.step} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">
                      Email {email.step}
                    </span>
                    <h3 className="font-medium text-gray-900">
                      {email.subject}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {email.previewText}
                  </p>
                </div>
                <Link
                  href={`/admin/emails/drip/newcomer/${email.step}`}
                  className="ml-4 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Licensed Agent Track */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Licensed Agent Track</h2>
          <p className="text-sm text-muted-foreground mt-1">
            20 emails for experienced insurance agents • Sent every 3 days
          </p>
        </div>
        <div className="divide-y">
          {licensedAgentTrack.map((email) => (
            <div key={email.step} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">
                      Email {email.step}
                    </span>
                    <h3 className="font-medium text-gray-900">
                      {email.subject}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {email.previewText}
                  </p>
                </div>
                <Link
                  href={`/admin/emails/drip/licensed/${email.step}`}
                  className="ml-4 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
