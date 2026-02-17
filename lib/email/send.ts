// Email sending functions using Resend
// Handles welcome emails and drip campaign emails

import { Resend } from "resend";
import { env } from "@/lib/env";
import { render } from "@react-email/render";
import { WelcomeEmail } from "./templates/welcome";
import { DripEmailTemplate } from "./templates/drip";
import { newcomerTrack, licensedAgentTrack, type DripEmail } from "./drip-content";
import { db } from "@/lib/db/client";
import { emailTemplates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const resend = new Resend(env.RESEND_API_KEY);

interface SendWelcomeEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  username: string;
  sponsorName?: string;
  distributorId: string;
}

interface SendDripEmailParams {
  to: string;
  firstName: string;
  licenseStatus: "licensed" | "not_licensed";
  step: number;
  distributorId: string;
}

/**
 * Send welcome email immediately after signup
 */
export async function sendWelcomeEmail(params: SendWelcomeEmailParams) {
  "use server";

  try {
    const unsubscribeUrl = `${env.NEXT_PUBLIC_APP_URL}/unsubscribe?id=${params.distributorId}`;

    const html = await render(
      WelcomeEmail({
        firstName: params.firstName,
        lastName: params.lastName,
        username: params.username,
        sponsorName: params.sponsorName,
        unsubscribeUrl,
      })
    );

    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: params.to,
      subject: `Welcome to Apex Affinity Group, ${params.firstName}!`,
      html,
    });

    if (error) {
      console.error("Failed to send welcome email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Welcome email error:", error);
    return { success: false, error: "Failed to send welcome email" };
  }
}

/**
 * Send drip campaign email based on step and license status
 */
export async function sendDripEmail(params: SendDripEmailParams) {
  "use server";

  try {
    // Check for custom template in database first
    const templateType = params.licenseStatus === "licensed" ? "drip_licensed" : "drip_newcomer";

    const [customTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(
        and(
          eq(emailTemplates.templateType, templateType),
          eq(emailTemplates.step, params.step),
          eq(emailTemplates.isActive, true)
        )
      )
      .limit(1);

    let emailContent: DripEmail;

    if (customTemplate) {
      // Use custom template from database
      emailContent = {
        step: params.step,
        subject: customTemplate.subject,
        previewText: customTemplate.previewText,
        content: {
          heading: customTemplate.heading,
          paragraphs: customTemplate.paragraphs as string[],
          tips: customTemplate.tips as string[] | undefined,
          callToAction: customTemplate.callToAction as { text: string; url: string } | undefined,
        },
      };
    } else {
      // Use default content from drip-content.ts
      const track = params.licenseStatus === "licensed" ? licensedAgentTrack : newcomerTrack;
      const defaultContent = track[params.step - 1];

      if (!defaultContent) {
        return { success: false, error: `Invalid step: ${params.step}` };
      }

      emailContent = defaultContent;
    }

    const unsubscribeUrl = `${env.NEXT_PUBLIC_APP_URL}/unsubscribe?id=${params.distributorId}`;

    const html = await render(
      DripEmailTemplate({
        firstName: params.firstName,
        email: emailContent,
        unsubscribeUrl,
      })
    );

    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: params.to,
      subject: emailContent.subject,
      html,
    });

    if (error) {
      console.error("Failed to send drip email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Drip email error:", error);
    return { success: false, error: "Failed to send drip email" };
  }
}

/**
 * Get the next drip email send date (3 days from now)
 */
export function getNextDripSendDate(): Date {
  const now = new Date();
  now.setDate(now.getDate() + 3); // Add 3 days
  return now;
}

/**
 * Get drip email content for preview/testing
 */
export function getDripEmailContent(
  licenseStatus: "licensed" | "not_licensed",
  step: number
): DripEmail | null {
  const track = licenseStatus === "licensed" ? licensedAgentTrack : newcomerTrack;
  return track[step - 1] || null;
}
