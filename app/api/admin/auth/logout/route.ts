/**
 * Admin Logout API
 * POST /api/admin/auth/logout - End admin session
 */

import { NextRequest } from 'next/server';
import { logoutAdminUser } from '@/lib/auth/admin-rbac';
import { ApiErrors, apiSuccess } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return ApiErrors.unauthorized('No session token provided');
    }

    // Get IP and user agent for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Logout (invalidate session)
    await logoutAdminUser(token, ipAddress, userAgent);

    return apiSuccess({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in admin logout:', error);
    return ApiErrors.internal();
  }
}
