// SPEC: SPEC-PAGES > Corporate Marketing Page
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 1: Corporate Marketing Site

import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { HeroSection } from "@/components/marketing/HeroSection";
import { AboutSection } from "@/components/marketing/AboutSection";
import { OpportunitySection } from "@/components/marketing/OpportunitySection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { CTASection } from "@/components/marketing/CTASection";
import { db } from "@/lib/db/client";
import { siteContent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Apex Affinity Group — Build Your Future",
  description:
    "Join a community of entrepreneurs creating financial freedom through proven systems and support. Start your journey with Apex Affinity Group today.",
  openGraph: {
    title: "Apex Affinity Group — Build Your Future",
    description:
      "Join a community of entrepreneurs creating financial freedom through proven systems and support.",
    type: "website",
    url: "https://theapexway.net",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Apex Affinity Group",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Apex Affinity Group — Build Your Future",
    description:
      "Join a community of entrepreneurs creating financial freedom through proven systems and support.",
  },
};

async function getContent(key: string): Promise<string | null> {
  try {
    const result = await db
      .select()
      .from(siteContent)
      .where(eq(siteContent.sectionKey, key))
      .limit(1);
    return result[0]?.content || null;
  } catch (error) {
    console.error(`Failed to load site content for key: ${key}`, error);
    return null;
  }
}

export default async function CorporatePage() {
  // Load site content with fallbacks
  const heroTitle = await getContent("hero_title");
  const heroSubtitle = await getContent("hero_subtitle");

  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main>
        <HeroSection title={heroTitle || undefined} subtitle={heroSubtitle || undefined} />
        <AboutSection />
        <OpportunitySection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <MarketingFooter />
    </div>
  );
}
