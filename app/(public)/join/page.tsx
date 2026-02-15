// SPEC: SPEC-PAGES > Sign-Up Page — No Sponsor (/join)
// DEP-MAP: FEATURE 3 > Sign-Up Flow

import { Metadata } from "next";
import Link from "next/link";
import { getCompanyRootDistributor } from "@/lib/db/queries";
import { SignUpForm } from "@/components/signup/SignUpForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Join Apex Affinity Group",
  description:
    "Sign up to join the Apex Affinity Group and start building your own business.",
};

export default async function JoinPage() {
  // Get company root distributor for generic sign-ups
  const rootDistributor = await getCompanyRootDistributor();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="inline-block mb-8 text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
          >
            Apex Affinity Group
          </Link>

          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-4">
              Join Apex Affinity Group
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start your journey with Apex Affinity Group. Create your account
              below to get your own replicated site and begin building your
              business.
            </p>
          </div>
        </div>

        {/* Sign-Up Form */}
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <SignUpForm
              enrollerId={rootDistributor.id}
              enrollerName="Apex Affinity Group"
            />
          </div>

          {/* Already have account */}
          <p className="text-center mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
