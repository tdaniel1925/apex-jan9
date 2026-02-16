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

  // Corporate testimonials - Real success stories
  const corporateTestimonials: Testimonial[] = [
    {
      name: "Bill Propper",
      photo: null,
      quote: "As CEO of Apex Affinity Group, I've witnessed firsthand the transformative power of our platform. The 5×7 forced matrix system isn't just innovative—it's revolutionary. We've created a level playing field where every member, regardless of experience, can achieve financial independence through our proven systems and unwavering support.",
      rating: 5,
      location: "CEO, Apex Affinity Group",
    },
    {
      name: "Darrell Wolfe",
      photo: null,
      quote: "The Apex Affinity Group opportunity changed my life. The combination of cutting-edge technology, proven business strategies, and genuine community support created the perfect environment for success. The spillover from the forced matrix means you're building wealth even while you sleep. This isn't just a business—it's a movement.",
      rating: 5,
      location: "Top Distributor",
    },
    {
      name: "Johnathon Bunch",
      photo: null,
      quote: "What sets Apex apart is the integrity and vision behind it. The forced matrix system ensures everyone benefits, not just the early adopters. I've seen countless lives transformed through this opportunity. The training, the tools, and the team culture are second to none. If you're serious about financial freedom, Apex is your vehicle.",
      rating: 5,
      location: "Senior Leader",
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
