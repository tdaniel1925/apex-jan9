// SPEC: OPTIVE REDESIGN > Replicated Distributor Page
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 2: Replicated Page

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findDistributorByUsername, trackSignupEvent } from "@/lib/db/queries";
import { getOrganizationSize, getDirectEnrolleesCount } from "@/lib/matrix";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/rate-limit";

// Optive Marketing Components
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { HeroSection } from "@/components/marketing/HeroSection";
import { AboutSection } from "@/components/marketing/AboutSection";
import { ServicesSection } from "@/components/marketing/ServicesSection";
import { ProcessSection } from "@/components/marketing/ProcessSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { ContactSection } from "@/components/marketing/ContactSection";
import { CTASection } from "@/components/marketing/CTASection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

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
  }).catch((error) => {
    console.error("Failed to track page view:", error);
  });

  const distributorName = distributor.firstName;
  const fullName = `${distributor.firstName} ${distributor.lastName}`;

  return (
    <div className="min-h-screen">
      <MarketingHeader
        variant="replicated"
        distributorName={fullName}
        ctaLink={`/join/${distributor.username}`}
      />

      <main>
        <HeroSection
          variant="replicated"
          title={`Join ${fullName}'s Team at Apex`}
          subtitle={`Build your financial future with ${distributorName} as your sponsor and mentor`}
          ctaText={`Join ${distributorName}'s Team`}
          ctaLink={`/join/${distributor.username}`}
          distributorPhoto={distributor.photoUrl}
          distributorName={distributorName}
        />

        <AboutSection
          variant="replicated"
          distributor={{
            firstName: distributor.firstName,
            lastName: distributor.lastName,
            photoUrl: distributor.photoUrl,
            bio: distributor.bio,
            createdAt: distributor.createdAt,
          }}
          teamStats={{
            totalTeamSize: teamSize,
            directEnrollees: directCount,
          }}
        />

        <ServicesSection />

        <ProcessSection
          variant="replicated"
          distributorName={distributorName}
        />

        <TestimonialsSection
          variant="replicated"
          distributorName={distributorName}
        />

        <ContactSection
          distributorId={distributor.id}
          distributorName={distributorName}
          distributorEmail={distributor.email}
        />

        <CTASection
          variant="replicated"
          distributorName={distributorName}
          ctaLink={`/join/${distributor.username}`}
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
