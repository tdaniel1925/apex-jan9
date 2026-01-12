/**
 * Resend Email Client Configuration
 * Following CodeBakers patterns from 06b-email.md
 */

import { Resend } from 'resend';

// Validate required environment variables
if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing required environment variable: RESEND_API_KEY');
}

// Initialize Resend client
export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'Apex Affinity Group <noreply@apexaffinity.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@apexaffinity.com',
} as const;
