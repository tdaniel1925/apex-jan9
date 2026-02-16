// SPEC: OPTIVE REDESIGN > About Section
// SOURCE: index.html lines 243-325

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Calendar, Users, Globe, TrendingUp } from "lucide-react";
import { aboutMessaging, type AudienceType } from "@/lib/content/audienceMessaging";
import Image from "next/image";

interface AboutSectionProps {
  variant: "corporate" | "replicated";
  // Corporate variant
  stats?: {
    activeMembers?: number;
    countries?: number;
    memberEarnings?: number;
    // Legacy support
    yearsInBusiness?: number;
    activeDistributors?: number;
  };
  // Replicated variant
  distributor?: {
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    bio: string | null;
    createdAt: Date;
  };
  teamStats?: {
    totalTeamSize: number;
    directEnrollees: number;
  };
  audiencePreference?: AudienceType | null;
}

// Animated counter component
function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = target;
      const duration = 2000;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, target]);

  return (
    <div ref={ref} className="text-5xl font-heading font-bold text-apex-navy">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
}

export function AboutSection({
  variant,
  stats,
  distributor,
  teamStats,
  audiencePreference,
}: AboutSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Get audience-specific messaging
  const audience = audiencePreference || "both";
  const messaging = aboutMessaging[audience];

  // Calculate years since distributor joined
  const getYearsJoined = (createdAt: Date) => {
    const now = new Date();
    const joined = new Date(createdAt);
    const years = now.getFullYear() - joined.getFullYear();
    return years > 0 ? years : 0;
  };

  if (variant === "corporate") {
    return (
      <section id="about" className="py-20 bg-white">
        <div className="container max-w-optive mx-auto px-6">
          <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-sm font-semibold text-apex-navy uppercase tracking-wider mb-4">
                Why Apex
              </span>
              <h2 className="text-4xl md:text-5xl font-heading font-semibold text-apex-dark mb-6">
                {messaging.heading}
              </h2>
              <p className="text-lg text-apex-gray leading-relaxed mb-6">
                {messaging.paragraph1}
              </p>
              <p className="text-lg text-apex-gray leading-relaxed mb-8">
                {messaging.paragraph2}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <AnimatedCounter target={stats?.activeMembers || 54} prefix="$" suffix="M" />
                  <p className="text-sm text-apex-gray mt-2 font-medium">Avg Lifetime Coverage</p>
                </div>
                <div>
                  <AnimatedCounter target={stats?.countries || 160} suffix="M" />
                  <p className="text-sm text-apex-gray mt-2 font-medium">Policies Nationwide</p>
                </div>
                <div>
                  <AnimatedCounter target={stats?.memberEarnings || 693} prefix="$" suffix="B" />
                  <p className="text-sm text-apex-gray mt-2 font-medium">Industry Size</p>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-apex-navy/10 to-apex-dark/10 rounded-2xl overflow-hidden relative">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/flag-waving.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              {/* Decorative Element */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-apex-navy rounded-full opacity-20 blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  // Replicated variant
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container max-w-optive mx-auto px-6">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-sm font-semibold text-apex-navy uppercase tracking-wider mb-4">
              Your Partner
            </span>
            <h2 className="text-4xl md:text-5xl font-heading font-semibold text-apex-dark mb-6">
              Why {distributor?.firstName} Chose Apex
            </h2>
            <p className="text-lg text-apex-gray leading-relaxed mb-8">
              {distributor?.bio ||
                `${distributor?.firstName} joined Apex Affinity Group to break free from the traditional insurance grind.
                Here, you own your book of business, access industry-leading life insurance rates through 3Mark Financial,
                and build wealth through team growth—not just personal sales. It's insurance, reimagined for your success.`
              }
            </p>

            {/* Team Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-apex-bg rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-apex-navy rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-heading font-bold text-apex-dark">
                      {teamStats?.totalTeamSize || 0}
                    </div>
                    <p className="text-sm text-apex-gray font-medium">Team Members</p>
                  </div>
                </div>
              </div>

              <div className="bg-apex-bg rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-apex-navy rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-heading font-bold text-apex-dark">
                      {teamStats?.directEnrollees || 0}
                    </div>
                    <p className="text-sm text-apex-gray font-medium">Direct Enrollees</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Join Date */}
            {distributor?.createdAt && (
              <div className="flex items-center gap-3 text-apex-gray">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Member since {new Date(distributor.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </span>
              </div>
            )}
          </motion.div>

          {/* Right Column: Distributor Photo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            {distributor?.photoUrl ? (
              <div className="relative">
                <div className="w-80 h-80 sm:w-96 sm:h-96 rounded-2xl overflow-hidden border-4 border-apex-navy shadow-2xl">
                  <img
                    src={distributor.photoUrl}
                    alt={`${distributor.firstName} ${distributor.lastName}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-apex-navy rounded-full p-6 shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-80 h-80 sm:w-96 sm:h-96 rounded-2xl bg-gradient-to-br from-apex-navy to-apex-navy-dark flex items-center justify-center text-white text-8xl font-heading font-bold shadow-2xl border-4 border-white/20">
                {distributor?.firstName[0]}{distributor?.lastName[0]}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
