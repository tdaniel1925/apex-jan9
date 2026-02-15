// SPEC: WF-3 > Contact Form Submission
// DEP-MAP: FEATURE 2 > UI: Contact Form > SERVER

"use server";

import { headers } from "next/headers";
import { contactFormSchema, type ContactFormData } from "@/lib/types/schemas";
import {
  createContactSubmission,
  countRecentContactSubmissions,
  logActivity,
  createNotification,
} from "@/lib/db/queries";
import { sendContactNotificationEmail } from "@/lib/email";
import { rateLimit, RateLimits, getClientIp } from "@/lib/rate-limit";

/**
 * Server action result
 */
interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Submit contact form from a replicated page
 */
export async function submitContactForm(
  distributorId: string,
  distributorData: {
    firstName: string;
    lastName: string;
    email: string;
  },
  data: ContactFormData
): Promise<ActionResult> {
  try {
    // Validate input
    const validation = contactFormSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Invalid form data",
      };
    }

    const validData = validation.data;

    // Get client IP for rate limiting
    const headersList = await headers();
    const clientIp = getClientIp(headersList);

    // Rate limiting: 3 submissions per hour per IP
    const rateLimitResult = await rateLimit({
      ...RateLimits.CONTACT_FORM,
      identifier: clientIp,
    });

    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: "You've submitted too many messages. Please wait a moment before trying again.",
      };
    }

    // Save to database
    const submissionId = await createContactSubmission({
      distributorId,
      visitorName: validData.name,
      visitorEmail: validData.email,
      visitorPhone: validData.phone || null,
      message: validData.message,
      status: "new",
      ipAddress: clientIp,
    });

    // Send email notification to distributor (non-blocking)
    sendContactNotificationEmail(
      {
        id: distributorId,
        firstName: distributorData.firstName,
        lastName: distributorData.lastName,
        email: distributorData.email,
      } as any,
      {
        visitorName: validData.name,
        visitorEmail: validData.email,
        visitorPhone: validData.phone || null,
        message: validData.message,
      }
    ).catch((error) => {
      console.error("Failed to send contact notification email:", error);
      // Don't fail the submission if email fails
    });

    // Create in-app notification
    await createNotification({
      distributorId,
      type: "new_contact",
      title: "New Contact Message",
      body: `${validData.name} sent you a message`,
      actionUrl: "/dashboard/contacts",
    });

    // Log activity
    await logActivity({
      actorId: null,
      actorType: "visitor",
      action: "contact.submitted",
      targetId: submissionId,
      targetType: "contact_submission",
      metadata: {
        distributorId,
        visitorEmail: validData.email,
      },
      ipAddress: clientIp,
    });

    return {
      success: true,
      message: `Thank you! Your message has been sent to ${distributorData.firstName} ${distributorData.lastName}.`,
    };
  } catch (error) {
    console.error("Contact form submission error:", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
