// SPEC: OPTIVE REDESIGN > Contact Section
// SOURCE: contact.html form section
// BACKEND: Wired to submitContactForm server action

"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormData } from "@/lib/types/schemas";
import { submitContactForm } from "@/lib/actions/contact";
import { toast } from "sonner";
import { Mail, Phone, User, MessageSquare, Loader2 } from "lucide-react";

interface ContactSectionProps {
  distributorId: string;
  distributorName: string;
  distributorEmail: string;
}

export function ContactSection({
  distributorId,
  distributorName,
  distributorEmail,
}: ContactSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormData) {
    setIsSubmitting(true);

    try {
      const result = await submitContactForm(
        distributorId,
        {
          firstName: distributorName.split(" ")[0] || distributorName,
          lastName: distributorName.split(" ").slice(1).join(" ") || "",
          email: distributorEmail,
        },
        data
      );

      if (result.success) {
        toast.success(result.message || `Message sent to ${distributorName}!`);
        reset();
      } else {
        if (result.error?.includes("too many")) {
          toast.error("Please wait before sending another message.", {
            description: "You can send up to 3 messages per hour.",
          });
        } else {
          toast.error(result.error || "Something went wrong. Please try again.");
        }
      }
    } catch (error) {
      // Error handled
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container max-w-4xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block text-sm font-semibold text-apex-navy uppercase tracking-wider mb-4">
              Get In Touch
            </span>
            <h2 className="text-4xl md:text-5xl font-heading font-semibold text-apex-dark mb-6">
              Contact {distributorName}
            </h2>
            <p className="text-lg text-apex-gray max-w-2xl mx-auto">
              Have questions? Ready to get started? Send {distributorName.split(" ")[0] || distributorName} a message and they'll get back to you as soon as possible.
            </p>
          </motion.div>
        </div>

        {/* Contact Form */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="bg-apex-bg rounded-2xl p-8 md:p-12 shadow-lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-apex-dark mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-apex-gray">
                  <User className="w-5 h-5" />
                </div>
                <input
                  {...register("name")}
                  type="text"
                  id="name"
                  placeholder="John Doe"
                  className={`w-full pl-12 pr-4 py-3 bg-white border rounded-lg text-apex-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-apex-navy transition-all ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-2 text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-apex-dark mb-2">
                Your Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-apex-gray">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  placeholder="john@example.com"
                  className={`w-full pl-12 pr-4 py-3 bg-white border rounded-lg text-apex-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-apex-navy transition-all ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-apex-dark mb-2">
                Your Phone <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-apex-gray">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  {...register("phone")}
                  type="tel"
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  className={`w-full pl-12 pr-4 py-3 bg-white border rounded-lg text-apex-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-apex-navy transition-all ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-2 text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-apex-dark mb-2">
                Your Message <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-4 text-apex-gray">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <textarea
                  {...register("message")}
                  id="message"
                  rows={6}
                  placeholder="Tell us about your goals and how we can help..."
                  className={`w-full pl-12 pr-4 py-3 bg-white border rounded-lg text-apex-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-apex-navy transition-all resize-none ${
                    errors.message ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.message && (
                <p className="mt-2 text-sm text-red-500">{errors.message.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-apex-navy via-apex-navy-dark to-apex-navy bg-[length:200%_auto] hover:bg-right-center text-white font-semibold py-4 rounded-lg transition-all duration-400 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Message...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send Message to {distributorName.split(" ")[0] || distributorName}
                </>
              )}
            </button>

            {/* Privacy Notice */}
            <p className="text-sm text-center text-apex-gray">
              By submitting this form, you agree to be contacted by {distributorName} about Apex Affinity Group.
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
