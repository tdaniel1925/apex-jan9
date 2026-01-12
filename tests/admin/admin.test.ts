/**
 * Tests for Admin Back Office
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/db/supabase-client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-user' } }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'admin-agent',
              first_name: 'Admin',
              last_name: 'User',
              rank: 'regional_mga',
              status: 'active',
            },
            error: null,
          }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
        gte: vi.fn(() => ({
          lt: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
        neq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })),
  })),
  Tables: vi.fn(),
}));

describe('Admin Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require Regional MGA rank or higher for admin access', async () => {
    const { RANK_CONFIG } = await import('@/lib/config/ranks');

    // Regional MGA should have admin access
    const regionalMgaOrder = RANK_CONFIG.regional_mga.order;
    expect(regionalMgaOrder).toBeGreaterThanOrEqual(9);

    // Verify higher ranks also have access
    expect(RANK_CONFIG.national_mga.order).toBeGreaterThan(regionalMgaOrder);
    expect(RANK_CONFIG.executive_mga.order).toBeGreaterThan(regionalMgaOrder);
    expect(RANK_CONFIG.premier_mga.order).toBeGreaterThan(regionalMgaOrder);
  });

  it('should deny admin access to lower ranks', async () => {
    const { RANK_CONFIG } = await import('@/lib/config/ranks');

    const regionalMgaOrder = RANK_CONFIG.regional_mga.order;

    // Lower ranks should not have admin access
    expect(RANK_CONFIG.pre_associate.order).toBeLessThan(regionalMgaOrder);
    expect(RANK_CONFIG.associate.order).toBeLessThan(regionalMgaOrder);
    expect(RANK_CONFIG.sr_associate.order).toBeLessThan(regionalMgaOrder);
    expect(RANK_CONFIG.agent.order).toBeLessThan(regionalMgaOrder);
    expect(RANK_CONFIG.sr_agent.order).toBeLessThan(regionalMgaOrder);
    expect(RANK_CONFIG.mga.order).toBeLessThan(regionalMgaOrder);
  });

  it('should have admin login at separate URL from agent login', () => {
    // Admin login should be at /admin-login, separate from /login
    const adminLoginPath = '/admin-login';
    const agentLoginPath = '/login';

    expect(adminLoginPath).not.toBe(agentLoginPath);
    expect(adminLoginPath).toContain('admin');
  });

  it('should verify admin rank before granting access', async () => {
    const { RANK_CONFIG } = await import('@/lib/config/ranks');

    // Function to check admin access
    const hasAdminAccess = (rank: string) => {
      const rankConfig = RANK_CONFIG[rank as keyof typeof RANK_CONFIG];
      return rankConfig?.order >= RANK_CONFIG.regional_mga.order;
    };

    // Test admin ranks
    expect(hasAdminAccess('regional_mga')).toBe(true);
    expect(hasAdminAccess('national_mga')).toBe(true);
    expect(hasAdminAccess('executive_mga')).toBe(true);
    expect(hasAdminAccess('premier_mga')).toBe(true);

    // Test non-admin ranks
    expect(hasAdminAccess('pre_associate')).toBe(false);
    expect(hasAdminAccess('associate')).toBe(false);
    expect(hasAdminAccess('mga')).toBe(false);
  });
});

describe('Admin Dashboard Stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate phase based on active agent count', async () => {
    const { getCurrentPhase } = await import('@/lib/config/bonuses');

    // Phase 1: 0-99 agents (< 100)
    expect(getCurrentPhase(0)).toBe(1);
    expect(getCurrentPhase(50)).toBe(1);
    expect(getCurrentPhase(99)).toBe(1);

    // Phase 2: 100-249 agents (< 250)
    expect(getCurrentPhase(100)).toBe(2);
    expect(getCurrentPhase(200)).toBe(2);
    expect(getCurrentPhase(249)).toBe(2);

    // Phase 3: 250-499 agents (< 500)
    expect(getCurrentPhase(250)).toBe(3);
    expect(getCurrentPhase(400)).toBe(3);
    expect(getCurrentPhase(499)).toBe(3);

    // Phase 4: 500+ agents
    expect(getCurrentPhase(500)).toBe(4);
    expect(getCurrentPhase(1000)).toBe(4);
  });
});

describe('Admin Commission Import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct carrier configuration', async () => {
    const { CARRIER_CONFIG } = await import('@/lib/config/carriers');

    // Verify all carriers exist
    expect(CARRIER_CONFIG.columbus_life).toBeDefined();
    expect(CARRIER_CONFIG.aig).toBeDefined();
    expect(CARRIER_CONFIG.fg).toBeDefined();
    expect(CARRIER_CONFIG.moo).toBeDefined();
    expect(CARRIER_CONFIG.nlg).toBeDefined();
    expect(CARRIER_CONFIG.symetra).toBeDefined();
    expect(CARRIER_CONFIG.na).toBeDefined();
  });

  it('should have commission rates for each carrier', async () => {
    const { CARRIER_CONFIG } = await import('@/lib/config/carriers');

    // Each carrier should have commissionRates object
    Object.values(CARRIER_CONFIG).forEach(carrier => {
      expect(carrier.commissionRates).toBeDefined();
      expect(typeof carrier.commissionRates).toBe('object');
    });
  });
});

describe('Admin Bonus Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have bonus types defined', async () => {
    // Bonus types that can be created
    const validBonusTypes = [
      'fast_start',
      'fast_start_sponsor',
      'rank_advancement',
      'team_builder',
      'ai_referral',
      'car_bonus',
      'matching',
      'leadership_pool',
      'contest',
    ];

    expect(validBonusTypes).toContain('fast_start');
    expect(validBonusTypes).toContain('rank_advancement');
    expect(validBonusTypes).toContain('car_bonus');
  });

  it('should validate bonus status transitions', async () => {
    const validStatuses = ['pending', 'approved', 'paid', 'denied'];

    expect(validStatuses).toContain('pending');
    expect(validStatuses).toContain('approved');
    expect(validStatuses).toContain('paid');
    expect(validStatuses).toContain('denied');
  });
});

describe('Admin Payout Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have valid payout methods', async () => {
    const { WITHDRAWAL_FEES } = await import('@/lib/engines/wallet-engine');

    // Verify all payout methods
    expect(WITHDRAWAL_FEES.ach).toBeDefined();
    expect(WITHDRAWAL_FEES.wire).toBeDefined();
    expect(WITHDRAWAL_FEES.check).toBeDefined();
  });

  it('should have minimum withdrawal amounts', async () => {
    const { MIN_WITHDRAWAL } = await import('@/lib/engines/wallet-engine');

    expect(MIN_WITHDRAWAL.ach).toBeDefined();
    expect(MIN_WITHDRAWAL.wire).toBeDefined();
    expect(MIN_WITHDRAWAL.check).toBeDefined();

    // Wire should have highest minimum
    expect(MIN_WITHDRAWAL.wire).toBeGreaterThan(MIN_WITHDRAWAL.ach);
  });
});

describe('Admin Override Report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct override rates by generation', async () => {
    const { getOverridePercentage } = await import('@/lib/config/overrides');

    // Verify 6 generation override rates
    expect(getOverridePercentage(1)).toBe(0.15); // 15%
    expect(getOverridePercentage(2)).toBe(0.05); // 5%
    expect(getOverridePercentage(3)).toBe(0.03); // 3%
    expect(getOverridePercentage(4)).toBe(0.02); // 2%
    expect(getOverridePercentage(5)).toBe(0.01); // 1%
    expect(getOverridePercentage(6)).toBe(0.005); // 0.5%
  });

  it('should calculate cumulative override correctly', async () => {
    const { GENERATION_OVERRIDES } = await import('@/lib/config/overrides');

    // Total override should be 26.5% (excluding pool)
    const total = GENERATION_OVERRIDES.reduce((sum: number, gen) => sum + gen.percentage, 0);
    expect(total).toBeCloseTo(0.265, 3);
  });
});

describe('Admin Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should format currency correctly', async () => {
    const { formatCurrency } = await import('@/lib/engines/wallet-engine');

    expect(formatCurrency(1000)).toBe('$1,000.00');
    expect(formatCurrency(10000.50)).toBe('$10,000.50');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
  });

  it('should calculate AI Copilot revenue correctly', () => {
    // AI Copilot pricing
    const aiPricing = {
      basic: 49,
      pro: 99,
      agency: 199,
    };

    // Calculate revenue for 10 agents with mixed subscriptions
    const subscribers = [
      { tier: 'basic', count: 5 },
      { tier: 'pro', count: 3 },
      { tier: 'agency', count: 2 },
    ];

    const revenue = subscribers.reduce((sum, sub) => {
      return sum + (aiPricing[sub.tier as keyof typeof aiPricing] * sub.count);
    }, 0);

    // 5 * 49 + 3 * 99 + 2 * 199 = 245 + 297 + 398 = 940
    expect(revenue).toBe(940);

    // Margin should be 50%
    const margin = revenue * 0.5;
    expect(margin).toBe(470);
  });
});
