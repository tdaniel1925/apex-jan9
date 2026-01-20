/**
 * Webhook Signature Validator
 * Phase 2 - Issue #22: Verify webhook signatures to prevent spoofing
 */

import crypto from 'crypto';

export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate webhook signature using HMAC-SHA256
 * @param payload - Raw request body as string
 * @param signature - Signature from webhook header
 * @param secret - Webhook secret key
 * @param algorithm - Hash algorithm (default: sha256)
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): WebhookValidationResult {
  if (!payload || !signature || !secret) {
    return {
      valid: false,
      error: 'Missing required parameters for webhook validation',
    };
  }

  try {
    // Generate expected signature
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    // Constant-time comparison to prevent timing attacks
    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    return { valid };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Signature validation failed',
    };
  }
}

/**
 * Validate SmartOffice webhook signature
 * SmartOffice uses X-SmartOffice-Signature header with HMAC-SHA256
 */
export function validateSmartOfficeWebhook(
  payload: string,
  signature: string
): WebhookValidationResult {
  const secret = process.env.SMARTOFFICE_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('SMARTOFFICE_WEBHOOK_SECRET not configured - webhook validation disabled');
    return { valid: true }; // Allow in development, but log warning
  }

  return validateWebhookSignature(payload, signature, secret);
}

/**
 * Validate Resend (email service) webhook signature
 * Resend uses svix-signature header format
 */
export function validateResendWebhook(
  payload: string,
  signatureHeader: string
): WebhookValidationResult {
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('RESEND_WEBHOOK_SECRET not configured - webhook validation disabled');
    return { valid: true };
  }

  // Parse svix signature format: "v1,signature1 v1,signature2"
  const signatures = signatureHeader.split(' ').map(s => s.split(',')[1]);

  for (const sig of signatures) {
    if (!sig) continue;
    const result = validateWebhookSignature(payload, sig, secret);
    if (result.valid) {
      return { valid: true };
    }
  }

  return {
    valid: false,
    error: 'No valid signature found in header',
  };
}

/**
 * Validate timestamp to prevent replay attacks
 * @param timestamp - Unix timestamp from webhook
 * @param toleranceSeconds - How old the webhook can be (default: 5 minutes)
 */
export function validateWebhookTimestamp(
  timestamp: number,
  toleranceSeconds: number = 300
): WebhookValidationResult {
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;

  if (age > toleranceSeconds) {
    return {
      valid: false,
      error: `Webhook timestamp too old (${age}s > ${toleranceSeconds}s)`,
    };
  }

  if (age < -toleranceSeconds) {
    return {
      valid: false,
      error: 'Webhook timestamp is in the future',
    };
  }

  return { valid: true };
}

/**
 * Extract raw body from Next.js request for signature validation
 */
export async function getRawBody(request: Request): Promise<string> {
  const text = await request.text();
  return text;
}
