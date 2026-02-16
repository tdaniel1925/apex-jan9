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
  type LucideIcon,
} from "lucide-react";

interface ServiceCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

const services: ServiceCard[] = [
  {
    icon: Grid,
    title: "5×7 Forced Matrix",
    description:
      "Guaranteed placement in our proven matrix system that builds your team automatically",
  },
  {
    icon: TrendingUp,
    title: "Spillover Benefits",
    description:
      "Benefit from your upline's recruiting efforts as new members fill your matrix",
  },
  {
    icon: Globe,
    title: "Professional Website",
    description:
      "Get your own replicated marketing page with a personal URL to share",
  },
  {
    icon: GraduationCap,
    title: "Training & Support",
    description:
      "Comprehensive training and ongoing mentorship to ensure your success",
  },
  {
    icon: DollarSign,
    title: "Residual Income",
    description:
      "Build long-term wealth with passive income from your growing organization",
  },
  {
    icon: Users,
    title: "Supportive Community",
    description:
      "Join a network of successful entrepreneurs who support each other",
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
              The Opportunity
            </span>
            <h2 className="text-4xl md:text-5xl font-heading font-semibold text-apex-dark mb-6">
              Why Choose Apex
            </h2>
            <p className="text-lg text-apex-gray max-w-3xl mx-auto">
              Experience the advantages of a system designed for your success. From automated
              placement to ongoing support, we provide everything you need to thrive.
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
