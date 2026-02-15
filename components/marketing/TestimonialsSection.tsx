// SPEC: SPEC-PAGES > Corporate Marketing Page > Testimonials Section
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 1 > UI: Testimonials Section

"use client";

import { useRef } from "react";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Diamond Distributor",
    content:
      "Joining Apex was the best decision I've ever made. In just 18 months, I've built a team of over 200 distributors and achieved financial freedom I never thought possible.",
    image: "/images/testimonial-1.jpg",
  },
  {
    name: "Michael Chen",
    role: "Platinum Distributor",
    content:
      "The support and training at Apex are unmatched. The automated placement system helped me build a strong organization quickly, and the community is incredibly supportive.",
    image: "/images/testimonial-2.jpg",
  },
  {
    name: "Lisa Martinez",
    role: "Gold Distributor",
    content:
      "I was skeptical at first, but the proven system and amazing mentorship changed my life. I'm now earning more than my previous full-time job while working from home.",
    image: "/images/testimonial-3.jpg",
  },
  {
    name: "David Thompson",
    role: "Silver Distributor",
    content:
      "The spillover benefit is real! I've received team members from my upline's success, which accelerated my growth. This is a business opportunity that truly works.",
    image: "/images/testimonial-4.jpg",
  },
];

export function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Success Stories
          </h2>
          <p className="text-xl text-blue-100">
            Hear from real people who transformed their lives with Apex
          </p>
        </div>

        <div className="relative">
          {/* Navigation Buttons */}
          <div className="hidden md:flex justify-end gap-2 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Testimonials Carousel */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-start"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 h-full">
                  <Quote className="h-10 w-10 text-blue-200 mb-4" />
                  <p className="text-lg mb-6 leading-relaxed">{testimonial.content}</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-blue-200">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Scroll Indicator */}
          <div className="md:hidden text-center mt-4 text-sm text-blue-200">
            Swipe to see more →
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
