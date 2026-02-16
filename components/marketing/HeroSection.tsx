// SPEC: OPTIVE REDESIGN > Hero Section
// SOURCE: index.html lines 107-173

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface HeroSectionProps {
  variant: "corporate" | "replicated";
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundVideo?: string;
  backgroundImage?: string;
  distributorPhoto?: string | null;
  distributorName?: string;
}

export function HeroSection({
  variant,
  title,
  subtitle,
  ctaText,
  ctaLink,
  backgroundVideo,
  backgroundImage,
  distributorPhoto,
  distributorName,
}: HeroSectionProps) {
  return (
    <section id="home" className="relative min-h-screen flex items-end pb-20 bg-gradient-to-br from-apex-navy via-apex-navy-dark to-apex-navy-950 text-white overflow-hidden">
      {/* Background Video or Image */}
      {variant === "corporate" ? (
        <>
          {backgroundVideo ? (
            <div className="absolute inset-0 z-0">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover opacity-40"
              >
                <source src={backgroundVideo} type="video/mp4" />
              </video>
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-apex-navy/80 via-apex-navy-dark/60 to-apex-navy-950/90" />
            </div>
          ) : (
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
        </>
      ) : (
        // Replicated variant - Flag background
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-flag.png"
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-apex-navy/70 via-apex-navy-dark/50 to-apex-navy-950/80" />
        </div>
      )}

      {/* Content */}
      <div className="container max-w-optive mx-auto px-6 pt-32 relative z-10">
        <div className={variant === "corporate" ? "grid grid-cols-1 xl:grid-cols-12 gap-12 items-end" : "flex justify-center"}>
          {/* Main Content */}
          <div className={variant === "corporate" ? "xl:col-span-8" : "max-w-4xl text-center"}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Section Subtitle */}
              <span className="inline-block text-sm font-semibold text-apex-red uppercase tracking-wider mb-4">
                {variant === "corporate"
                  ? "Transforming Financial Challenges Into Growth"
                  : `Your Sponsor: ${distributorName}`
                }
              </span>

              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold leading-tight mb-6">
                {title}
              </h1>

              {/* Subtitle */}
              <p className={`text-xl sm:text-2xl text-gray-200 mb-8 max-w-2xl leading-relaxed ${variant === "replicated" ? "mx-auto" : ""}`}>
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

          {/* Sidebar Info Box (Corporate only) */}
          {variant === "corporate" && (
            <motion.div
              className="xl:col-span-4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
                <div className="aspect-video bg-white/5 rounded-lg mb-6 flex items-center justify-center">
                  <div className="w-16 h-16 bg-apex-navy rounded-full flex items-center justify-center">
                    <ArrowRight className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-heading font-semibold mb-3">Smart Advisory</h2>
                <p className="text-gray-200">
                  Our smart advisory services combine expert insight, data-driven analysis, and proven strategies.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-10">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white rounded-full"></div>
        </div>
      </div>
    </section>
  );
}
