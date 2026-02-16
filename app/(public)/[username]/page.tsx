// SPEC: OPTIVE REDESIGN > Replicated Distributor Page
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 2: Replicated Page
// SPEC: AUDIENCE SEGMENTATION > Stage 5: Replicated page with conditional audience logic

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findDistributorByUsername, trackSignupEvent } from "@/lib/db/queries";
import { getOrganizationSize, getDirectEnrolleesCount } from "@/lib/matrix";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/rate-limit";

// Optive Marketing Components
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ReplicatedPageContent } from "@/components/marketing/ReplicatedPageContent";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const distributor = await findDistributorByUsername(username);

  if (!distributor) {
    return {
      title: "Distributor Not Found",
    };
  }

  const fullName = `${distributor.firstName} ${distributor.lastName}`;

  return {
    title: `${fullName} — Apex Affinity Group`,
    description: `Join ${fullName}'s team at Apex Affinity Group and start building your financial future today.`,
    openGraph: {
      title: `${fullName} — Apex Affinity Group`,
      description: `Join ${fullName}'s team at Apex.`,
      images: distributor.photoUrl ? [distributor.photoUrl] : [],
    },
    robots: distributor.status !== "active" ? "noindex" : "index,follow",
  };
}

export default async function ReplicatedPage({ params }: PageProps) {
  const { username } = await params;

  // Lookup distributor by username (case-insensitive)
  const distributor = await findDistributorByUsername(username);

  if (!distributor || distributor.status !== "active") {
    notFound();
  }

  // Fetch team stats from backend
  const teamSize = await getOrganizationSize(distributor.id);
  const directCount = await getDirectEnrolleesCount(distributor.id);

  // Track page view analytics
  const headersList = await headers();
  const clientIp = getClientIp(headersList);
  const userAgent = headersList.get("user-agent") || undefined;
  const referrer = headersList.get("referer") || undefined;

  // Track async (non-blocking)
  trackSignupEvent({
    distributorSlug: distributor.username,
    event: "page_view",
    visitorIp: clientIp,
    userAgent,
    referrer,
    metadata: {},
  }).catch(() => {
    // Silent fail - analytics errors shouldn't affect page load
  });

  const fullName = `${distributor.firstName} ${distributor.lastName}`;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <MarketingHeader
        variant="replicated"
        distributorName={fullName}
        ctaLink={`/join/${distributor.username}`}
      />

      <main className="overflow-x-hidden">
        <ReplicatedPageContent
          distributor={{
            id: distributor.id,
            username: distributor.username,
            firstName: distributor.firstName,
            lastName: distributor.lastName,
            email: distributor.email,
            photoUrl: distributor.photoUrl,
            bio: distributor.bio,
            createdAt: distributor.createdAt,
            targetAudience: distributor.targetAudience || "both",
          }}
          teamStats={{
            totalTeamSize: teamSize,
            directEnrollees: directCount,
          }}
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
