/**
 * Admin Settings API Tests
 * Tests for GET and PATCH /api/admin/settings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/admin/settings/route';
import { createMockAgent, createMockSupabaseClient, mockAdminUser } from '../../helpers/mocks';

// Mock the admin auth module
vi.mock('@/lib/auth/admin-auth', () => ({
  verifyAdmin: vi.fn(),
  forbiddenResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })),
  badRequestResponse: vi.fn((msg, details) => new Response(JSON.stringify({ error: msg, details }), { status: 400 })),
  serverErrorResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })),
}));

// Mock the supabase server module
vi.mock('@/lib/db/supabase-server', () => ({
  createAdminClient: vi.fn(),
}));

// Import mocked modules
import { verifyAdmin } from '@/lib/auth/admin-auth';
import { createAdminClient } from '@/lib/db/supabase-server';

describe('Admin Settings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/settings', () => {
    it('should return 403 when user is not admin', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(403);
    });

    it('should return settings and system status for admin user', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const mockClient = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: (resolve: (value: { count: number; data: null }) => void) => {
            resolve({ count: 10, data: null });
          },
        })),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('configuration');
      expect(data).toHaveProperty('systemStatus');
      expect(data).toHaveProperty('settings');
      expect(data.configuration).toHaveProperty('ranks');
      expect(data.configuration).toHaveProperty('overrides');
      expect(data.configuration).toHaveProperty('phases');
    });
  });

  describe('PATCH /api/admin/settings', () => {
    it('should return 403 when user is not admin', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ maintenance_mode: true }),
      });

      const response = await PATCH(request);

      expect(response.status).toBe(403);
    });

    it('should update settings when valid data provided', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const request = new NextRequest('http://localhost:3000/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ maintenance_mode: true, registration_enabled: false }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.settings).toEqual({ maintenance_mode: true, registration_enabled: false });
    });

    it('should return 400 for invalid settings data', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const request = new NextRequest('http://localhost:3000/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ min_withdrawal_ach: -100 }), // Negative not allowed
      });

      const response = await PATCH(request);

      expect(response.status).toBe(400);
    });
  });
});
