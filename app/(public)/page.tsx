// SPEC: OPTIVE REDESIGN > Corporate Page
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 1: Corporate Marketing Site
// SPEC: AUDIENCE SEGMENTATION > Stage 6: Server component with SEO metadata

import type { Metadata } from "next";
import { CorporatePageClient } from "@/components/marketing/CorporatePageClient";

export const metadata: Metadata = {
  title: "Apex Affinity Group - Own Your Insurance Business",
  description:
    "Own your book. Access top rates. Build wealth through your team. The only insurance company with AI-powered automation. For licensed agents and newcomers.",
  openGraph: {
    title: "Apex Affinity Group - Own Your Insurance Business",
    description:
      "Own your book. Access top rates. Build wealth through your team. The only insurance company with AI-powered automation.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apex Affinity Group - Own Your Insurance Business",
    description:
      "Own your book. Access top rates. Build wealth through your team. The only insurance company with AI-powered automation.",
  },
};

export default function CorporatePage() {
  return <CorporatePageClient />;
}
