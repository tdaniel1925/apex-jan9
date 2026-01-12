/**
 * Checkout API Tests
 * Tests for POST /api/checkout
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted() to properly hoist mock functions
const { mockGetUser, mockFrom, mockStripeCreate } = vi.hoisted(() => {
  return {
    mockGetUser: vi.fn(),
    mockFrom: vi.fn(),
    mockStripeCreate: vi.fn(),
  };
});

// Mock Supabase
vi.mock('@/lib/db/supabase-server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

// Mock Stripe
vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: mockStripeCreate,
      },
    },
  },
}));

// Import after mocks are set up
import { POST } from '@/app/api/checkout/route';

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ items: [] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if cart is empty', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    const mockAgent = {
      id: 'agent-123',
      user_id: 'user-123',
      rank: 'agent',
    };

    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockAgent, error: null })),
        })),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ items: [] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Cart is empty');
  });

  it('should create checkout session for valid cart', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    const mockAgent = {
      id: 'agent-123',
      user_id: 'user-123',
      rank: 'agent',
    };

    const mockProducts = [
      {
        id: 'prod-1',
        name: 'Test Product',
        price: 99.99,
        bonus_volume: 50,
        description: 'Test',
        image_url: null,
        is_active: true,
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
        // Second call: get products
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockProducts, error: null })),
            })),
          })),
        } as any;
      }
    });

    mockStripeCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/session_123',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ product_id: 'prod-1', quantity: 1 }],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://checkout.stripe.com/session_123');
    expect(mockStripeCreate).toHaveBeenCalled();
  });
});
