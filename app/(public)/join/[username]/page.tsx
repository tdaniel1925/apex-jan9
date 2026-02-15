// SPEC: SPEC-PAGES > Sign-Up Page (/join/[username])
// DEP-MAP: FEATURE 3 > Sign-Up Flow

import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { findDistributorByUsername } from "@/lib/db/queries";
import { SignUpForm } from "@/components/signup/SignUpForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const distributor = await findDistributorByUsername(username);

  if (!distributor) {
    return {
      title: "Distributor Not Found",
    };
  }

  return {
    title: `Join ${distributor.firstName} ${distributor.lastName}'s Team - Apex Affinity Group`,
    description: `Sign up to join ${distributor.firstName}'s team at Apex Affinity Group and start building your own business.`,
  };
}

export default async function JoinPage({ params }: PageProps) {
  const { username } = await params;

  // Lookup enroller by username
  const distributor = await findDistributorByUsername(username);

  if (!distributor) {
    notFound();
  }

  const fullName = `${distributor.firstName} ${distributor.lastName}`;
  const initials = `${distributor.firstName.charAt(0)}${distributor.lastName.charAt(0)}`;

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

          {/* Enroller Info */}
          <div className="flex flex-col items-center mb-6">
            <Avatar className="h-24 w-24 mb-4 ring-4 ring-purple-100">
              {distributor.photoUrl && (
                <AvatarImage
                  src={distributor.photoUrl}
                  alt={fullName}
                />
              )}
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-3xl font-bold mb-2">
              Join {fullName}'s Team
            </h1>
            <p className="text-muted-foreground max-w-md">
              You've been invited to join the Apex Affinity Group by {distributor.firstName}.
              Fill out the form below to create your account and start building your business.
            </p>
          </div>
        </div>

        {/* Sign-Up Form */}
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <SignUpForm enrollerId={distributor.id} enrollerName={fullName} />
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
