/**
 * Admin Magic Link API
 * POST /api/admin/auth/magic-link - Send a magic link to admin email
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createMagicLink } from '@/lib/auth/admin-rbac';
import { ApiErrors, apiSuccess, handleZodError } from '@/lib/api/response';
import { Resend } from 'resend';

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { email } = parseResult.data;

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create magic link
    const result = await createMagicLink(email, ipAddress, userAgent);

    if (!result.success) {
      return ApiErrors.internal(result.error);
    }

    // If we have a token, send the email
    if (result.token) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const magicLinkUrl = `${appUrl}/api/admin/auth/magic-link/verify?token=${result.token}`;

      // Send email via Resend
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey && resendApiKey !== 'your-resend-api-key') {
        const resend = new Resend(resendApiKey);

        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Apex Affinity Group <noreply@theapexway.net>',
            to: email,
            subject: 'Sign in to Apex Admin Portal',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
                  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 32px;">
                      <img src="${appUrl}/images/logo-w.png" alt="Apex Affinity Group" style="height: 48px; width: auto;">
                    </div>

                    <!-- Card -->
                    <div style="background-color: #1e293b; border-radius: 12px; padding: 40px; border: 1px solid #334155;">
                      <div style="text-align: center;">
                        <div style="width: 64px; height: 64px; background-color: rgba(251, 191, 36, 0.1); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                          <span style="font-size: 32px;">🔐</span>
                        </div>

                        <h1 style="color: #f8fafc; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">
                          Admin Sign In Request
                        </h1>

                        <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                          Click the button below to securely sign in to the Apex Admin Portal. This link expires in 15 minutes.
                        </p>

                        <!-- CTA Button -->
                        <a href="${magicLinkUrl}" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          Sign In to Admin Portal
                        </a>

                        <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
                          If you didn't request this email, you can safely ignore it.
                        </p>
                      </div>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; margin-top: 32px;">
                      <p style="color: #64748b; font-size: 12px; margin: 0;">
                        Apex Affinity Group<br>
                        1600 Highway 6 Ste 400, Sugar Land, TX 77478
                      </p>
                    </div>
                  </div>
                </body>
              </html>
            `,
          });
        } catch (emailError) {
          console.error('Failed to send magic link email:', emailError);
          // Don't fail the request - still return success for security
        }
      } else {
        // In development, log the magic link
        console.log('Magic link URL:', magicLinkUrl);
      }
    }

    // Always return success to prevent email enumeration
    return apiSuccess({
      message: 'If an account exists with this email, a magic link has been sent.',
    });
  } catch (error) {
    console.error('Error in magic link request:', error);
    return ApiErrors.internal();
  }
}
