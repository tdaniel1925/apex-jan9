// SPEC: OPTIVE REDESIGN > Hero Section
// SOURCE: index.html lines 107-173

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { heroMessaging, type AudienceType } from "@/lib/content/audienceMessaging";

interface HeroSectionProps {
  variant: "corporate" | "replicated";
  title?: string;
  subtitle?: string;
  ctaText: string;
  ctaLink: string;
  backgroundVideo?: string;
  backgroundImage?: string;
  distributorPhoto?: string | null;
  distributorName?: string;
  audiencePreference?: AudienceType | null;
}

export function HeroSection({
  variant,
  title: titleProp,
  subtitle: subtitleProp,
  ctaText,
  ctaLink,
  backgroundVideo,
  backgroundImage,
  distributorPhoto,
  distributorName,
  audiencePreference,
}: HeroSectionProps) {
  // Use audience-specific messaging for corporate, or fallback to props
  const audience = audiencePreference || "both";
  const title = variant === "corporate" && !titleProp
    ? heroMessaging[audience].title
    : titleProp || heroMessaging.both.title;
  const subtitle = variant === "corporate" && !subtitleProp
    ? heroMessaging[audience].subtitle
    : subtitleProp || heroMessaging.both.subtitle;
  return (
    <section id="home" className="relative min-h-screen flex items-center bg-gradient-to-br from-apex-navy via-apex-navy-dark to-apex-navy-950 text-white overflow-hidden">
      {/* Split Layout: Text Left, Video Right */}
      <div className="container max-w-optive mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch min-h-screen">
          {/* Left: Content */}
          <div className="px-6 lg:px-12 py-20 flex items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Section Subtitle */}
              {variant === "corporate" && (
                <span className="inline-block text-sm font-semibold text-apex-red uppercase tracking-wider mb-4">
                  Independent Insurance Marketing Organization
                </span>
              )}

              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-6">
                {title}
              </h1>

              {/* Subtitle */}
              <p className="text-xl sm:text-2xl text-gray-200 mb-8 leading-relaxed">
                {subtitle}
              </p>

              {/* CTA Button */}
              <Link
                href={ctaLink}
                className="relative inline-flex items-center justify-center gap-2 px-8 py-4 pr-14 rounded bg-apex-red hover:bg-apex-red-dark text-white text-lg font-semibold transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105"
              >
                {ctaText}
                <span className="absolute right-6 transition-transform duration-400 group-hover:translate-x-0.5">
                  <ArrowRight className="w-5 h-5" />
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Right: Flag Video */}
          {variant === "corporate" && backgroundVideo && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative h-full min-h-screen overflow-hidden"
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                <source src={backgroundVideo} type="video/mp4" />
              </video>
              {/* Subtle vignette effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-apex-navy/30 to-transparent pointer-events-none" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Fallback background for non-video corporate or replicated variant */}
      {variant === "corporate" && !backgroundVideo && (
        <div className="absolute inset-0 z-0">
          {backgroundImage && (
            <img
              src={backgroundImage}
              alt=""
              className="w-full h-full object-cover opacity-30"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-apex-navy/80 via-apex-navy-dark/60 to-apex-navy-950/90" />
        </div>
      )}

      {variant === "replicated" && (
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg-dark.png"
            alt=""
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-apex-navy/70 via-apex-navy-dark/50 to-apex-navy-950/80" />
        </div>
      )}

      {/* Old sidebar content removed for cleaner split layout */}
      {variant === "replicated" && (
        <div className="container max-w-optive mx-auto px-6 pt-32 relative z-10">
          <div className="flex justify-center">
            <div className="max-w-4xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold leading-tight mb-6">
                  {title}
                </h1>
                <p className="text-xl sm:text-2xl text-gray-200 mb-8 max-w-2xl leading-relaxed mx-auto">
                  {subtitle}
                </p>
                <Link
                  href={ctaLink}
                  className="relative inline-flex items-center justify-center gap-2 px-8 py-4 pr-14 rounded bg-apex-red hover:bg-apex-red-dark text-white text-lg font-semibold transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105"
                >
                  {ctaText}
                  <span className="absolute right-6 transition-transform duration-400 group-hover:translate-x-0.5">
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
