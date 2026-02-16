// SPEC: AUDIENCE SEGMENTATION > Stage 6: Client component for corporate page
// Separated to allow server-side metadata export

"use client";

import { MarketingHeader } from "./MarketingHeader";
import { MarketingFooter } from "./MarketingFooter";
import { HeroSection } from "./HeroSection";
import { AboutSection } from "./AboutSection";
import { ServicesSection } from "./ServicesSection";
import { ProcessSection } from "./ProcessSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { FAQSection } from "./FAQSection";
import { CTASection } from "./CTASection";
import { AudienceChoice } from "./AudienceChoice";
import { AudienceToggle } from "./AudienceToggle";
import { useAudiencePreference } from "@/hooks/useAudiencePreference";

export function CorporatePageClient() {
  const { preference } = useAudiencePreference();

  return (
    <div className="min-h-screen overflow-x-hidden">
      <MarketingHeader variant="corporate" ctaLink="/join" />
      <main className="overflow-x-hidden">
        <HeroSection
          variant="corporate"
          title="Are You Enjoying What You Do?"
          subtitle="If not, why settle? Own your book. Access top rates. Build wealth through your team. The only insurance company with AI-powered automation."
          ctaText="See How It Works"
          ctaLink="#opportunity"
          audiencePreference={preference}
        />
        <AudienceChoice />
        <AudienceToggle />
        <AboutSection
          variant="corporate"
          stats={{
            activeMembers: 1000,
            countries: 50,
            memberEarnings: 5,
          }}
          audiencePreference={preference}
        />
        <ServicesSection />
        <ProcessSection variant="corporate" audiencePreference={preference} />
        <TestimonialsSection variant="corporate" />
        <FAQSection />
        <CTASection variant="corporate" ctaLink="/join" audiencePreference={preference} />
      </main>
      <MarketingFooter />
    </div>
  );
}
