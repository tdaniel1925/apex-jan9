// SPEC: FEATURE 6 > Email Notifications (Resend)
// Resend client configuration

import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is not set");
}

if (!process.env.EMAIL_FROM) {
  throw new Error("EMAIL_FROM environment variable is not set");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = process.env.EMAIL_FROM;
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Apex Affinity Group";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
