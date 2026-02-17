// Email sending functions using Resend
// Handles welcome emails and drip campaign emails

"use server";

import { Resend } from "resend";
import { env } from "@/lib/env";
import { render } from "@react-email/render";
import { WelcomeEmail } from "./templates/welcome";
import { DripEmailTemplate } from "./templates/drip";
import { newcomerTrack, licensedAgentTrack, type DripEmail } from "./drip-content";

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
  try {
    const unsubscribeUrl = `${env.NEXT_PUBLIC_APP_URL}/unsubscribe?id=${params.distributorId}`;

    const html = render(
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
  try {
    // Select the correct track based on license status
    const track = params.licenseStatus === "licensed" ? licensedAgentTrack : newcomerTrack;

    // Get the email content for this step (step is 1-indexed)
    const emailContent = track[params.step - 1];

    if (!emailContent) {
      return { success: false, error: `Invalid step: ${params.step}` };
    }

    const unsubscribeUrl = `${env.NEXT_PUBLIC_APP_URL}/unsubscribe?id=${params.distributorId}`;

    const html = render(
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
