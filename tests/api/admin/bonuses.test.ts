/**
 * Admin Bonuses API Tests
 * Tests for GET and POST /api/admin/bonuses
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/bonuses/route';
import { createMockAgent, createMockBonus, mockAdminUser } from '../../helpers/mocks';

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

// Mock the wallet engine
vi.mock('@/lib/engines/wallet-engine', () => ({
  createCreditTransaction: vi.fn().mockReturnValue({}),
  calculateCreditUpdate: vi.fn().mockReturnValue({ balance: 1000 }),
}));

// Import mocked modules
import { verifyAdmin } from '@/lib/auth/admin-auth';
import { createAdminClient } from '@/lib/db/supabase-server';

describe('Admin Bonuses API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/bonuses', () => {
    it('should return 403 when user is not admin', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/bonuses');
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should return paginated bonuses list for admin user', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const mockBonuses = [createMockBonus(), createMockBonus({ id: 'bonus-456' })];

      const mockClient = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: (resolve: (value: { data: typeof mockBonuses; error: null; count: number }) => void) => {
            resolve({ data: mockBonuses, error: null, count: 2 });
          },
        })),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/admin/bonuses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('bonuses');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('stats');
    });

    it('should support filtering by bonus_type', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/admin/bonuses?bonus_type=fast_start');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/admin/bonuses', () => {
    it('should return 403 when user is not admin', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/bonuses', {
        method: 'POST',
        body: JSON.stringify({
          agent_id: 'a0000000-0000-0000-0000-000000000001',
          bonus_type: 'fast_start',
          amount: 250,
          description: 'Test bonus',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should return 400 for invalid bonus data', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const request = new NextRequest('http://localhost:3000/api/admin/bonuses', {
        method: 'POST',
        body: JSON.stringify({
          agent_id: 'invalid-uuid',
          bonus_type: 'invalid_type', // Invalid bonus type
          amount: 250,
          description: 'Test bonus',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const request = new NextRequest('http://localhost:3000/api/admin/bonuses', {
        method: 'POST',
        body: JSON.stringify({
          agent_id: 'a0000000-0000-0000-0000-000000000001',
          // Missing bonus_type, amount, description
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
