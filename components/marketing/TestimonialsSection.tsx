// SPEC: OPTIVE REDESIGN > Testimonials Section
// SOURCE: index.html lines 1746-1863

"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { Star } from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface TestimonialsSectionProps {
  variant: "corporate" | "replicated";
  distributorName?: string;
}

interface Testimonial {
  name: string;
  photo: string | null;
  quote: string;
  rating: number;
  location?: string;
}

export function TestimonialsSection({ variant, distributorName }: TestimonialsSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Corporate testimonials
  const corporateTestimonials: Testimonial[] = [
    {
      name: "Sarah Johnson",
      photo: null,
      quote: "Joining Apex was the best decision I ever made. The support and training are incredible! Within 6 months, I built a thriving team and started earning residual income.",
      rating: 5,
      location: "Austin, TX",
    },
    {
      name: "Michael Chen",
      photo: null,
      quote: "The 5×7 matrix system really works. I benefited from spillover within my first month, and my team keeps growing. The community here is amazing!",
      rating: 5,
      location: "Seattle, WA",
    },
    {
      name: "Jennifer Martinez",
      photo: null,
      quote: "I was skeptical at first, but the proven system and mentorship changed everything. I'm now earning more than my previous full-time job while working part-time.",
      rating: 5,
      location: "Miami, FL",
    },
    {
      name: "David Thompson",
      photo: null,
      quote: "As a former teacher, I never thought I'd find financial freedom. Apex gave me the tools, training, and support to build something real. Forever grateful!",
      rating: 5,
      location: "Denver, CO",
    },
    {
      name: "Lisa Anderson",
      photo: null,
      quote: "The replicated website made it so easy to share the opportunity. My team loves the system, and I love the passive income it generates. Highly recommend!",
      rating: 5,
      location: "Phoenix, AZ",
    },
  ];

  // Replicated testimonials
  const replicatedTestimonials: Testimonial[] = [
    {
      name: "Rachel Kim",
      photo: null,
      quote: `${distributorName} was an amazing sponsor! They helped me understand the system and were always available for questions. I'm so glad I joined their team.`,
      rating: 5,
    },
    {
      name: "James Wilson",
      photo: null,
      quote: `Thanks to ${distributorName}'s guidance, I was able to build my team quickly. The training materials they shared were invaluable. Great mentor!`,
      rating: 5,
    },
    {
      name: "Amanda Rodriguez",
      photo: null,
      quote: `${distributorName} goes above and beyond to help their team succeed. I've learned so much and my income is growing every month. Best decision ever!`,
      rating: 5,
    },
    {
      name: "Kevin Park",
      photo: null,
      quote: `I was new to network marketing, but ${distributorName} made it easy. Their step-by-step approach helped me get started fast. Highly recommend joining their team!`,
      rating: 5,
    },
  ];

  const testimonials = variant === "corporate" ? corporateTestimonials : replicatedTestimonials;
  const heading = variant === "corporate" ? "What Our Members Say" : `What ${distributorName}'s Team Says`;

  return (
    <section id="testimonials" className="py-20 bg-apex-dark text-white">
      <div className="container max-w-optive mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block text-sm font-semibold text-apex-navy uppercase tracking-wider mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-heading font-semibold mb-6">
              {heading}
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              {variant === "corporate"
                ? "Hear from real members who transformed their lives with Apex"
                : `See what others are saying about working with ${distributorName}`
              }
            </p>
          </motion.div>
        </div>

        {/* Testimonials Carousel */}
        <div ref={ref}>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, pauseOnMouseEnter: true, disableOnInteraction: false }}
            breakpoints={{
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="testimonials-swiper pb-12"
          >
            {testimonials.map((testimonial, index) => (
              <SwiperSlide key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-8 h-full border border-white/20"
                >
                  {/* Rating Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-gray-200 leading-relaxed mb-6 italic">
                    "{testimonial.quote}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4 mt-auto">
                    {/* Photo or Initials */}
                    {testimonial.photo ? (
                      <img
                        src={testimonial.photo}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-apex-navy flex items-center justify-center text-white font-heading font-bold text-lg">
                        {testimonial.name.split(" ").map(n => n[0]).join("")}
                      </div>
                    )}

                    <div>
                      <div className="font-heading font-semibold text-white">
                        {testimonial.name}
                      </div>
                      {testimonial.location && (
                        <div className="text-sm text-gray-400">
                          {testimonial.location}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Custom Swiper Styles */}
      <style jsx global>{`
        .testimonials-swiper .swiper-button-next,
        .testimonials-swiper .swiper-button-prev {
          color: #097C7D;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          width: 44px;
          height: 44px;
          border-radius: 50%;
        }

        .testimonials-swiper .swiper-button-next:after,
        .testimonials-swiper .swiper-button-prev:after {
          font-size: 20px;
        }

        .testimonials-swiper .swiper-pagination-bullet {
          background: #097C7D;
          opacity: 0.5;
        }

        .testimonials-swiper .swiper-pagination-bullet-active {
          opacity: 1;
        }
      `}</style>
    </section>
  );
}
