// SPEC: OPTIVE REDESIGN > CTA Section
// SOURCE: index.html lines ~1440-1499

"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ctaMessaging, type AudienceType } from "@/lib/content/audienceMessaging";

interface CTASectionProps {
  variant: "corporate" | "replicated";
  distributorName?: string;
  ctaLink: string;
  audiencePreference?: AudienceType | null;
}

export function CTASection({ variant, distributorName, ctaLink, audiencePreference }: CTASectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Get audience-specific messaging
  const audience = audiencePreference || "both";
  const messaging = ctaMessaging[audience];

  const heading = variant === "corporate"
    ? messaging.heading
    : "What If Insurance Could Be Different?";

  const subheading = variant === "corporate"
    ? messaging.subheading
    : `${distributorName} found a better path. Own your business. Keep your commissions. Build a legacy. Your turn.`;

  const ctaText = variant === "corporate"
    ? messaging.primaryCta
    : "Let's Talk";

  const secondaryCtaText = variant === "corporate"
    ? messaging.secondaryCta
    : "Ask a Question";

  const secondaryCtaLink = variant === "corporate"
    ? "#about"
    : "#contact";

  return (
    <section className="relative py-24 bg-gradient-to-br from-apex-navy-dark via-apex-navy-950 to-apex-navy-dark text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCA0YzEuMTA1IDAgMiAuODk1IDIgMnMtLjg5NSAyLTIgMi0yLS44OTUtMi0yIC44OTUtMiAyLTJ6IiBmaWxsPSIjZmZmIi8+PC9nPjwvc3ZnPg==')] bg-repeat"></div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-apex-navy rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-apex-navy-dark rounded-full opacity-10 blur-3xl"></div>

      <div className="container max-w-optive mx-auto px-6 relative z-10">
        <div ref={ref} className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-apex-navy rounded-full mb-8 shadow-lg"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 leading-tight"
          >
            {heading}
          </motion.h2>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-200 mb-12 leading-relaxed"
          >
            {subheading}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* Primary CTA */}
            <Link
              href={ctaLink}
              className="relative inline-flex items-center justify-center gap-2 px-10 py-5 pr-16 rounded-lg bg-apex-red hover:bg-apex-red-dark text-white text-lg font-semibold transition-all duration-400 group shadow-2xl hover:shadow-apex-red/50 hover:scale-105"
            >
              {ctaText}
              <span className="absolute right-6 transition-transform duration-400 group-hover:translate-x-0.5">
                <ArrowRight className="w-6 h-6" />
              </span>
            </Link>

            {/* Secondary CTA */}
            <a
              href={secondaryCtaLink}
              className="inline-flex items-center justify-center gap-2 px-8 py-5 rounded-lg bg-white/10 backdrop-blur-md text-white text-lg font-semibold border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300"
            >
              {secondaryCtaText}
            </a>
          </motion.div>

          {/* Trust Indicators */}
          {variant === "corporate" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-8 text-gray-300"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-apex-navy rounded-full"></div>
                <span className="text-sm font-medium">1,247+ Active Members</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-apex-navy rounded-full"></div>
                <span className="text-sm font-medium">5 Years Proven Track Record</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-apex-navy rounded-full"></div>
                <span className="text-sm font-medium">12 Countries Worldwide</span>
              </div>
            </motion.div>
          )}

          {variant === "replicated" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12 text-gray-300"
            >
              <p className="text-sm font-medium">
                Join {distributorName}'s growing team and build your financial future with proven systems and dedicated support.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
