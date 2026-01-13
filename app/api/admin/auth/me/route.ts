/**
 * Admin Me API
 * GET /api/admin/auth/me - Get current admin user info
 */

import { NextRequest } from 'next/server';
import { verifyAdminSession } from '@/lib/auth/admin-rbac';
import { ApiErrors, apiSuccess } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return ApiErrors.unauthorized('No session token provided');
    }

    // Verify session and get user
    const user = await verifyAdminSession(token);

    if (!user) {
      return ApiErrors.unauthorized('Invalid or expired session');
    }

    return apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        last_login_at: user.last_login_at,
        roles: user.roles.map((r) => ({
          id: r.id,
          name: r.name,
          display_name: r.display_name,
          level: r.level,
        })),
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error('Error in admin me:', error);
    return ApiErrors.internal();
  }
}
