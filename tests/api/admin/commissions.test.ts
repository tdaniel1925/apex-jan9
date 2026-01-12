/**
 * Admin Commissions API Tests
 * Tests for GET and POST /api/admin/commissions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/commissions/route';
import { createMockAgent, createMockCommission, mockAdminUser } from '../../helpers/mocks';

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

// Mock the workflow
vi.mock('@/lib/workflows/on-commission-created', () => ({
  onCommissionCreated: vi.fn().mockResolvedValue({ success: true }),
}));

// Import mocked modules
import { verifyAdmin } from '@/lib/auth/admin-auth';
import { createAdminClient } from '@/lib/db/supabase-server';

describe('Admin Commissions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/commissions', () => {
    it('should return 403 when user is not admin', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/commissions');
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should return paginated commissions list for admin user', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const mockCommissions = [createMockCommission(), createMockCommission({ id: 'comm-456' })];

      const mockClient = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: (resolve: (value: { data: typeof mockCommissions; error: null; count: number }) => void) => {
            resolve({ data: mockCommissions, error: null, count: 2 });
          },
        })),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/admin/commissions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('commissions');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('stats');
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
        'http://localhost:3000/api/admin/commissions?status=pending'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/admin/commissions', () => {
    it('should return 403 when user is not admin', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/commissions', {
        method: 'POST',
        body: JSON.stringify({
          agent_id: 'agent-123',
          carrier: 'carrier_a',
          policy_number: 'POL-001',
          premium_amount: 1000,
          commission_rate: 0.5,
          commission_amount: 500,
          policy_date: '2024-01-15',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should return 400 for invalid commission data', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const request = new NextRequest('http://localhost:3000/api/admin/commissions', {
        method: 'POST',
        body: JSON.stringify({
          agent_id: 'invalid-uuid', // Invalid UUID
          carrier: 'carrier_a',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const request = new NextRequest('http://localhost:3000/api/admin/commissions', {
        method: 'POST',
        body: JSON.stringify({
          agent_id: 'a0000000-0000-0000-0000-000000000001',
          // Missing carrier, policy_number, etc.
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
