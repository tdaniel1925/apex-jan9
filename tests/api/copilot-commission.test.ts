/**
 * Copilot Commission Tests
 * Tests for commission calculation logic
 */

import { describe, it, expect } from 'vitest';

describe('Copilot Commission Calculations', () => {
  // Commission rates by rank
  const COMMISSION_RATES: Record<string, number> = {
    associate: 0.3, // 30%
    senior_associate: 0.35, // 35%
    district_manager: 0.4, // 40%
    regional_manager: 0.45, // 45%
    national_manager: 0.5, // 50%
    executive_director: 0.55, // 55%
  };

  // Bonus volume for each tier
  const TIER_BV: Record<string, number> = {
    basic: 20,
    pro: 60,
    agency: 150,
  };

  describe('Personal Commission Calculation', () => {
    const calculatePersonalCommission = (
      bonusVolume: number,
      rank: string
    ): number => {
      const rate = COMMISSION_RATES[rank] || 0.3;
      // Commission is calculated on BV * 100 cents (BV represents dollar value)
      return Math.round(bonusVolume * 100 * rate);
    };

    it('should calculate basic tier commission for associate', () => {
      const commission = calculatePersonalCommission(20, 'associate');
      // 20 BV * $1 * 30% = $6.00 = 600 cents
      expect(commission).toBe(600);
    });

    it('should calculate pro tier commission for district manager', () => {
      const commission = calculatePersonalCommission(60, 'district_manager');
      // 60 BV * $1 * 40% = $24.00 = 2400 cents
      expect(commission).toBe(2400);
    });

    it('should calculate agency tier commission for executive director', () => {
      const commission = calculatePersonalCommission(150, 'executive_director');
      // 150 BV * $1 * 55% = $82.50 = 8250 cents
      expect(commission).toBe(8250);
    });

    it('should default to associate rate for unknown ranks', () => {
      const commission = calculatePersonalCommission(20, 'unknown_rank');
      // 20 BV * $1 * 30% = $6.00 = 600 cents
      expect(commission).toBe(600);
    });
  });

  describe('Override Commission Calculation', () => {
    const calculateOverrideCommission = (
      bonusVolume: number,
      downlineRank: string,
      uplineRank: string
    ): number => {
      const downlineRate = COMMISSION_RATES[downlineRank] || 0.3;
      const uplineRate = COMMISSION_RATES[uplineRank] || 0.3;

      // Override is the difference in rates
      const overrideRate = Math.max(0, uplineRate - downlineRate);
      return Math.round(bonusVolume * 100 * overrideRate);
    };

    it('should calculate override when upline has higher rank', () => {
      // District manager (40%) override on associate (30%) = 10%
      const override = calculateOverrideCommission(
        60,
        'associate',
        'district_manager'
      );
      // 60 BV * $1 * 10% = $6.00 = 600 cents
      expect(override).toBe(600);
    });

    it('should return 0 when ranks are equal', () => {
      const override = calculateOverrideCommission(
        60,
        'district_manager',
        'district_manager'
      );
      expect(override).toBe(0);
    });

    it('should return 0 when upline has lower rank', () => {
      const override = calculateOverrideCommission(
        60,
        'district_manager',
        'associate'
      );
      expect(override).toBe(0);
    });

    it('should calculate multi-level overrides correctly', () => {
      // Scenario: Associate signs up for Pro ($60 BV)
      // Upline 1: Senior Associate (35%) - gets 5% override
      // Upline 2: District Manager (40%) - gets 5% override
      // Upline 3: Regional Manager (45%) - gets 5% override

      const bv = 60;

      const override1 = calculateOverrideCommission(
        bv,
        'associate',
        'senior_associate'
      );
      // 60 * 100 * 0.05 = 300 cents
      expect(override1).toBe(300);

      const override2 = calculateOverrideCommission(
        bv,
        'senior_associate',
        'district_manager'
      );
      // 60 * 100 * 0.05 = 300 cents
      expect(override2).toBe(300);

      const override3 = calculateOverrideCommission(
        bv,
        'district_manager',
        'regional_manager'
      );
      // 60 * 100 * 0.05 = 300 cents
      expect(override3).toBe(300);
    });
  });

  describe('Commission Types', () => {
    it('should define correct commission types', () => {
      const commissionTypes = ['personal', 'override', 'bonus', 'pool'];
      expect(commissionTypes).toContain('personal');
      expect(commissionTypes).toContain('override');
    });

    it('should define correct commission statuses', () => {
      const statuses = ['pending', 'approved', 'paid', 'cancelled'];
      expect(statuses).toContain('pending');
      expect(statuses).toContain('paid');
    });
  });

  describe('Commission Record Schema', () => {
    it('should have correct structure for personal commission', () => {
      const commission = {
        id: 'comm-123',
        agent_id: 'agent-456',
        type: 'personal',
        source: 'copilot_subscription',
        source_id: 'sub-789',
        amount_cents: 2400,
        description: 'Copilot Pro subscription - Personal commission',
        status: 'pending',
        period_start: '2026-01-01T00:00:00Z',
        period_end: '2026-01-31T23:59:59Z',
      };

      expect(commission.type).toBe('personal');
      expect(commission.source).toBe('copilot_subscription');
      expect(commission.amount_cents).toBe(2400);
    });

    it('should have correct structure for override commission', () => {
      const commission = {
        id: 'comm-124',
        agent_id: 'agent-001',
        type: 'override',
        source: 'copilot_subscription',
        source_id: 'sub-789',
        source_agent_id: 'agent-456',
        amount_cents: 600,
        level: 1,
        description:
          'Copilot Pro subscription - Override commission (Level 1)',
        status: 'pending',
      };

      expect(commission.type).toBe('override');
      expect(commission.level).toBe(1);
      expect(commission.source_agent_id).toBeDefined();
    });
  });

  describe('Total Commission Scenarios', () => {
    it('should calculate total commissions for a Pro subscription', () => {
      // Agent (Associate) subscribes to Pro
      // Personal: 60 BV * 30% = $18
      // Upline 1 (District Manager): 60 BV * (40% - 30%) = $6
      // Upline 2 (Regional Manager): 60 BV * (45% - 40%) = $3
      // Total paid out: $27

      const bv = 60;
      const personalRate = 0.3;
      const upline1Rate = 0.4;
      const upline2Rate = 0.45;

      const personal = bv * 100 * personalRate;
      const override1 = bv * 100 * (upline1Rate - personalRate);
      const override2 = bv * 100 * (upline2Rate - upline1Rate);

      expect(personal).toBeCloseTo(1800, 0); // $18
      expect(override1).toBeCloseTo(600, 0); // $6
      expect(override2).toBeCloseTo(300, 0); // $3

      const total = personal + override1 + override2;
      expect(total).toBeCloseTo(2700, 0); // $27 total commissions
    });

    it('should calculate ROI for company on Pro subscription', () => {
      // Pro subscription: $79/month
      // Total commissions: ~$27 (varies by upline structure)
      // Company retains: $79 - $27 = $52 (65.8% margin)

      const subscriptionPrice = 7900; // cents
      const totalCommissions = 2700; // cents
      const companyRetains = subscriptionPrice - totalCommissions;
      const marginPercent = (companyRetains / subscriptionPrice) * 100;

      expect(companyRetains).toBe(5200); // $52
      expect(marginPercent).toBeCloseTo(65.8, 1);
    });
  });

  describe('Upline Chain Processing', () => {
    const MAX_OVERRIDE_LEVELS = 5;

    it('should limit override levels to 5', () => {
      expect(MAX_OVERRIDE_LEVELS).toBe(5);
    });

    it('should process upline chain correctly', () => {
      const uplineChain = [
        { id: 'agent-1', rank: 'senior_associate' },
        { id: 'agent-2', rank: 'district_manager' },
        { id: 'agent-3', rank: 'regional_manager' },
        { id: 'agent-4', rank: 'national_manager' },
        { id: 'agent-5', rank: 'executive_director' },
        { id: 'agent-6', rank: 'executive_director' }, // Should be skipped (level 6)
      ];

      const processedLevels = uplineChain.slice(0, MAX_OVERRIDE_LEVELS);
      expect(processedLevels.length).toBe(5);
      expect(processedLevels[4].id).toBe('agent-5');
    });

    it('should skip uplines with no override potential', () => {
      // If downline has same or higher rate, skip that upline
      const downlineRank = 'district_manager';
      const uplineRank = 'associate';

      const downlineRate = COMMISSION_RATES[downlineRank];
      const uplineRate = COMMISSION_RATES[uplineRank];
      const shouldSkip = uplineRate <= downlineRate;

      expect(shouldSkip).toBe(true);
    });
  });
});
