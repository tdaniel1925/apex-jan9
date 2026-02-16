// Page for people new to insurance
import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { HeroSection } from "@/components/marketing/HeroSection";
import { ServicesSection } from "@/components/marketing/ServicesSection";
import { ProcessSection } from "@/components/marketing/ProcessSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { CTASection } from "@/components/marketing/CTASection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Start Your Insurance Career — Apex Affinity Group",
  description:
    "New to insurance? Discover how Apex provides training, mentorship, and income opportunity to build your future in the insurance industry.",
  keywords: "insurance career, get started in insurance, insurance training, insurance mentorship, career opportunity",
  openGraph: {
    title: "Start Your Insurance Career — Apex Affinity Group",
    description:
      "Complete training and support to launch your insurance career. No experience required.",
    images: ["/logo/apex-full-color.png"],
    type: "website",
  },
};

export default function NewToInsurancePage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader
        variant="corporate"
        ctaLink="/join"
      />

      {/* Hero Section - Newcomer focused */}
      <HeroSection
        variant="corporate"
        title="No Experience? No Problem. We'll Get You Licensed and Selling."
        subtitle="Complete training. 1-on-1 mentorship. Write your first policy within 2 weeks. Earn 50-100% commissions on 7 top carriers. Free to join, no monthly fees."
        ctaText="Start Your Career"
        ctaLink="/join"
        audiencePreference="newcomers"
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
        audiencePreference="newcomers"
      />

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}
