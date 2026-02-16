// SPEC: AUDIENCE SEGMENTATION > Stage 5: Replicated page client wrapper
// Handles conditional audience preference logic based on distributor settings

"use client";

import { HeroSection } from "./HeroSection";
import { AboutSection } from "./AboutSection";
import { ServicesSection } from "./ServicesSection";
import { ProcessSection } from "./ProcessSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { ContactSection } from "./ContactSection";
import { CTASection } from "./CTASection";
import { AudienceChoice } from "./AudienceChoice";
import { AudienceToggle } from "./AudienceToggle";
import { useAudiencePreference } from "@/hooks/useAudiencePreference";
import type { TargetAudience } from "@/lib/types/common";

interface ReplicatedPageContentProps {
  distributor: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl: string | null;
    bio: string | null;
    createdAt: Date;
    targetAudience: TargetAudience;
  };
  teamStats: {
    totalTeamSize: number;
    directEnrollees: number;
  };
}

export function ReplicatedPageContent({
  distributor,
  teamStats,
}: ReplicatedPageContentProps) {
  const { preference: visitorPreference } = useAudiencePreference();

  // Determine which preference to use
  const effectivePreference =
    distributor.targetAudience === "both"
      ? visitorPreference
      : distributor.targetAudience;

  const distributorName = distributor.firstName;
  const fullName = `${distributor.firstName} ${distributor.lastName}`;
  const showAudienceChoice = distributor.targetAudience === "both";

  return (
    <>
      <HeroSection
        variant="replicated"
        title="Ready to Own Your Future?"
        subtitle={`Partner with ${fullName} and get the only AI-powered system in insurance that does the follow-up for you.`}
        ctaText="Start Your Journey"
        ctaLink={`/join/${distributor.username}`}
        distributorPhoto={distributor.photoUrl}
        distributorName={distributorName}
        audiencePreference={effectivePreference}
      />

      {showAudienceChoice && <AudienceChoice />}
      {showAudienceChoice && <AudienceToggle />}

      <AboutSection
        variant="replicated"
        distributor={{
          firstName: distributor.firstName,
          lastName: distributor.lastName,
          photoUrl: distributor.photoUrl,
          bio: distributor.bio,
          createdAt: distributor.createdAt,
        }}
        teamStats={teamStats}
        audiencePreference={effectivePreference}
      />

      <ServicesSection />

      <ProcessSection
        variant="replicated"
        distributorName={distributorName}
        audiencePreference={effectivePreference}
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
        audiencePreference={effectivePreference}
      />
    </>
  );
}
