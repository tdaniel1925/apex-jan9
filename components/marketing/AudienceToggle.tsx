// SPEC: Audience Segmentation > Audience Toggle Component
// Sticky toggle bar for switching between agent/newcomer views

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAudiencePreference } from "@/hooks/useAudiencePreference";
import { useEffect, useState } from "react";

export function AudienceToggle() {
  const { preference, setPreference } = useAudiencePreference();
  const [isVisible, setIsVisible] = useState(false);

  // Show toggle after scroll or after choice is made
  useEffect(() => {
    if (preference) {
      // Show immediately if preference exists
      setIsVisible(true);
    } else {
      // Show after scrolling down
      const handleScroll = () => {
        if (window.scrollY > 300) {
          setIsVisible(true);
        }
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [preference]);

  // Don't render if no preference set
  if (!preference) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-0 right-0 z-40 flex justify-center"
        >
          <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-full px-6 py-3 border border-gray-200">
            <div className="flex items-center gap-3">
              {/* Label */}
              <span className="text-sm font-medium text-gray-600">
                Viewing as:
              </span>

              {/* Toggle Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPreference("agents")}
                  className={`
                    px-4 py-2 rounded-full text-sm font-semibold transition-all
                    ${
                      preference === "agents"
                        ? "bg-apex-navy text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                  `}
                >
                  👔 Agent
                </button>

                <button
                  onClick={() => setPreference("newcomers")}
                  className={`
                    px-4 py-2 rounded-full text-sm font-semibold transition-all
                    ${
                      preference === "newcomers"
                        ? "bg-apex-red text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                  `}
                >
                  🌟 Newcomer
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
