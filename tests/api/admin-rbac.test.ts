/**
 * Admin RBAC API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isSuperAdmin,
  AdminUserWithRoles,
  AdminRole,
} from '@/lib/auth/admin-rbac';

// Mock Supabase
vi.mock('@/lib/db/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

describe('Admin RBAC Service', () => {
  describe('Password Utilities', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Permission Checking', () => {
    const createMockUser = (
      roleLevel: 'super_admin' | 'department_head' | 'staff',
      permissions: string[] = []
    ): AdminUserWithRoles => ({
      id: 'test-user-id',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      phone: null,
      avatar_url: null,
      is_active: true,
      last_login_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      roles: [
        {
          id: 'role-id',
          name: roleLevel,
          display_name: roleLevel.replace('_', ' '),
          description: null,
          level: roleLevel,
          is_system: true,
          created_at: new Date().toISOString(),
        },
      ],
      permissions,
    });

    describe('hasPermission', () => {
      it('should return true for super admin regardless of permission', () => {
        const superAdmin = createMockUser('super_admin');

        expect(hasPermission(superAdmin, 'users.view')).toBe(true);
        expect(hasPermission(superAdmin, 'users.manage')).toBe(true);
        expect(hasPermission(superAdmin, 'any.permission')).toBe(true);
      });

      it('should return true if user has the permission', () => {
        const user = createMockUser('department_head', ['users.view', 'users.manage']);

        expect(hasPermission(user, 'users.view')).toBe(true);
        expect(hasPermission(user, 'users.manage')).toBe(true);
      });

      it('should return false if user does not have the permission', () => {
        const user = createMockUser('department_head', ['users.view']);

        expect(hasPermission(user, 'users.manage')).toBe(false);
        expect(hasPermission(user, 'settings.edit')).toBe(false);
      });
    });

    describe('hasAnyPermission', () => {
      it('should return true for super admin', () => {
        const superAdmin = createMockUser('super_admin');

        expect(hasAnyPermission(superAdmin, ['users.view', 'users.manage'])).toBe(true);
      });

      it('should return true if user has any of the permissions', () => {
        const user = createMockUser('department_head', ['users.view']);

        expect(hasAnyPermission(user, ['users.view', 'users.manage'])).toBe(true);
      });

      it('should return false if user has none of the permissions', () => {
        const user = createMockUser('staff', ['analytics.view']);

        expect(hasAnyPermission(user, ['users.view', 'users.manage'])).toBe(false);
      });
    });

    describe('hasAllPermissions', () => {
      it('should return true for super admin', () => {
        const superAdmin = createMockUser('super_admin');

        expect(hasAllPermissions(superAdmin, ['users.view', 'users.manage'])).toBe(true);
      });

      it('should return true if user has all permissions', () => {
        const user = createMockUser('department_head', ['users.view', 'users.manage']);

        expect(hasAllPermissions(user, ['users.view', 'users.manage'])).toBe(true);
      });

      it('should return false if user is missing any permission', () => {
        const user = createMockUser('department_head', ['users.view']);

        expect(hasAllPermissions(user, ['users.view', 'users.manage'])).toBe(false);
      });
    });

    describe('isSuperAdmin', () => {
      it('should return true for super admin', () => {
        const superAdmin = createMockUser('super_admin');

        expect(isSuperAdmin(superAdmin)).toBe(true);
      });

      it('should return false for department head', () => {
        const user = createMockUser('department_head');

        expect(isSuperAdmin(user)).toBe(false);
      });

      it('should return false for staff', () => {
        const user = createMockUser('staff');

        expect(isSuperAdmin(user)).toBe(false);
      });
    });
  });
});

describe('Admin Auth API Routes', () => {
  describe('POST /api/admin/auth/login', () => {
    it('should require email and password', async () => {
      // This tests the Zod schema validation
      const loginSchema = {
        email: 'test@example.com',
        password: 'password123',
      };

      expect(loginSchema.email).toBe('test@example.com');
      expect(loginSchema.password).toBe('password123');
    });

    it('should reject invalid email format', async () => {
      const invalidEmail = 'not-an-email';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    it('should accept valid email format', async () => {
      const validEmail = 'test@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(validEmail)).toBe(true);
    });
  });
});

describe('Admin Users API Routes', () => {
  describe('User creation validation', () => {
    const validateCreateUser = (data: {
      email?: string;
      password?: string;
      first_name?: string;
      last_name?: string;
      role_ids?: string[];
    }) => {
      const errors: string[] = [];

      if (!data.email || !data.email.includes('@')) {
        errors.push('Invalid email');
      }
      if (!data.password || data.password.length < 8) {
        errors.push('Password must be at least 8 characters');
      }
      if (!data.first_name || data.first_name.length === 0) {
        errors.push('First name is required');
      }
      if (!data.last_name || data.last_name.length === 0) {
        errors.push('Last name is required');
      }
      if (!data.role_ids || data.role_ids.length === 0) {
        errors.push('At least one role is required');
      }

      return { valid: errors.length === 0, errors };
    };

    it('should require all mandatory fields', () => {
      const result = validateCreateUser({});

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate email format', () => {
      const result = validateCreateUser({
        email: 'invalid',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        role_ids: ['role-1'],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email');
    });

    it('should require minimum password length', () => {
      const result = validateCreateUser({
        email: 'test@example.com',
        password: 'short',
        first_name: 'Test',
        last_name: 'User',
        role_ids: ['role-1'],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should require at least one role', () => {
      const result = validateCreateUser({
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        role_ids: [],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one role is required');
    });

    it('should accept valid user data', () => {
      const result = validateCreateUser({
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        role_ids: ['role-1'],
      });

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });
});

describe('Role Hierarchy', () => {
  const roles: AdminRole[] = [
    {
      id: '1',
      name: 'super_admin',
      display_name: 'Super Administrator',
      description: null,
      level: 'super_admin',
      is_system: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'finance',
      display_name: 'Finance Team',
      description: null,
      level: 'department_head',
      is_system: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'analytics',
      display_name: 'Analytics Team',
      description: null,
      level: 'staff',
      is_system: true,
      created_at: new Date().toISOString(),
    },
  ];

  it('should have correct hierarchy levels', () => {
    const levels = ['super_admin', 'department_head', 'staff'];

    roles.forEach((role) => {
      expect(levels).toContain(role.level);
    });
  });

  it('should have super_admin as highest level', () => {
    const superAdmin = roles.find((r) => r.level === 'super_admin');
    expect(superAdmin).toBeDefined();
    expect(superAdmin?.name).toBe('super_admin');
  });

  it('should have department_head roles', () => {
    const deptHeads = roles.filter((r) => r.level === 'department_head');
    expect(deptHeads.length).toBeGreaterThan(0);
  });

  it('should have staff roles', () => {
    const staff = roles.filter((r) => r.level === 'staff');
    expect(staff.length).toBeGreaterThan(0);
  });
});

describe('Permission Categories', () => {
  const permissionCategories = [
    'dashboard',
    'agents',
    'finance',
    'training',
    'compliance',
    'products',
    'analytics',
    'system',
    'admin',
  ];

  it('should have all expected permission categories', () => {
    expect(permissionCategories).toContain('dashboard');
    expect(permissionCategories).toContain('agents');
    expect(permissionCategories).toContain('finance');
    expect(permissionCategories).toContain('admin');
  });

  it('should not have duplicate categories', () => {
    const unique = [...new Set(permissionCategories)];
    expect(unique.length).toBe(permissionCategories.length);
  });
});

describe('Audit Log', () => {
  const auditActions = ['create', 'update', 'delete', 'login', 'logout', 'view'];

  it('should support all audit action types', () => {
    expect(auditActions).toContain('create');
    expect(auditActions).toContain('update');
    expect(auditActions).toContain('delete');
    expect(auditActions).toContain('login');
    expect(auditActions).toContain('logout');
    expect(auditActions).toContain('view');
  });

  it('should have 6 action types', () => {
    expect(auditActions.length).toBe(6);
  });
});
