/**
 * Admin Magic Link Verification API
 * GET /api/admin/auth/magic-link/verify - Verify magic link and create session
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLink } from '@/lib/auth/admin-rbac';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!token) {
      return NextResponse.redirect(`${appUrl}/admin-login?error=missing_token`);
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Verify magic link
    const result = await verifyMagicLink(token, ipAddress, userAgent);

    if (!result.success) {
      const errorMessage = encodeURIComponent(result.error || 'Invalid or expired link');
      return NextResponse.redirect(`${appUrl}/admin-login?error=${errorMessage}`);
    }

    // Redirect to admin dashboard with token
    // The token will be picked up by the client and stored
    const response = NextResponse.redirect(`${appUrl}/admin?token=${result.token}`);

    return response;
  } catch (error) {
    console.error('Error verifying magic link:', error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${appUrl}/admin-login?error=verification_failed`);
  }
}
