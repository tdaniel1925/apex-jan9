// SPEC: OPTIVE REDESIGN > Services Section
// SOURCE: index.html lines 327-482

"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Grid,
  TrendingUp,
  Globe,
  GraduationCap,
  DollarSign,
  Users,
  Bot,
  type LucideIcon,
} from "lucide-react";

interface ServiceCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

const services: ServiceCard[] = [
  {
    icon: Globe,
    title: "7 Premier Life Insurance Carriers",
    description:
      "Columbus Life, AIG, F&G, Mutual of Omaha, National Life Group, Symetra, North American. Sell term, whole life, and IUL.",
  },
  {
    icon: DollarSign,
    title: "50-100% Commissions Paid Direct",
    description:
      "Start at 50-60%, advance to 85-100% at MGA level. Commissions paid directly by carriers—we don't take a cut.",
  },
  {
    icon: Bot,
    title: "CoPilot AI-Powered CRM",
    description:
      "Optional ($49-$199/mo): AI lead scoring, automated follow-up, multi-carrier quoting, real-time objection handling. Mobile access.",
  },
  {
    icon: Users,
    title: "6-Generation Override Structure",
    description:
      "15% on Gen 1, 5% on Gen 2, 3% on Gen 3, 2% on Gen 4, 1% on Gen 5, 0.5% on Gen 6. Or go solo—recruiting is optional.",
  },
  {
    icon: TrendingUp,
    title: "Free to Join, No Monthly Fees",
    description:
      "Zero application fees. No desk fees. No monthly charges. Fast Start Bonus up to $750. Rank bonuses from $25 to $20,000.",
  },
  {
    icon: GraduationCap,
    title: "Complete Training & Mentorship",
    description:
      "Fast-start training, proven scripts, weekly coaching with top producers, 1-on-1 mentor, 100+ video library. Selling within week 1.",
  },
];

export function ServicesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="opportunity" className="py-20 bg-apex-bg">
      <div className="container max-w-optive mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block text-sm font-semibold text-apex-navy uppercase tracking-wider mb-4">
              What You Get
            </span>
            <h2 className="text-4xl md:text-5xl font-heading font-semibold text-apex-dark mb-6">
              Why Apex Makes Sense for You
            </h2>
            <p className="text-lg text-apex-gray max-w-3xl mx-auto">
              Stop settling for commissions that disappear and territories that limit you.
              Here's what changes when you join Apex.
            </p>
          </motion.div>
        </div>

        {/* Service Cards Grid */}
        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white rounded-xl p-8 h-full shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-apex-navy/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-apex-navy transition-colors duration-300">
                    <Icon className="w-8 h-8 text-apex-navy group-hover:text-white transition-colors duration-300" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-heading font-semibold text-apex-dark mb-4">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-apex-gray leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
