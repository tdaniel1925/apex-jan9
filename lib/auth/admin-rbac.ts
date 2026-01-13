/**
 * Admin RBAC Service
 * Handles admin authentication, authorization, and user management
 */

import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';

// ============================================
// TYPES
// ============================================

export type AdminRoleLevel = 'super_admin' | 'department_head' | 'staff';

export interface AdminUser {
  id: string;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AdminRole {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  level: AdminRoleLevel;
  is_system: boolean;
  created_at: string;
}

export interface AdminPermission {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
}

export interface AdminSession {
  id: string;
  user_id: string;
  token_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  created_at: string;
}

export interface AdminUserWithRoles extends AdminUser {
  roles: AdminRole[];
  permissions: string[];
}

export interface CreateAdminUserInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_ids: string[];
}

export interface UpdateAdminUserInput {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  is_active?: boolean;
  role_ids?: string[];
}

// Type helpers for Supabase queries (tables not in generated types yet)
type DbResult<T> = { data: T | null; error: { message: string } | null };
type DbArrayResult<T> = { data: T[] | null; error: { message: string } | null };
type DbCountResult = { count: number | null; error: { message: string } | null };

// ============================================
// PASSWORD UTILITIES
// ============================================

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
// SESSION MANAGEMENT
// ============================================

const SESSION_DURATION_HOURS = 24;

function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createAdminSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ token: string; expiresAt: Date }> {
  const supabase = await createServerSupabaseClient();
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  const { error } = await supabase.from('admin_sessions' as never).insert({
    user_id: userId,
    token_hash: tokenHash,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    expires_at: expiresAt.toISOString(),
  } as never) as DbResult<unknown>;

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  // Update last login
  await supabase
    .from('admin_users' as never)
    .update({ last_login_at: new Date().toISOString() } as never)
    .eq('id', userId);

  return { token, expiresAt };
}

export async function verifyAdminSession(token: string): Promise<AdminUserWithRoles | null> {
  const supabase = await createServerSupabaseClient();
  const tokenHash = hashToken(token);

  // Find valid session
  const { data: session, error: sessionError } = await supabase
    .from('admin_sessions' as never)
    .select('*')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .single() as DbResult<AdminSession>;

  if (sessionError || !session) {
    return null;
  }

  // Get user with roles
  const user = await getAdminUserWithRoles(session.user_id);

  if (!user || !user.is_active) {
    return null;
  }

  return user;
}

export async function invalidateAdminSession(token: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const tokenHash = hashToken(token);

  await supabase.from('admin_sessions' as never).delete().eq('token_hash', tokenHash);
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.from('admin_sessions' as never).delete().eq('user_id', userId);
}

// Clean up expired sessions (call periodically)
export async function cleanupExpiredSessions(): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('admin_sessions' as never)
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select() as DbArrayResult<AdminSession>;

  if (error) {
    console.error('Failed to cleanup sessions:', error);
    return 0;
  }

  return data?.length || 0;
}

// ============================================
// USER MANAGEMENT
// ============================================

export async function getAdminUserWithRoles(userId: string): Promise<AdminUserWithRoles | null> {
  const supabase = await createServerSupabaseClient();

  // Get user
  const { data: user, error: userError } = await supabase
    .from('admin_users' as never)
    .select('*')
    .eq('id', userId)
    .single() as DbResult<AdminUser>;

  if (userError || !user) {
    return null;
  }

  // Get user's roles
  const { data: userRoles } = await supabase
    .from('admin_user_roles' as never)
    .select('role_id')
    .eq('user_id', userId) as DbArrayResult<{ role_id: string }>;

  const roleIds = userRoles?.map((ur) => ur.role_id) || [];

  // Get role details
  let roles: AdminRole[] = [];
  if (roleIds.length > 0) {
    const { data: rolesData } = await supabase
      .from('admin_roles' as never)
      .select('*')
      .in('id', roleIds) as DbArrayResult<AdminRole>;
    roles = rolesData || [];
  }

  // Get permissions for these roles
  let permissions: string[] = [];
  if (roleIds.length > 0) {
    const { data: rolePermissions } = await supabase
      .from('admin_role_permissions' as never)
      .select('permission_id')
      .in('role_id', roleIds) as DbArrayResult<{ permission_id: string }>;

    const permissionIds = rolePermissions?.map((rp) => rp.permission_id) || [];

    if (permissionIds.length > 0) {
      const { data: permissionsData } = await supabase
        .from('admin_permissions' as never)
        .select('code')
        .in('id', permissionIds) as DbArrayResult<{ code: string }>;
      permissions = permissionsData?.map((p) => p.code) || [];
    }
  }

  // Remove password_hash from response
  const { password_hash, ...userWithoutPassword } = user;

  return {
    ...userWithoutPassword,
    roles,
    permissions,
  } as AdminUserWithRoles;
}

export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('admin_users' as never)
    .select('*')
    .eq('email', email.toLowerCase())
    .single() as DbResult<AdminUser>;

  if (error || !data) {
    return null;
  }

  return data;
}

export async function createAdminUser(
  input: CreateAdminUserInput,
  createdBy?: string
): Promise<AdminUser> {
  const supabase = await createServerSupabaseClient();

  // Hash password
  const passwordHash = await hashPassword(input.password);

  // Create user
  const { data: user, error: userError } = await supabase
    .from('admin_users' as never)
    .insert({
      email: input.email.toLowerCase(),
      password_hash: passwordHash,
      first_name: input.first_name,
      last_name: input.last_name,
      phone: input.phone || null,
      created_by: createdBy || null,
    } as never)
    .select()
    .single() as DbResult<AdminUser>;

  if (userError || !user) {
    throw new Error(`Failed to create user: ${userError?.message}`);
  }

  // Assign roles
  if (input.role_ids.length > 0) {
    const roleAssignments = input.role_ids.map((roleId) => ({
      user_id: user.id,
      role_id: roleId,
      assigned_by: createdBy || null,
    }));

    await supabase.from('admin_user_roles' as never).insert(roleAssignments as never);
  }

  // Remove password_hash from response
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword as AdminUser;
}

export async function updateAdminUser(
  userId: string,
  input: UpdateAdminUserInput,
  updatedBy?: string
): Promise<AdminUser> {
  const supabase = await createServerSupabaseClient();

  // Build update object
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.email !== undefined) {
    updates.email = input.email.toLowerCase();
  }
  if (input.password !== undefined) {
    updates.password_hash = await hashPassword(input.password);
  }
  if (input.first_name !== undefined) {
    updates.first_name = input.first_name;
  }
  if (input.last_name !== undefined) {
    updates.last_name = input.last_name;
  }
  if (input.phone !== undefined) {
    updates.phone = input.phone;
  }
  if (input.is_active !== undefined) {
    updates.is_active = input.is_active;
  }

  // Update user
  const { data: user, error: userError } = await supabase
    .from('admin_users' as never)
    .update(updates as never)
    .eq('id', userId)
    .select()
    .single() as DbResult<AdminUser>;

  if (userError || !user) {
    throw new Error(`Failed to update user: ${userError?.message}`);
  }

  // Update roles if provided
  if (input.role_ids !== undefined) {
    // Remove existing roles
    await supabase.from('admin_user_roles' as never).delete().eq('user_id', userId);

    // Add new roles
    if (input.role_ids.length > 0) {
      const roleAssignments = input.role_ids.map((roleId) => ({
        user_id: userId,
        role_id: roleId,
        assigned_by: updatedBy || null,
      }));

      await supabase.from('admin_user_roles' as never).insert(roleAssignments as never);
    }
  }

  // Remove password_hash from response
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword as AdminUser;
}

export async function deleteAdminUser(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();

  // Invalidate all sessions first
  await invalidateAllUserSessions(userId);

  // Delete user (cascades to roles and sessions)
  const { error } = await supabase.from('admin_users' as never).delete().eq('id', userId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

export async function listAdminUsers(options?: {
  is_active?: boolean;
  role_id?: string;
}): Promise<AdminUserWithRoles[]> {
  const supabase = await createServerSupabaseClient();

  // Build query
  let query = supabase.from('admin_users' as never).select('*');

  if (options?.is_active !== undefined) {
    query = query.eq('is_active', options.is_active);
  }

  const { data: users, error } = await query.order('created_at', { ascending: false }) as DbArrayResult<AdminUser>;

  if (error || !users) {
    return [];
  }

  // Get roles for all users
  const userIds = users.map((u) => u.id);
  const { data: allUserRoles } = await supabase
    .from('admin_user_roles' as never)
    .select('user_id, role_id')
    .in('user_id', userIds) as DbArrayResult<{ user_id: string; role_id: string }>;

  const roleIds = [...new Set(allUserRoles?.map((ur) => ur.role_id) || [])];

  let roles: AdminRole[] = [];
  if (roleIds.length > 0) {
    const { data: rolesData } = await supabase
      .from('admin_roles' as never)
      .select('*')
      .in('id', roleIds) as DbArrayResult<AdminRole>;
    roles = rolesData || [];
  }

  // Get all permissions
  let rolePermissionMap = new Map<string, string[]>();
  if (roleIds.length > 0) {
    const { data: rolePermissions } = await supabase
      .from('admin_role_permissions' as never)
      .select('role_id, permission_id')
      .in('role_id', roleIds) as DbArrayResult<{ role_id: string; permission_id: string }>;

    const permissionIds = [...new Set(rolePermissions?.map((rp) => rp.permission_id) || [])];

    if (permissionIds.length > 0) {
      const { data: permissions } = await supabase
        .from('admin_permissions' as never)
        .select('id, code')
        .in('id', permissionIds) as DbArrayResult<{ id: string; code: string }>;

      // Build role permission map
      rolePermissions?.forEach((rp) => {
        const perm = permissions?.find((p) => p.id === rp.permission_id);
        if (perm) {
          const existing = rolePermissionMap.get(rp.role_id) || [];
          rolePermissionMap.set(rp.role_id, [...existing, perm.code]);
        }
      });
    }
  }

  // Filter by role if specified
  let filteredUsers = users;
  if (options?.role_id) {
    const userIdsWithRole = allUserRoles
      ?.filter((ur) => ur.role_id === options.role_id)
      .map((ur) => ur.user_id);
    filteredUsers = users.filter((u) => userIdsWithRole?.includes(u.id));
  }

  // Map users with their roles and permissions
  return filteredUsers.map((user) => {
    const userRoleIds = allUserRoles?.filter((ur) => ur.user_id === user.id).map((ur) => ur.role_id) || [];
    const userRoles = roles.filter((r) => userRoleIds.includes(r.id));
    const userPermissions = new Set<string>();
    userRoleIds.forEach((roleId) => {
      const perms = rolePermissionMap.get(roleId) || [];
      perms.forEach((p) => userPermissions.add(p));
    });

    // Remove password_hash
    const { password_hash, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      roles: userRoles,
      permissions: [...userPermissions],
    } as AdminUserWithRoles;
  });
}

// ============================================
// PERMISSION CHECKING
// ============================================

export function hasPermission(user: AdminUserWithRoles, permission: string): boolean {
  // Super admins have all permissions
  if (user.roles.some((r) => r.level === 'super_admin')) {
    return true;
  }

  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: AdminUserWithRoles, permissions: string[]): boolean {
  if (user.roles.some((r) => r.level === 'super_admin')) {
    return true;
  }

  return permissions.some((p) => user.permissions.includes(p));
}

export function hasAllPermissions(user: AdminUserWithRoles, permissions: string[]): boolean {
  if (user.roles.some((r) => r.level === 'super_admin')) {
    return true;
  }

  return permissions.every((p) => user.permissions.includes(p));
}

export function isSuperAdmin(user: AdminUserWithRoles): boolean {
  return user.roles.some((r) => r.level === 'super_admin');
}

// ============================================
// ROLE MANAGEMENT
// ============================================

export async function listRoles(): Promise<AdminRole[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('admin_roles' as never)
    .select('*')
    .order('level', { ascending: true })
    .order('display_name', { ascending: true }) as DbArrayResult<AdminRole>;

  if (error) {
    console.error('Failed to list roles:', error);
    return [];
  }

  return data || [];
}

export async function getRoleWithPermissions(roleId: string): Promise<(AdminRole & { permissions: AdminPermission[] }) | null> {
  const supabase = await createServerSupabaseClient();

  const { data: role, error: roleError } = await supabase
    .from('admin_roles' as never)
    .select('*')
    .eq('id', roleId)
    .single() as DbResult<AdminRole>;

  if (roleError || !role) {
    return null;
  }

  const { data: rolePermissions } = await supabase
    .from('admin_role_permissions' as never)
    .select('permission_id')
    .eq('role_id', roleId) as DbArrayResult<{ permission_id: string }>;

  const permissionIds = rolePermissions?.map((rp) => rp.permission_id) || [];

  let permissions: AdminPermission[] = [];
  if (permissionIds.length > 0) {
    const { data: permissionsData } = await supabase
      .from('admin_permissions' as never)
      .select('*')
      .in('id', permissionIds) as DbArrayResult<AdminPermission>;
    permissions = permissionsData || [];
  }

  return {
    ...role,
    permissions,
  };
}

export async function listPermissions(): Promise<AdminPermission[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('admin_permissions' as never)
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true }) as DbArrayResult<AdminPermission>;

  if (error) {
    console.error('Failed to list permissions:', error);
    return [];
  }

  return data || [];
}

// ============================================
// AUDIT LOGGING
// ============================================

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'magic_link_requested' | 'magic_link_login';

export async function logAdminAction(params: {
  userId: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const supabase = await createServerSupabaseClient();

  await supabase.from('admin_audit_log' as never).insert({
    user_id: params.userId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId || null,
    old_values: params.oldValues || null,
    new_values: params.newValues || null,
    ip_address: params.ipAddress || null,
    user_agent: params.userAgent || null,
  } as never);
}

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: unknown;
  new_values: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export async function getAuditLog(options?: {
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: AuditAction;
  limit?: number;
  offset?: number;
}): Promise<{ entries: Array<AuditLogEntry & { user?: { id: string; email: string; first_name: string; last_name: string } }>; total: number }> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('admin_audit_log' as never)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.userId) {
    query = query.eq('user_id', options.userId);
  }
  if (options?.resourceType) {
    query = query.eq('resource_type', options.resourceType);
  }
  if (options?.resourceId) {
    query = query.eq('resource_id', options.resourceId);
  }
  if (options?.action) {
    query = query.eq('action', options.action);
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query as unknown as { data: AuditLogEntry[] | null; error: { message: string } | null; count: number | null };

  if (error) {
    console.error('Failed to get audit log:', error);
    return { entries: [], total: 0 };
  }

  // Get user details for entries
  const userIds = [...new Set(data?.map((e) => e.user_id).filter(Boolean) as string[])];

  let userMap = new Map<string, { id: string; email: string; first_name: string; last_name: string }>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('admin_users' as never)
      .select('id, email, first_name, last_name')
      .in('id', userIds) as DbArrayResult<{ id: string; email: string; first_name: string; last_name: string }>;

    userMap = new Map(users?.map((u) => [u.id, u]) || []);
  }

  const entries = data?.map((entry) => ({
    ...entry,
    user: entry.user_id ? userMap.get(entry.user_id) : undefined,
  })) || [];

  return { entries, total: count || 0 };
}

// ============================================
// AUTHENTICATION FLOW
// ============================================

export interface LoginResult {
  success: boolean;
  token?: string;
  expiresAt?: Date;
  user?: AdminUserWithRoles;
  error?: string;
}

export async function loginAdminUser(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> {
  // Get user by email
  const user = await getAdminUserByEmail(email);

  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }

  if (!user.is_active) {
    return { success: false, error: 'Account is disabled' };
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash || '');

  if (!isValid) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Create session
  const { token, expiresAt } = await createAdminSession(user.id, ipAddress, userAgent);

  // Get full user with roles
  const fullUser = await getAdminUserWithRoles(user.id);

  // Log login
  await logAdminAction({
    userId: user.id,
    action: 'login',
    resourceType: 'session',
    ipAddress,
    userAgent,
  });

  return {
    success: true,
    token,
    expiresAt,
    user: fullUser!,
  };
}

export async function logoutAdminUser(
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  // Get user from session before invalidating
  const user = await verifyAdminSession(token);

  // Invalidate session
  await invalidateAdminSession(token);

  // Log logout
  if (user) {
    await logAdminAction({
      userId: user.id,
      action: 'logout',
      resourceType: 'session',
      ipAddress,
      userAgent,
    });
  }
}

// ============================================
// MAGIC LINK AUTHENTICATION
// ============================================

const MAGIC_LINK_EXPIRY_MINUTES = 15;

interface MagicLinkResult {
  success: boolean;
  token?: string;
  error?: string;
}

interface MagicLinkVerifyResult extends LoginResult {
  // Inherits success, token, expiresAt, user, error
}

/**
 * Create a magic link token for passwordless admin login
 */
export async function createMagicLink(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<MagicLinkResult> {
  const supabase = await createServerSupabaseClient();

  // Get user by email
  const user = await getAdminUserByEmail(email);

  if (!user) {
    // Don't reveal if email exists or not for security
    return { success: true }; // Silently succeed
  }

  if (!user.is_active) {
    return { success: true }; // Silently succeed
  }

  // Generate token
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any existing magic links for this user
  await supabase
    .from('admin_magic_links' as never)
    .delete()
    .eq('user_id', user.id);

  // Create new magic link
  const { error } = await supabase.from('admin_magic_links' as never).insert({
    user_id: user.id,
    token_hash: tokenHash,
    email: email.toLowerCase(),
    expires_at: expiresAt.toISOString(),
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  } as never) as DbResult<unknown>;

  if (error) {
    console.error('Failed to create magic link:', error);
    return { success: false, error: 'Failed to create magic link' };
  }

  // Log the action
  await logAdminAction({
    userId: user.id,
    action: 'magic_link_requested',
    resourceType: 'auth',
    ipAddress,
    userAgent,
  });

  return { success: true, token };
}

/**
 * Verify a magic link token and create a session
 */
export async function verifyMagicLink(
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<MagicLinkVerifyResult> {
  const supabase = await createServerSupabaseClient();
  const tokenHash = hashToken(token);

  // Find valid magic link
  const { data: magicLink, error: findError } = await supabase
    .from('admin_magic_links' as never)
    .select('*')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .is('used_at', null)
    .single() as DbResult<{
      id: string;
      user_id: string;
      email: string;
      expires_at: string;
      used_at: string | null;
    }>;

  if (findError || !magicLink) {
    return { success: false, error: 'Invalid or expired magic link' };
  }

  // Mark as used
  await supabase
    .from('admin_magic_links' as never)
    .update({ used_at: new Date().toISOString() } as never)
    .eq('id', magicLink.id);

  // Get user
  const user = await getAdminUserWithRoles(magicLink.user_id);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (!user.is_active) {
    return { success: false, error: 'Account is disabled' };
  }

  // Create session
  const { token: sessionToken, expiresAt } = await createAdminSession(
    user.id,
    ipAddress,
    userAgent
  );

  // Log login via magic link
  await logAdminAction({
    userId: user.id,
    action: 'magic_link_login',
    resourceType: 'session',
    ipAddress,
    userAgent,
  });

  return {
    success: true,
    token: sessionToken,
    expiresAt,
    user,
  };
}
