/**
 * Unit tests for Admin Training Analytics API
 * Tests GET /api/admin/training/analytics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/training/analytics/route';

// Mock the admin auth module
vi.mock('@/lib/auth/admin-auth', () => ({
  verifyAdmin: vi.fn(),
  forbiddenResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })),
  serverErrorResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 })),
}));

// Create chainable mock for Supabase queries
const createChainableMock = (returnValue: unknown) => {
  const mock: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'not', 'gte', 'order', 'limit'];

  methods.forEach(method => {
    mock[method] = vi.fn().mockReturnValue(mock);
  });

  // Override the last method call to return the value
  mock.select = vi.fn().mockReturnValue({
    ...mock,
    then: (resolve: (value: unknown) => void) => resolve(returnValue),
  });

  return mock;
};

// Mock Supabase client with count support
const mockSupabaseClient = {
  from: vi.fn(),
};

vi.mock('@/lib/db/supabase-server', () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient),
}));

import { verifyAdmin } from '@/lib/auth/admin-auth';

describe('Admin Training Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/training/analytics', () => {
    it('should return 403 when not authenticated as admin', async () => {
      vi.mocked(verifyAdmin).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/admin/training/analytics');
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should return analytics data when authenticated', async () => {
      vi.mocked(verifyAdmin).mockResolvedValueOnce({ userId: 'admin-1', agentId: 'agent-1', isAdmin: true, agent: {} as never });

      // Mock all the Supabase calls
      mockSupabaseClient.from = vi.fn().mockImplementation((table: string) => {
        const createQueryBuilder = () => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockImplementation(async () => {
              if (table === 'course_enrollments') {
                return { data: [], error: null };
              }
              if (table === 'course_progress') {
                return { data: [], error: null };
              }
              if (table === 'agent_achievements') {
                return { data: [], error: null };
              }
              return { count: 0 };
            }),
          }),
        });

        if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 5 }),
            }),
          };
        }
        if (table === 'lessons') {
          return {
            select: vi.fn().mockResolvedValue({ count: 25 }),
          };
        }
        if (table === 'course_enrollments') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockResolvedValue({ count: 10 }),
              gte: vi.fn().mockResolvedValue({ count: 3 }),
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          };
        }
        if (table === 'certificates') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ count: 2 }),
            }),
          };
        }
        if (table === 'quiz_attempts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 8 }),
            }),
          };
        }
        if (table === 'course_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [] }),
                }),
              }),
            }),
          };
        }
        if (table === 'agent_achievements') {
          return {
            select: vi.fn().mockResolvedValue({ data: [] }),
          };
        }

        return createQueryBuilder();
      });

      const request = new NextRequest('http://localhost:3000/api/admin/training/analytics');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty('overall');
      expect(data).toHaveProperty('period');
      expect(data).toHaveProperty('top_courses');
      expect(data).toHaveProperty('recent_activity');
      expect(data).toHaveProperty('achievement_distribution');
    });

    it('should accept period parameter', async () => {
      vi.mocked(verifyAdmin).mockResolvedValueOnce({ userId: 'admin-1', agentId: 'agent-1', isAdmin: true, agent: {} as never });

      // Create a comprehensive mock that handles all the chained calls
      const createSelectMock = (countValue: number | null = 0) => ({
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null, count: countValue }),
      });

      mockSupabaseClient.from = vi.fn().mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnValue(createSelectMock(0)),
        };

        // For course_progress, need to handle the eq().order().limit() chain
        if (table === 'course_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }

        // For agent_achievements, just return data directly
        if (table === 'agent_achievements') {
          return {
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }

        return baseMock;
      });

      const request = new NextRequest('http://localhost:3000/api/admin/training/analytics?period=7');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.period.days).toBe(7);
    });

    it('should handle server errors gracefully', async () => {
      vi.mocked(verifyAdmin).mockResolvedValueOnce({ userId: 'admin-1', agentId: 'agent-1', isAdmin: true, agent: {} as never });

      // Mock to throw error
      mockSupabaseClient.from = vi.fn().mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new NextRequest('http://localhost:3000/api/admin/training/analytics');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });
});
