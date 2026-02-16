// Corporate homepage - Main landing page

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
import { PathChoice } from "./PathChoice";

export function CorporatePageClient() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <MarketingHeader variant="corporate" ctaLink="/join" />
      <main className="overflow-x-hidden">
        <HeroSection
          variant="corporate"
          title="More Carriers. Better Technology. Higher Commissions."
          subtitle="Apex gives you what captive agencies can't: 7 premier carriers, up to 100% commissions, AI-powered CRM, and a 6-generation team override structure. Free to join."
          ctaText="Choose Your Path"
          ctaLink="#choose-path"
        />
        <div id="choose-path">
          <PathChoice />
        </div>
        <div id="about">
          <AboutSection
            variant="corporate"
            stats={{
              activeMembers: 54,
              countries: 160,
              memberEarnings: 693,
            }}
          />
        </div>
        <ServicesSection />
        <ProcessSection variant="corporate" />
        <TestimonialsSection variant="corporate" />
        <div id="faq">
          <FAQSection />
        </div>
        <div id="contact">
          <CTASection variant="corporate" ctaLink="/join" />
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
