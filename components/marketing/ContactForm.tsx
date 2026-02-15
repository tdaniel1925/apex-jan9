// SPEC: SPEC-PAGES > Replicated Distributor Page > Contact Form
// DEP-MAP: FEATURE 2 > UI: Contact Form

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { contactFormSchema, type ContactFormData } from "@/lib/types/schemas";
import { submitContactForm } from "@/lib/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ContactFormProps {
  distributorId: string;
  distributorName: string;
  distributorEmail: string;
}

export function ContactForm({
  distributorId,
  distributorName,
  distributorEmail,
}: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true);

      // Split distributor name for server action
      const nameParts = distributorName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "";

      const result = await submitContactForm(
        distributorId,
        {
          firstName,
          lastName,
          email: distributorEmail,
        },
        data
      );

      if (result.success) {
        toast.success(
          result.message ||
            `Message sent to ${distributorName}! They'll be in touch soon.`
        );
        reset();
      } else {
        toast.error(result.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      id="contact-form"
    >
      {/* Name */}
      <div>
        <Label htmlFor="name" className="text-sm font-medium">
          Your Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="John Smith"
          {...register("name")}
          className={errors.name ? "border-red-500" : ""}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email" className="text-sm font-medium">
          Your Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Phone (optional) */}
      <div>
        <Label htmlFor="phone" className="text-sm font-medium">
          Your Phone <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
          {...register("phone")}
          className={errors.phone ? "border-red-500" : ""}
          disabled={isSubmitting}
        />
        {errors.phone && (
          <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <Label htmlFor="message" className="text-sm font-medium">
          Message <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="message"
          placeholder="Tell us how we can help you..."
          rows={5}
          {...register("message")}
          className={errors.message ? "border-red-500" : ""}
          disabled={isSubmitting}
        />
        {errors.message && (
          <p className="text-sm text-red-500 mt-1">{errors.message.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Message"
        )}
      </Button>
    </form>
  );
}
