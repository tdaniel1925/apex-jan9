/**
 * Admin User Detail API
 * GET /api/admin/users/[userId] - Get user details
 * PUT /api/admin/users/[userId] - Update user
 * DELETE /api/admin/users/[userId] - Delete user
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  getAdminUserWithRoles,
  updateAdminUser,
  deleteAdminUser,
  logAdminAction,
  isSuperAdmin
} from '@/lib/auth/admin-rbac';
import { requireAdminPermission } from '@/lib/auth/admin-middleware';
import { ApiErrors, apiSuccess, handleZodError } from '@/lib/api/response';

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  is_active: z.boolean().optional(),
  role_ids: z.array(z.string().uuid()).min(1).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { user, error } = await requireAdminPermission(request, 'users.view');
    if (error) return error;

    const targetUser = await getAdminUserWithRoles(userId);

    if (!targetUser) {
      return ApiErrors.notFound('User');
    }

    // Log view action
    await logAdminAction({
      userId: user!.id,
      action: 'view',
      resourceType: 'admin_user',
      resourceId: userId,
    });

    return apiSuccess({
      user: {
        id: targetUser.id,
        email: targetUser.email,
        first_name: targetUser.first_name,
        last_name: targetUser.last_name,
        phone: targetUser.phone,
        avatar_url: targetUser.avatar_url,
        is_active: targetUser.is_active,
        last_login_at: targetUser.last_login_at,
        created_at: targetUser.created_at,
        updated_at: targetUser.updated_at,
        roles: targetUser.roles.map((r) => ({
          id: r.id,
          name: r.name,
          display_name: r.display_name,
          level: r.level,
        })),
        permissions: targetUser.permissions,
      },
    });
  } catch (error) {
    console.error('Error getting admin user:', error);
    return ApiErrors.internal();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { user, error } = await requireAdminPermission(request, 'users.manage');
    if (error) return error;

    // Get target user first
    const targetUser = await getAdminUserWithRoles(userId);
    if (!targetUser) {
      return ApiErrors.notFound('User');
    }

    // Prevent non-super-admins from modifying super admins
    if (isSuperAdmin(targetUser) && !isSuperAdmin(user!)) {
      return ApiErrors.forbidden('Only super admins can modify super admin accounts');
    }

    // Prevent users from deactivating themselves
    const body = await request.json();
    if (body.is_active === false && userId === user!.id) {
      return ApiErrors.badRequest('You cannot deactivate your own account');
    }

    const parseResult = updateUserSchema.safeParse(body);
    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    // Store old values for audit
    const oldValues = {
      email: targetUser.email,
      first_name: targetUser.first_name,
      last_name: targetUser.last_name,
      is_active: targetUser.is_active,
      roles: targetUser.roles.map((r) => r.name),
    };

    const updatedUser = await updateAdminUser(userId, parseResult.data, user!.id);

    // Log update action
    await logAdminAction({
      userId: user!.id,
      action: 'update',
      resourceType: 'admin_user',
      resourceId: userId,
      oldValues,
      newValues: parseResult.data,
    });

    return apiSuccess({ user: updatedUser });
  } catch (error) {
    console.error('Error updating admin user:', error);

    if (error instanceof Error && error.message.includes('duplicate')) {
      return ApiErrors.conflict('Email already exists');
    }

    return ApiErrors.internal();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { user, error } = await requireAdminPermission(request, 'users.manage');
    if (error) return error;

    // Get target user first
    const targetUser = await getAdminUserWithRoles(userId);
    if (!targetUser) {
      return ApiErrors.notFound('User');
    }

    // Prevent deleting yourself
    if (userId === user!.id) {
      return ApiErrors.badRequest('You cannot delete your own account');
    }

    // Prevent non-super-admins from deleting super admins
    if (isSuperAdmin(targetUser) && !isSuperAdmin(user!)) {
      return ApiErrors.forbidden('Only super admins can delete super admin accounts');
    }

    // Log delete action before deletion
    await logAdminAction({
      userId: user!.id,
      action: 'delete',
      resourceType: 'admin_user',
      resourceId: userId,
      oldValues: {
        email: targetUser.email,
        first_name: targetUser.first_name,
        last_name: targetUser.last_name,
      },
    });

    await deleteAdminUser(userId);

    return apiSuccess({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return ApiErrors.internal();
  }
}
