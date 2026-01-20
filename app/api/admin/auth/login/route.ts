/**
 * Admin Login API
 * POST /api/admin/auth/login - Authenticate admin user
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { loginAdminUser } from '@/lib/auth/admin-rbac';
import { ApiErrors, apiSuccess, handleZodError } from '@/lib/api/response';
import { applyRateLimit } from '@/lib/middleware/rate-limit';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  // Apply rate limiting (5 requests per 15 minutes)
  const rateLimitResult = await applyRateLimit(request, 'admin_login');
  if ('status' in rateLimitResult) {
    return rateLimitResult; // Rate limit exceeded
  }

  try {
    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { email, password } = parseResult.data;

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Attempt login
    const result = await loginAdminUser(email, password, ipAddress, userAgent);

    if (!result.success) {
      return ApiErrors.unauthorized(result.error || 'Invalid credentials');
    }

    // Return token and user info
    return apiSuccess({
      token: result.token,
      expiresAt: result.expiresAt?.toISOString(),
      user: {
        id: result.user!.id,
        email: result.user!.email,
        first_name: result.user!.first_name,
        last_name: result.user!.last_name,
        roles: result.user!.roles.map((r) => ({
          id: r.id,
          name: r.name,
          display_name: r.display_name,
          level: r.level,
        })),
        permissions: result.user!.permissions,
      },
    });
  } catch (error) {
    console.error('Error in admin login:', error);
    return ApiErrors.internal();
  }
}
