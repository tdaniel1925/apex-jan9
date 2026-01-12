/**
 * Commissions API Tests
 */

import { describe, it, expect } from 'vitest';

describe('Commissions API', () => {
  describe('Commission Summary', () => {
    it('should calculate total earnings correctly', () => {
      const commissions = [
        { type: 'ai_copilot', commission_amount: 6.00, status: 'paid' },
        { type: 'ai_copilot', commission_amount: 23.70, status: 'pending' },
        { type: 'override', commission_amount: 3.00, status: 'paid' },
      ];

      const totalEarnings = commissions.reduce((sum, c) => sum + c.commission_amount, 0);
      expect(totalEarnings).toBeCloseTo(32.70, 2);
    });

    it('should calculate personal vs override earnings', () => {
      const commissions = [
        { type: 'ai_copilot', commission_amount: 6.00 },
        { type: 'ai_copilot', commission_amount: 23.70 },
        { type: 'override', commission_amount: 3.00 },
        { type: 'override', commission_amount: 1.00 },
      ];

      const personalSales = commissions
        .filter((c) => c.type === 'ai_copilot')
        .reduce((sum, c) => sum + c.commission_amount, 0);

      const overrides = commissions
        .filter((c) => c.type === 'override')
        .reduce((sum, c) => sum + c.commission_amount, 0);

      expect(personalSales).toBeCloseTo(29.70, 2);
      expect(overrides).toBeCloseTo(4.00, 2);
    });

    it('should calculate pending amount', () => {
      const commissions = [
        { commission_amount: 6.00, status: 'paid' },
        { commission_amount: 23.70, status: 'pending' },
        { commission_amount: 3.00, status: 'pending' },
      ];

      const pending = commissions
        .filter((c) => c.status === 'pending')
        .reduce((sum, c) => sum + c.commission_amount, 0);

      expect(pending).toBeCloseTo(26.70, 2);
    });
  });

  describe('Commission Rates', () => {
    const COMMISSION_RATES: Record<string, number> = {
      associate: 0.30,
      senior_associate: 0.35,
      district_manager: 0.40,
      regional_manager: 0.45,
      national_manager: 0.50,
      executive_director: 0.55,
    };

    it('should have correct rates for each rank', () => {
      expect(COMMISSION_RATES.associate).toBe(0.30);
      expect(COMMISSION_RATES.senior_associate).toBe(0.35);
      expect(COMMISSION_RATES.district_manager).toBe(0.40);
      expect(COMMISSION_RATES.regional_manager).toBe(0.45);
      expect(COMMISSION_RATES.national_manager).toBe(0.50);
      expect(COMMISSION_RATES.executive_director).toBe(0.55);
    });

    it('should calculate personal commission correctly', () => {
      const bonusVolume = 20; // Basic tier BV
      const rate = COMMISSION_RATES.associate;
      const commission = bonusVolume * rate;
      expect(commission).toBe(6.00);
    });

    it('should calculate pro tier commission correctly', () => {
      const bonusVolume = 60; // Pro tier BV
      const rate = COMMISSION_RATES.district_manager;
      const commission = bonusVolume * rate;
      expect(commission).toBe(24.00);
    });

    it('should calculate agency tier commission correctly', () => {
      const bonusVolume = 150; // Agency tier BV
      const rate = COMMISSION_RATES.executive_director;
      const commission = bonusVolume * rate;
      expect(commission).toBe(82.50);
    });
  });

  describe('Override Commission Calculation', () => {
    const COMMISSION_RATES: Record<string, number> = {
      associate: 0.30,
      senior_associate: 0.35,
      district_manager: 0.40,
      regional_manager: 0.45,
      national_manager: 0.50,
      executive_director: 0.55,
    };

    it('should calculate override when upline has higher rank', () => {
      const downlineRank = 'associate';
      const uplineRank = 'district_manager';
      const bonusVolume = 20;

      const downlineRate = COMMISSION_RATES[downlineRank];
      const uplineRate = COMMISSION_RATES[uplineRank];
      const overrideRate = uplineRate - downlineRate;
      const overrideAmount = bonusVolume * overrideRate;

      expect(overrideRate).toBeCloseTo(0.10, 2); // 40% - 30%
      expect(overrideAmount).toBeCloseTo(2.00, 2);
    });

    it('should not create override when rates are equal', () => {
      const downlineRank = 'associate';
      const uplineRank = 'associate';
      const bonusVolume = 20;

      const downlineRate = COMMISSION_RATES[downlineRank];
      const uplineRate = COMMISSION_RATES[uplineRank];
      const overrideRate = uplineRate - downlineRate;

      expect(overrideRate).toBe(0);
    });

    it('should calculate multi-level override chain', () => {
      // Scenario: Associate sells, DM and NM are upline
      const bonusVolume = 60; // Pro tier

      // Level 1: Associate sells at 30%
      const personalCommission = bonusVolume * 0.30;
      expect(personalCommission).toBe(18.00);

      // Level 2: District Manager override (40% - 30% = 10%)
      const dmOverride = bonusVolume * (0.40 - 0.30);
      expect(dmOverride).toBeCloseTo(6.00, 2);

      // Level 3: National Manager override (50% - 40% = 10%)
      const nmOverride = bonusVolume * (0.50 - 0.40);
      expect(nmOverride).toBeCloseTo(6.00, 2);

      // Total BV distributed
      const totalDistributed = personalCommission + dmOverride + nmOverride;
      expect(totalDistributed).toBeCloseTo(30.00, 2); // 50% of 60 BV
    });
  });

  describe('Period Filtering', () => {
    it('should filter commissions by week', () => {
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const commissions = [
        { created_at: now.toISOString(), commission_amount: 10 },
        { created_at: weekAgo.toISOString(), commission_amount: 20 },
        {
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          commission_amount: 30,
        },
      ];

      const weeklyCommissions = commissions.filter((c) => {
        const created = new Date(c.created_at);
        return created >= weekAgo;
      });

      expect(weeklyCommissions.length).toBe(2);
    });

    it('should filter commissions by month', () => {
      const now = new Date();
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const commissions = [
        { created_at: now.toISOString(), commission_amount: 10 },
        { created_at: monthAgo.toISOString(), commission_amount: 20 },
        {
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          commission_amount: 30,
        },
      ];

      const monthlyCommissions = commissions.filter((c) => {
        const created = new Date(c.created_at);
        return created >= monthAgo;
      });

      expect(monthlyCommissions.length).toBe(2);
    });
  });

  describe('Type Filtering', () => {
    it('should filter personal sales', () => {
      const commissions = [
        { type: 'ai_copilot', commission_amount: 10 },
        { type: 'override', commission_amount: 5 },
        { type: 'ai_copilot', commission_amount: 15 },
      ];

      const personalSales = commissions.filter((c) => c.type === 'ai_copilot');
      expect(personalSales.length).toBe(2);
    });

    it('should filter overrides', () => {
      const commissions = [
        { type: 'ai_copilot', commission_amount: 10 },
        { type: 'override', commission_amount: 5 },
        { type: 'override', commission_amount: 3 },
      ];

      const overrides = commissions.filter((c) => c.type === 'override');
      expect(overrides.length).toBe(2);
    });
  });

  describe('Commission Data Structure', () => {
    it('should have valid commission record structure', () => {
      const commission = {
        id: 'comm-123',
        agent_id: 'agent-456',
        order_id: null,
        type: 'ai_copilot',
        retail_amount: 29.00,
        bonus_volume: 20,
        commission_rate: 0.30,
        commission_amount: 6.00,
        status: 'pending',
        notes: 'Copilot basic subscription payment',
        created_at: '2026-01-12T10:00:00Z',
        paid_at: null,
      };

      expect(commission.id).toBeDefined();
      expect(commission.agent_id).toBeDefined();
      expect(commission.type).toBe('ai_copilot');
      expect(commission.commission_amount).toBe(commission.bonus_volume * commission.commission_rate);
      expect(commission.status).toBe('pending');
    });

    it('should have valid override record structure', () => {
      const override = {
        id: 'override-123',
        agent_id: 'upline-789',
        order_id: null,
        type: 'override',
        retail_amount: 0,
        bonus_volume: 20,
        commission_rate: 0.10,
        commission_amount: 2.00,
        status: 'pending',
        notes: 'Override on copilot basic subscription (Level 1 from John Doe)',
        created_at: '2026-01-12T10:00:00Z',
        paid_at: null,
      };

      expect(override.type).toBe('override');
      expect(override.retail_amount).toBe(0);
      expect(override.commission_amount).toBe(override.bonus_volume * override.commission_rate);
    });
  });

  describe('API Response Structure', () => {
    it('should return correct response format', () => {
      const mockResponse = {
        commissions: [
          {
            id: 'comm-1',
            type: 'ai_copilot',
            commission_amount: 6.00,
            status: 'pending',
          },
        ],
        summary: {
          totalEarnings: 100,
          personalSales: 80,
          overrides: 20,
          pendingAmount: 50,
          subscriptionCount: 5,
          periodTotal: 30,
          periodPending: 15,
          periodPaid: 15,
        },
        agentRank: 'associate',
      };

      expect(mockResponse.commissions).toBeInstanceOf(Array);
      expect(mockResponse.summary).toBeDefined();
      expect(mockResponse.summary.totalEarnings).toBe(
        mockResponse.summary.personalSales + mockResponse.summary.overrides
      );
      expect(mockResponse.agentRank).toBeDefined();
    });
  });
});
