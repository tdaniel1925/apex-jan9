/**
 * Admin Analytics API Tests
 * Tests for GET /api/admin/analytics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/analytics/route';
import { mockAdminUser } from '../../helpers/mocks';

// Mock the admin auth module
vi.mock('@/lib/auth/admin-auth', () => ({
  verifyAdmin: vi.fn(),
  forbiddenResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })),
  serverErrorResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })),
}));

// Mock the supabase server module
vi.mock('@/lib/db/supabase-server', () => ({
  createAdminClient: vi.fn(),
}));

// Import mocked modules
import { verifyAdmin } from '@/lib/auth/admin-auth';
import { createAdminClient } from '@/lib/db/supabase-server';

describe('Admin Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/analytics', () => {
    it('should return 403 when user is not admin', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics');
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should return comprehensive analytics for admin user', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      // Create a complex mock that returns different data for each table
      const createTableMock = (data: unknown[]) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve: (value: { data: unknown[]; error: null }) => void) => {
          resolve({ data, error: null });
        },
      });

      const mockClient = {
        from: vi.fn().mockImplementation((table) => {
          switch (table) {
            case 'agents':
              return createTableMock([
                { id: '1', rank: 'associate', status: 'active', created_at: '2024-01-01' },
              ]);
            case 'commissions':
              return createTableMock([
                { id: '1', commission_amount: 500, premium_amount: 1000, status: 'paid', created_at: '2024-01-01', carrier: 'carrier_a' },
              ]);
            case 'overrides':
              return createTableMock([
                { id: '1', override_amount: 50, generation: 1, status: 'paid', created_at: '2024-01-01' },
              ]);
            case 'bonuses':
              return createTableMock([
                { id: '1', amount: 250, bonus_type: 'fast_start', status: 'paid', created_at: '2024-01-01' },
              ]);
            case 'payouts':
              return createTableMock([
                { id: '1', amount: 500, net_amount: 500, fee: 0, status: 'completed', method: 'ach', created_at: '2024-01-01' },
              ]);
            case 'wallets':
              return createTableMock([
                { id: '1', balance: 1000, pending_balance: 200, lifetime_earnings: 5000 },
              ]);
            case 'rank_history':
              return createTableMock([
                { id: '1', new_rank: 'associate', created_at: '2024-01-01' },
              ]);
            default:
              return createTableMock([]);
          }
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('agents');
      expect(data).toHaveProperty('financials');
      expect(data).toHaveProperty('wallets');
      expect(data).toHaveProperty('breakdowns');
      expect(data).toHaveProperty('charts');
      expect(data).toHaveProperty('recentActivity');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const mockClient = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          then: (resolve: (value: { data: null; error: { message: string } }) => void) => {
            resolve({ data: null, error: { message: 'Database error' } });
          },
        })),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics');
      const response = await GET(request);

      // Should handle gracefully with empty data
      expect(response.status).toBe(200);
    });

    it('should calculate growth metrics', async () => {
      vi.mocked(verifyAdmin).mockResolvedValue(mockAdminUser);

      const createTableMock = (data: unknown[]) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve: (value: { data: unknown[]; error: null }) => void) => {
          resolve({ data, error: null });
        },
      });

      const mockClient = {
        from: vi.fn().mockImplementation((table) => {
          if (table === 'agents') {
            return createTableMock([
              { id: '1', rank: 'associate', status: 'active', created_at: new Date().toISOString() },
              { id: '2', rank: 'senior_associate', status: 'active', created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
            ]);
          }
          return createTableMock([]);
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.agents).toHaveProperty('newThisPeriod');
      expect(data.agents).toHaveProperty('total');
    });
  });
});
