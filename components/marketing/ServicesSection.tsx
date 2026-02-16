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
    icon: Bot,
    title: "AI Business Growth Co-Pilot",
    description:
      "The ONLY insurance company with AI that automates lead nurture, follow-ups, and communication. Work smarter, not harder.",
  },
  {
    icon: DollarSign,
    title: "Own Your Book of Business",
    description:
      "You keep what you build—100% ownership with no company buybacks. Your clients stay yours forever.",
  },
  {
    icon: TrendingUp,
    title: "Industry-Leading Rates",
    description:
      "Access top life insurance carriers through 3Mark Financial. Better rates mean easier sales and happier clients.",
  },
  {
    icon: Users,
    title: "Team-Powered Growth",
    description:
      "Earn from your team's success, not just your own sales. Build lasting wealth while you sleep.",
  },
  {
    icon: Globe,
    title: "Done-For-You Marketing",
    description:
      "Get your own professional website and marketing tools. Share your link and watch qualified leads come in.",
  },
  {
    icon: GraduationCap,
    title: "Training That Works",
    description:
      "Brand new or seasoned pro—get the training and support you need. We'll help you succeed from day one.",
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
