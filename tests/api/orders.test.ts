/**
 * Orders API Tests
 * Tests for GET /api/orders
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted() to properly hoist mock functions
const { mockGetUser, mockFrom } = vi.hoisted(() => {
  return {
    mockGetUser: vi.fn(),
    mockFrom: vi.fn(),
  };
});

// Mock Supabase
vi.mock('@/lib/db/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

// Import after mocks are set up
import { GET } from '@/app/api/orders/route';

describe('GET /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 if agent not found', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: new Error('Not found') })),
        })),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Agent not found');
  });

  it('should return orders for authenticated agent', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    const mockAgent = { id: 'agent-123' };
    const mockOrders = [
      {
        id: 'order-1',
        agent_id: 'agent-123',
        total_amount: 99.99,
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: get agent
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockAgent, error: null })),
            })),
          })),
        } as any;
      } else {
        // Second call: get orders
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() => Promise.resolve({ data: mockOrders, error: null, count: mockOrders.length })),
              })),
            })),
          })),
        } as any;
      }
    });

    const request = new NextRequest('http://localhost:3000/api/orders?limit=50&offset=0', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual(mockOrders); // Changed from data.orders to data.data (pagination wrapper)
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.pagination).toBeDefined();
  });

  it('should handle database errors gracefully', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    const mockAgent = { id: 'agent-123' };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: get agent (succeeds)
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockAgent, error: null })),
            })),
          })),
        } as any;
      } else {
        // Second call: get orders (fails)
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({ data: null, error: new Error('Database error'), count: 0 })
                ),
              })),
            })),
          })),
        } as any;
      }
    });

    const request = new NextRequest('http://localhost:3000/api/orders?limit=50&offset=0', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined(); // Database errors will be returned
  });
});
