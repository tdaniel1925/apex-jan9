// SPEC: OPTIVE REDESIGN > Corporate Page
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 1: Corporate Marketing Site

import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { HeroSection } from "@/components/marketing/HeroSection";
import { AboutSection } from "@/components/marketing/AboutSection";
import { ServicesSection } from "@/components/marketing/ServicesSection";
import { ProcessSection } from "@/components/marketing/ProcessSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { FAQSection } from "@/components/marketing/FAQSection";
import { CTASection } from "@/components/marketing/CTASection";

export const metadata: Metadata = {
  title: "Build Your Future with Apex Affinity Group",
  description:
    "Join a community of entrepreneurs creating financial freedom through proven systems and support. 1000+ active members in 50+ countries worldwide.",
  keywords: "apex affinity group, financial freedom, network marketing, MLM, team building, passive income, forced matrix",
  openGraph: {
    title: "Build Your Future with Apex Affinity Group",
    description:
      "Join a community of 1000+ entrepreneurs in 50+ countries creating financial freedom through proven business systems.",
    images: ["/logo/apex-full-color.png"],
    type: "website",
    url: "https://theapexway.net",
  },
};

export default async function CorporatePage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader variant="corporate" ctaLink="/join" />
      <main>
        <HeroSection
          variant="corporate"
          title="Build Your Future with Apex Affinity Group"
          subtitle="Join a community of entrepreneurs creating financial freedom through proven systems and support"
          ctaText="Join Now"
          ctaLink="/join"
        />
        <AboutSection
          variant="corporate"
          stats={{
            activeMembers: 1000,
            countries: 50,
            memberEarnings: 5,
          }}
        />
        <ServicesSection />
        <ProcessSection variant="corporate" />
        <TestimonialsSection variant="corporate" />
        <FAQSection />
        <CTASection variant="corporate" ctaLink="/join" />
      </main>
      <MarketingFooter />
    </div>
  );
}
