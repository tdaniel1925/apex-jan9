// Page for licensed insurance agents
import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { HeroSection } from "@/components/marketing/HeroSection";
import { ServicesSection } from "@/components/marketing/ServicesSection";
import { ProcessSection } from "@/components/marketing/ProcessSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { CTASection } from "@/components/marketing/CTASection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "For Licensed Agents — Apex Affinity Group",
  description:
    "Own your book. Keep your commissions. Access top rates and AI-powered tools. See why licensed agents are making the switch to Apex.",
  keywords: "insurance agent, own your book, life insurance rates, AI automation, independent agent",
  openGraph: {
    title: "For Licensed Agents — Apex Affinity Group",
    description:
      "Better rates, full ownership, and AI that does the follow-up. The only insurance company built for agents who want more.",
    images: ["/logo/apex-full-color.png"],
    type: "website",
  },
};

export default function LicensedAgentsPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader
        variant="corporate"
        ctaLink="/join"
      />

      {/* Hero Section - Agent focused */}
      <HeroSection
        variant="corporate"
        title="50% Commissions or 100%? Your Choice."
        subtitle="7 premier carriers. Up to 100% commissions paid direct. AI-powered CRM. Build a team and earn 6-generation overrides. Keep 100% ownership. Free to join."
        ctaText="Join Now"
        ctaLink="/join"
        audiencePreference="agents"
      />

      {/* Services/Benefits */}
      <ServicesSection />

      {/* Process/How It Works */}
      <ProcessSection variant="corporate" />

      {/* Testimonials */}
      <TestimonialsSection variant="corporate" />

      {/* CTA Section */}
      <CTASection
        variant="corporate"
        ctaLink="/join"
        audiencePreference="agents"
      />

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}
