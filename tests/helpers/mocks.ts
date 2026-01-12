/**
 * Test Helper Mocks
 * Mock factories for Supabase client and admin authentication
 */

import { vi } from 'vitest';
import type { Agent, Commission, Bonus, Payout, Override } from '@/lib/types/database';
import type { Rank } from '@/lib/config/ranks';

// ============================================
// Mock Admin Agent Factory
// ============================================
export function createMockAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'agent-123',
    user_id: 'user-123',
    sponsor_id: null,
    agent_code: 'AA001',
    first_name: 'Test',
    last_name: 'Admin',
    email: 'admin@test.com',
    phone: '555-0100',
    avatar_url: null,
    bio: null,
    rank: 'regional_mga' as Rank,
    status: 'active',
    licensed_date: '2024-01-01',
    premium_90_days: 50000,
    persistency_rate: 85,
    placement_rate: 90,
    active_agents_count: 50,
    personal_recruits_count: 10,
    mgas_in_downline: 2,
    personal_bonus_volume: 10000,
    organization_bonus_volume: 50000,
    pbv_90_days: 5000,
    obv_90_days: 25000,
    ai_copilot_tier: 'pro',
    ai_copilot_subscribed_at: null,
    username: 'testadmin',
    replicated_site_enabled: true,
    calendar_link: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    fast_start_ends_at: '2024-04-01T00:00:00Z',
    ...overrides,
  };
}

// ============================================
// Mock Commission Factory
// ============================================
export function createMockCommission(overrides: Partial<Commission> = {}): Commission {
  return {
    id: 'comm-123',
    agent_id: 'agent-123',
    carrier: 'columbus_life',
    policy_number: 'POL-001',
    premium_amount: 1000,
    commission_rate: 0.5,
    commission_amount: 500,
    policy_date: '2024-01-15',
    status: 'pending',
    source: 'smart_office',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    ...overrides,
  };
}

// ============================================
// Mock Bonus Factory
// ============================================
export function createMockBonus(overrides: Partial<Bonus> = {}): Bonus {
  return {
    id: 'bonus-123',
    agent_id: 'agent-123',
    bonus_type: 'fast_start',
    amount: 250,
    description: 'Fast Start Bonus',
    reference_id: null,
    status: 'pending',
    payout_date: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    ...overrides,
  };
}

// ============================================
// Mock Payout Factory
// ============================================
export function createMockPayout(overrides: Partial<Payout> = {}): Payout {
  return {
    id: 'payout-123',
    agent_id: 'agent-123',
    amount: 1000,
    method: 'ach',
    fee: 0,
    net_amount: 1000,
    status: 'pending',
    processed_at: null,
    created_at: '2024-01-15T00:00:00Z',
    ...overrides,
  };
}

// ============================================
// Mock Override Factory
// ============================================
export function createMockOverride(overrides: Partial<Override> = {}): Override {
  return {
    id: 'override-123',
    commission_id: 'comm-123',
    agent_id: 'agent-456',
    source_agent_id: 'agent-123',
    generation: 1,
    override_rate: 0.1,
    override_amount: 50,
    status: 'pending',
    created_at: '2024-01-15T00:00:00Z',
    ...overrides,
  };
}

// ============================================
// Mock Supabase Query Builder
// ============================================
export function createMockQueryBuilder(mockData: unknown = null, mockError: unknown = null, count: number = 0) {
  const chainMethods = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockData, error: mockError }),
    maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: mockError }),
  };

  // Make the builder itself return the promise result
  const builder = Object.assign(
    Promise.resolve({ data: mockData, error: mockError, count }),
    chainMethods
  );

  // Override then to return proper structure
  (builder as Promise<unknown> & typeof chainMethods).then = function(onfulfilled) {
    return Promise.resolve({ data: mockData, error: mockError, count }).then(onfulfilled);
  };

  return builder;
}

// ============================================
// Mock Supabase Client Factory
// ============================================
export function createMockSupabaseClient(options: {
  user?: { id: string; email: string } | null;
  agentData?: Agent | null;
  queryData?: unknown;
  queryError?: unknown;
  queryCount?: number;
} = {}) {
  const {
    user = { id: 'user-123', email: 'admin@test.com' },
    agentData = createMockAgent(),
    queryData = null,
    queryError = null,
    queryCount = 0,
  } = options;

  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user },
      error: null,
    }),
    getSession: vi.fn().mockResolvedValue({
      data: { session: user ? { user } : null },
      error: null,
    }),
  };

  const mockFrom = vi.fn().mockImplementation((table: string) => {
    // Return agent data for 'agents' table single queries
    if (table === 'agents') {
      return createMockQueryBuilder(agentData, null, 1);
    }
    return createMockQueryBuilder(queryData, queryError, queryCount);
  });

  return {
    auth: mockAuth,
    from: mockFrom,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

// ============================================
// Mock Admin Auth Response
// ============================================
export const mockAdminUser = {
  userId: 'user-123',
  agentId: 'agent-123',
  agent: createMockAgent(),
  isAdmin: true,
};

// ============================================
// Mock NextRequest Factory
// ============================================
export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: unknown;
  searchParams?: Record<string, string>;
} = {}) {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/admin/test',
    body = null,
    searchParams = {},
  } = options;

  const urlObj = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  return {
    method,
    url: urlObj.toString(),
    nextUrl: urlObj,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    headers: new Headers(),
  };
}
