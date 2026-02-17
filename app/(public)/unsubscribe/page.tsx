// Unsubscribe from email drip campaign
// CAN-SPAM compliance page

import { db } from "@/lib/db/client";
import { dripEnrollments, distributors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

async function unsubscribeDistributor(distributorId: string) {
  "use server";

  try {
    await db
      .update(dripEnrollments)
      .set({
        status: "opted_out",
        updatedAt: new Date(),
      })
      .where(eq(dripEnrollments.distributorId, distributorId));

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to unsubscribe" };
  }
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const distributorId = params.id;

  if (!distributorId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Link</h1>
          <p className="text-gray-600">
            This unsubscribe link is invalid. Please contact support if you need assistance.
          </p>
        </div>
      </div>
    );
  }

  // Check if distributor exists
  const [distributor] = await db
    .select()
    .from(distributors)
    .where(eq(distributors.id, distributorId))
    .limit(1);

  if (!distributor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Found</h1>
          <p className="text-gray-600">
            We couldn't find your account. Please contact support if you need assistance.
          </p>
        </div>
      </div>
    );
  }

  // Check current drip status
  const [enrollment] = await db
    .select()
    .from(dripEnrollments)
    .where(eq(dripEnrollments.distributorId, distributorId))
    .limit(1);

  const isUnsubscribed = enrollment?.status === "opted_out";

  // Handle unsubscribe action
  if (!isUnsubscribed) {
    await unsubscribeDistributor(distributorId);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isUnsubscribed ? "Already Unsubscribed" : "Successfully Unsubscribed"}
        </h1>

        <p className="text-gray-600 mb-6">
          {isUnsubscribed
            ? "You've previously unsubscribed from our email series."
            : "You've been unsubscribed from the Apex Affinity Group email training series."}
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-blue-900 mb-2">
            <strong>Note:</strong> You will still receive:
          </p>
          <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
            <li>Account-related emails (password resets, security alerts)</li>
            <li>Team notifications (new members joining your organization)</li>
            <li>Important company announcements</li>
          </ul>
        </div>

        <p className="text-sm text-gray-500">
          To resubscribe or for any questions, please contact{" "}
          <a
            href="mailto:support@apexaffinitygroup.com"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            support@apexaffinitygroup.com
          </a>
        </p>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Return to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
