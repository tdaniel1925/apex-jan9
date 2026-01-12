/**
 * Admin Overrides API Tests
 * Tests for GET /api/admin/overrides
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/overrides/route';
import { createMockOverride, mockAdminUser } from '../../helpers/mocks';

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

describe('Admin Overrides API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/overrides', () => {
    it('should return 403 when user is not admin', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/overrides');
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should return paginated overrides list for admin user', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const mockOverrides = [createMockOverride(), createMockOverride({ id: 'override-456' })];

      const mockClient = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: (resolve: (value: { data: typeof mockOverrides; error: null; count: number }) => void) => {
            resolve({ data: mockOverrides, error: null, count: 2 });
          },
        })),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/admin/overrides');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('overrides');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('stats');
    });

    it('should support filtering by generation', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const mockClient = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: (resolve: (value: { data: []; error: null; count: number }) => void) => {
            resolve({ data: [], error: null, count: 0 });
          },
        })),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/admin/overrides?generation=1');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should support filtering by status', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const mockClient = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: (resolve: (value: { data: []; error: null; count: number }) => void) => {
            resolve({ data: [], error: null, count: 0 });
          },
        })),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/overrides?status=pending'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should return stats with generation breakdown', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const mockOverrides = [
        createMockOverride({ generation: 1, override_amount: 50 }),
        createMockOverride({ id: 'o-2', generation: 2, override_amount: 40 }),
        createMockOverride({ id: 'o-3', generation: 3, override_amount: 30 }),
      ];

      const mockClient = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: (resolve: (value: { data: typeof mockOverrides; error: null; count: number }) => void) => {
            resolve({ data: mockOverrides, error: null, count: 3 });
          },
        })),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/admin/overrides');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats).toHaveProperty('byGeneration');
    });
  });
});
