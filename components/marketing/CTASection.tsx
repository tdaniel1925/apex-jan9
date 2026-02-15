// SPEC: SPEC-PAGES > Corporate Marketing Page > CTA Section
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 1 > UI: CTA Section

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl sm:text-2xl mb-8 text-blue-100">
            Join thousands of successful distributors building their future with Apex
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/join">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6"
              >
                Join Now - It's Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Learn More
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl font-bold mb-2">✓</div>
              <h3 className="font-semibold mb-2">No Hidden Fees</h3>
              <p className="text-sm text-blue-100">
                Transparent pricing with no surprise charges
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl font-bold mb-2">✓</div>
              <h3 className="font-semibold mb-2">Proven System</h3>
              <p className="text-sm text-blue-100">
                Battle-tested methods that deliver results
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl font-bold mb-2">✓</div>
              <h3 className="font-semibold mb-2">Full Support</h3>
              <p className="text-sm text-blue-100">
                Expert guidance every step of the way
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
