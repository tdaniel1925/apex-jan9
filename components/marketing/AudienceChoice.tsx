// SPEC: Audience Segmentation > Audience Choice Component
// Hero section choice buttons for visitor self-selection

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users, GraduationCap } from "lucide-react";
import { useAudiencePreference } from "@/hooks/useAudiencePreference";
import { useState } from "react";

export function AudienceChoice() {
  const { preference, setPreference, isLoading } = useAudiencePreference();
  const [isExiting, setIsExiting] = useState(false);

  const handleChoice = (choice: "agents" | "newcomers") => {
    setPreference(choice);
    setIsExiting(true);
  };

  // Don't show during loading or if preference already exists
  if (isLoading || preference) return null;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-4xl mx-auto my-12"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-heading font-semibold text-white mb-3">
              Which Best Describes You?
            </h3>
            <p className="text-gray-200 text-lg">
              Choose your path to see content tailored for you
            </p>
          </div>

          {/* Choice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Licensed Agent Card */}
            <motion.button
              onClick={() => handleChoice("agents")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white/95 backdrop-blur-md border-2 border-apex-navy/20 rounded-2xl p-8 text-left transition-all hover:bg-white hover:border-apex-navy shadow-xl"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-apex-navy rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl">👔</span>
              </div>

              {/* Content */}
              <h4 className="text-2xl font-heading font-bold text-apex-navy mb-3">
                I'm a Licensed Agent
              </h4>
              <p className="text-apex-dark/80 leading-relaxed">
                Show me how Apex gives me better rates, full ownership, and the
                AI-powered tools to grow my business.
              </p>

              {/* Arrow indicator */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 bg-apex-navy rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </motion.button>

            {/* Newcomer Card */}
            <motion.button
              onClick={() => handleChoice("newcomers")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white/95 backdrop-blur-md border-2 border-apex-red/20 rounded-2xl p-8 text-left transition-all hover:bg-white hover:border-apex-red shadow-xl"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-apex-red rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl">🌟</span>
              </div>

              {/* Content */}
              <h4 className="text-2xl font-heading font-bold text-apex-navy mb-3">
                I'm New to Insurance
              </h4>
              <p className="text-apex-dark/80 leading-relaxed">
                Show me the career path, training, and income opportunity to
                build my future in insurance.
              </p>

              {/* Arrow indicator */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 bg-apex-red rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
