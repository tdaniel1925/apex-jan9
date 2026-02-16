// Path choice section - Links to dedicated pages for each audience
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PathChoice() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container max-w-optive mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-apex-navy mb-4">
            Choose Your Path
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how Apex can benefit you based on where you are in your insurance journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* New to Insurance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/new-to-insurance"
              className="group block bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border-2 border-transparent hover:border-apex-red"
            >
              <div className="w-16 h-16 bg-apex-red rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl">🌟</span>
              </div>
              <h3 className="text-2xl font-heading font-bold text-apex-navy mb-3">
                New to Insurance
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Start your career with complete training, mentorship, and a proven system
                to build wealth in the insurance industry.
              </p>
              <div className="flex items-center text-apex-red font-semibold group-hover:gap-3 transition-all">
                Learn More
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>

          {/* Licensed Agent Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link
              href="/licensed-agents"
              className="group block bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border-2 border-transparent hover:border-apex-navy"
            >
              <div className="w-16 h-16 bg-apex-navy rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl">👔</span>
              </div>
              <h3 className="text-2xl font-heading font-bold text-apex-navy mb-3">
                Licensed Agent
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Own your book. Access top rates through 3Mark Financial. Use AI-powered
                tools to grow your business and build lasting wealth.
              </p>
              <div className="flex items-center text-apex-navy font-semibold group-hover:gap-3 transition-all">
                Learn More
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
