// Page for people new to insurance
import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { HeroSection } from "@/components/marketing/HeroSection";
import { AboutSection } from "@/components/marketing/AboutSection";
import { ServicesSection } from "@/components/marketing/ServicesSection";
import { ProcessSection } from "@/components/marketing/ProcessSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { CTASection } from "@/components/marketing/CTASection";
import { ContactSection } from "@/components/marketing/ContactSection";
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
        title="What If You Could Build Wealth Helping Families?"
        subtitle="No insurance experience? No problem. Get complete training, proven systems, and the income opportunity to build your future—starting today."
        ctaText="Start Your Journey"
        ctaLink="/join"
        audiencePreference="newcomers"
      />

      {/* About Section */}
      <AboutSection
        variant="corporate"
        stats={{
          yearsInBusiness: 5,
          activeDistributors: 500,
          memberEarnings: 2500000,
        }}
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

      {/* Contact */}
      <ContactSection />

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}
