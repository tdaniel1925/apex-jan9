// SPEC: OPTIVE REDESIGN > Process Section
// SOURCE: index.html lines 741-884

"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Grid, Users, DollarSign, BookOpen } from "lucide-react";

interface ProcessSectionProps {
  variant: "corporate" | "replicated";
  distributorName?: string;
}

interface ProcessStep {
  number: number;
  title: string;
  description: string;
  icon: typeof ArrowRight;
}

export function ProcessSection({ variant, distributorName }: ProcessSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Define steps based on variant
  const corporateSteps: ProcessStep[] = [
    {
      number: 1,
      title: "Sign Up",
      description: "Choose your sponsor and create your account",
      icon: ArrowRight,
    },
    {
      number: 2,
      title: "Get Placed",
      description: "Automatic placement in our 5×7 forced matrix",
      icon: Grid,
    },
    {
      number: 3,
      title: "Build Team",
      description: "Share your replicated site and grow your organization",
      icon: Users,
    },
    {
      number: 4,
      title: "Earn Income",
      description: "Receive commissions as your team grows",
      icon: DollarSign,
    },
  ];

  const replicatedSteps: ProcessStep[] = [
    {
      number: 1,
      title: "Learn",
      description: "Explore this page and discover the Apex opportunity",
      icon: BookOpen,
    },
    {
      number: 2,
      title: "Sign Up",
      description: `Click the 'Join ${distributorName || "My"} Team' button above`,
      icon: ArrowRight,
    },
    {
      number: 3,
      title: "Get Placed",
      description: `You'll be automatically placed in ${distributorName ? `${distributorName}'s` : "my"} matrix`,
      icon: Grid,
    },
    {
      number: 4,
      title: "Start Building",
      description: `${distributorName || "I"} will guide you to success with training and support`,
      icon: Users,
    },
  ];

  const steps = variant === "corporate" ? corporateSteps : replicatedSteps;
  const sectionId = variant === "corporate" ? "how-it-works" : "how-to-join";
  const sectionTitle = variant === "corporate" ? "How Apex Works" : `How to Join ${distributorName || "My Team"}`;

  return (
    <section id={sectionId} className="py-20 bg-white">
      <div className="container max-w-optive mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block text-sm font-semibold text-apex-navy uppercase tracking-wider mb-4">
              {variant === "corporate" ? "The Process" : "Getting Started"}
            </span>
            <h2 className="text-4xl md:text-5xl font-heading font-semibold text-apex-dark mb-6">
              {sectionTitle}
            </h2>
            <p className="text-lg text-apex-gray max-w-3xl mx-auto">
              {variant === "corporate"
                ? "Four simple steps to start building your income stream with Apex Affinity Group"
                : `Join ${distributorName ? `${distributorName}'s` : "my"} team in four easy steps and start your journey to financial freedom`
              }
            </p>
          </motion.div>
        </div>

        {/* Process Steps */}
        <div ref={ref} className="relative">
          {/* Desktop: Horizontal Layout with Connecting Line */}
          <div className="hidden lg:block">
            {/* Connecting Line */}
            <div className="absolute top-16 left-0 right-0 h-1 bg-apex-navy/20">
              <motion.div
                className="h-full bg-apex-navy"
                initial={{ width: 0 }}
                animate={isInView ? { width: "100%" } : {}}
                transition={{ duration: 1.5, delay: 0.3 }}
              />
            </div>

            {/* Steps */}
            <div className="grid grid-cols-4 gap-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    className="relative"
                  >
                    {/* Number Circle */}
                    <div className="relative z-10 w-32 h-32 mx-auto mb-6 bg-white rounded-full border-4 border-apex-navy flex items-center justify-center shadow-lg">
                      <span className="text-5xl font-heading font-bold text-apex-navy">
                        {step.number}
                      </span>
                    </div>

                    {/* Icon Badge */}
                    <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2 z-20 w-12 h-12 bg-apex-navy rounded-full flex items-center justify-center shadow-md">
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-xl font-heading font-semibold text-apex-dark mb-3">
                        {step.title}
                      </h3>
                      <p className="text-apex-gray leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Mobile/Tablet: Vertical Layout with Connecting Line */}
          <div className="lg:hidden">
            <div className="relative pl-12">
              {/* Connecting Line */}
              <div className="absolute left-6 top-0 bottom-0 w-1 bg-apex-navy/20">
                <motion.div
                  className="w-full bg-apex-navy"
                  initial={{ height: 0 }}
                  animate={isInView ? { height: "100%" } : {}}
                  transition={{ duration: 1.5, delay: 0.3 }}
                />
              </div>

              {/* Steps */}
              <div className="space-y-12">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.number}
                      initial={{ opacity: 0, x: -30 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.5, delay: index * 0.15 }}
                      className="relative"
                    >
                      {/* Number Circle */}
                      <div className="absolute -left-12 top-0 w-12 h-12 bg-white rounded-full border-4 border-apex-navy flex items-center justify-center shadow-lg z-10">
                        <span className="text-2xl font-heading font-bold text-apex-navy">
                          {step.number}
                        </span>
                      </div>

                      {/* Icon Badge */}
                      <div className="absolute -left-6 top-8 w-8 h-8 bg-apex-navy rounded-full flex items-center justify-center shadow-md z-10">
                        <Icon className="w-4 h-4 text-white" />
                      </div>

                      {/* Content */}
                      <div className="bg-apex-bg rounded-xl p-6">
                        <h3 className="text-xl font-heading font-semibold text-apex-dark mb-3">
                          {step.title}
                        </h3>
                        <p className="text-apex-gray leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-apex-gray mb-6">
            {variant === "corporate"
              ? "Ready to start your journey with Apex?"
              : `Ready to join ${distributorName ? `${distributorName}'s` : "my"} team?`
            }
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 pr-14 rounded bg-gradient-to-r from-apex-navy via-apex-navy-dark to-apex-navy bg-[length:200%_auto] hover:bg-right-center text-white text-lg font-semibold transition-all duration-400 group shadow-lg hover:shadow-xl relative"
          >
            Get Started Today
            <span className="absolute right-6 transition-transform duration-400 group-hover:translate-x-0.5">
              <ArrowRight className="w-5 h-5" />
            </span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
