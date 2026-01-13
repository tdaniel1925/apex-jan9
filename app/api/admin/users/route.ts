/**
 * Admin Users API
 * GET /api/admin/users - List admin users
 * POST /api/admin/users - Create admin user
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  listAdminUsers,
  createAdminUser,
  logAdminAction
} from '@/lib/auth/admin-rbac';
import { requireAdminPermission } from '@/lib/auth/admin-middleware';
import { ApiErrors, apiSuccess, handleZodError } from '@/lib/api/response';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(20).optional(),
  role_ids: z.array(z.string().uuid()).min(1, 'At least one role is required'),
});

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAdminPermission(request, 'users.view');
    if (error) return error;

    // Get query params
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');
    const roleId = searchParams.get('role_id');

    const users = await listAdminUsers({
      is_active: isActive !== null ? isActive === 'true' : undefined,
      role_id: roleId || undefined,
    });

    // Log view action
    await logAdminAction({
      userId: user!.id,
      action: 'view',
      resourceType: 'admin_users',
    });

    return apiSuccess({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        phone: u.phone,
        avatar_url: u.avatar_url,
        is_active: u.is_active,
        last_login_at: u.last_login_at,
        created_at: u.created_at,
        roles: u.roles.map((r) => ({
          id: r.id,
          name: r.name,
          display_name: r.display_name,
          level: r.level,
        })),
      })),
    });
  } catch (error) {
    console.error('Error listing admin users:', error);
    return ApiErrors.internal();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAdminPermission(request, 'users.manage');
    if (error) return error;

    const body = await request.json();
    const parseResult = createUserSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const newUser = await createAdminUser(parseResult.data, user!.id);

    // Log create action
    await logAdminAction({
      userId: user!.id,
      action: 'create',
      resourceType: 'admin_user',
      resourceId: newUser.id,
      newValues: {
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
      },
    });

    return apiSuccess({ user: newUser }, 201);
  } catch (error) {
    console.error('Error creating admin user:', error);

    // Check for duplicate email
    if (error instanceof Error && error.message.includes('duplicate')) {
      return ApiErrors.conflict('Email already exists');
    }

    return ApiErrors.internal();
  }
}
