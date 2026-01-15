/**
 * Override Engine Tests
 * Tests for 6-generation override calculations
 */

import { describe, it, expect } from 'vitest';
import {
  calculateOverrideChain,
  createOverrideRecords,
  calculateAgentOverride,
  getOverrideBreakdown,
  calculateTotalPotentialOverrides,
  determineGeneration,
} from '@/lib/engines/override-engine';
import { createMockCommission } from '../helpers/mocks';
import {
  MAX_GENERATIONS,
  GENERATION_OVERRIDES,
  getOverridePercentage,
} from '@/lib/config/overrides';

describe('Override Engine', () => {
  describe('calculateOverrideChain', () => {
    it('should calculate overrides for full 6-generation upline', () => {
      const commission = createMockCommission({
        id: 'comm-123',
        agent_id: 'agent-123',
        commission_amount: 1000,
      });

      const upline = [
        { id: 'sponsor-1', firstName: 'Gen1', lastName: 'Sponsor' },
        { id: 'sponsor-2', firstName: 'Gen2', lastName: 'Sponsor' },
        { id: 'sponsor-3', firstName: 'Gen3', lastName: 'Sponsor' },
        { id: 'sponsor-4', firstName: 'Gen4', lastName: 'Sponsor' },
        { id: 'sponsor-5', firstName: 'Gen5', lastName: 'Sponsor' },
        { id: 'sponsor-6', firstName: 'Gen6', lastName: 'Sponsor' },
      ];

      const result = calculateOverrideChain(commission, upline);

      expect(result.sourceAgentId).toBe('agent-123');
      expect(result.commissionId).toBe('comm-123');
      expect(result.commissionAmount).toBe(1000);
      expect(result.overrides.length).toBe(6);

      // Verify each generation's override
      expect(result.overrides[0].generation).toBe(1);
      expect(result.overrides[0].agentId).toBe('sponsor-1');
      expect(result.overrides[0].agentName).toBe('Gen1 Sponsor');
      expect(result.overrides[0].overrideRate).toBe(0.15);
      expect(result.overrides[0].overrideAmount).toBe(150); // 1000 * 0.15

      expect(result.overrides[1].generation).toBe(2);
      expect(result.overrides[1].overrideRate).toBe(0.05);
      expect(result.overrides[1].overrideAmount).toBe(50); // 1000 * 0.05

      expect(result.overrides[5].generation).toBe(6);
      expect(result.overrides[5].overrideRate).toBe(0.005);
      expect(result.overrides[5].overrideAmount).toBe(5); // 1000 * 0.005
    });

    it('should handle partial upline (less than 6 generations)', () => {
      const commission = createMockCommission({
        commission_amount: 1000,
      });

      const upline = [
        { id: 'sponsor-1', firstName: 'Gen1', lastName: 'Sponsor' },
        { id: 'sponsor-2', firstName: 'Gen2', lastName: 'Sponsor' },
      ];

      const result = calculateOverrideChain(commission, upline);

      expect(result.overrides.length).toBe(2);
      expect(result.totalOverrides).toBe(200); // 150 + 50
    });

    it('should handle empty upline', () => {
      const commission = createMockCommission({
        commission_amount: 1000,
      });

      const result = calculateOverrideChain(commission, []);

      expect(result.overrides.length).toBe(0);
      expect(result.totalOverrides).toBe(0);
    });

    it('should calculate correct total overrides', () => {
      const commission = createMockCommission({
        commission_amount: 1000,
      });

      const upline = Array(6).fill(null).map((_, i) => ({
        id: `sponsor-${i + 1}`,
        firstName: `Gen${i + 1}`,
        lastName: 'Sponsor',
      }));

      const result = calculateOverrideChain(commission, upline);

      // Total should be: 15% + 5% + 3% + 2% + 1% + 0.5% = 26.5%
      const expectedTotal = 1000 * 0.265;
      expect(result.totalOverrides).toBeCloseTo(expectedTotal, 2);
    });

    it('should not exceed 6 generations even with larger upline', () => {
      const commission = createMockCommission({
        commission_amount: 1000,
      });

      const upline = Array(10).fill(null).map((_, i) => ({
        id: `sponsor-${i + 1}`,
        firstName: `Gen${i + 1}`,
        lastName: 'Sponsor',
      }));

      const result = calculateOverrideChain(commission, upline);

      expect(result.overrides.length).toBe(MAX_GENERATIONS);
    });
  });

  describe('createOverrideRecords', () => {
    it('should create override records for database insertion', () => {
      const commission = createMockCommission({
        id: 'comm-123',
        agent_id: 'agent-123',
        commission_amount: 1000,
      });

      const upline = [
        { id: 'sponsor-1' },
        { id: 'sponsor-2' },
        { id: 'sponsor-3' },
      ];

      const records = createOverrideRecords(commission, upline);

      expect(records.length).toBe(3);

      // Check first record
      expect(records[0].commission_id).toBe('comm-123');
      expect(records[0].agent_id).toBe('sponsor-1');
      expect(records[0].source_agent_id).toBe('agent-123');
      expect(records[0].generation).toBe(1);
      expect(records[0].override_rate).toBe(0.15);
      expect(records[0].override_amount).toBe(150);
      expect(records[0].status).toBe('pending');

      // Check second record
      expect(records[1].generation).toBe(2);
      expect(records[1].agent_id).toBe('sponsor-2');
      expect(records[1].override_rate).toBe(0.05);
      expect(records[1].override_amount).toBe(50);
    });

    it('should handle empty upline', () => {
      const commission = createMockCommission({ commission_amount: 1000 });

      const records = createOverrideRecords(commission, []);

      expect(records.length).toBe(0);
    });

    it('should cap at 6 generations', () => {
      const commission = createMockCommission({ commission_amount: 1000 });

      const upline = Array(10).fill(null).map((_, i) => ({
        id: `sponsor-${i + 1}`,
      }));

      const records = createOverrideRecords(commission, upline);

      expect(records.length).toBe(MAX_GENERATIONS);
    });

    it('should set all records to pending status', () => {
      const commission = createMockCommission({ commission_amount: 1000 });

      const upline = [{ id: 'sponsor-1' }, { id: 'sponsor-2' }];

      const records = createOverrideRecords(commission, upline);

      records.forEach((record) => {
        expect(record.status).toBe('pending');
      });
    });
  });

  describe('calculateAgentOverride', () => {
    it('should calculate generation 1 override (15%)', () => {
      const result = calculateAgentOverride(1000, 1);
      expect(result).toBe(150);
    });

    it('should calculate generation 2 override (5%)', () => {
      const result = calculateAgentOverride(1000, 2);
      expect(result).toBe(50);
    });

    it('should calculate generation 3 override (3%)', () => {
      const result = calculateAgentOverride(1000, 3);
      expect(result).toBe(30);
    });

    it('should calculate generation 4 override (2%)', () => {
      const result = calculateAgentOverride(1000, 4);
      expect(result).toBe(20);
    });

    it('should calculate generation 5 override (1%)', () => {
      const result = calculateAgentOverride(1000, 5);
      expect(result).toBe(10);
    });

    it('should calculate generation 6 override (0.5%)', () => {
      const result = calculateAgentOverride(1000, 6);
      expect(result).toBe(5);
    });

    it('should return 0 for generation 0', () => {
      const result = calculateAgentOverride(1000, 0);
      expect(result).toBe(0);
    });

    it('should return 0 for generation > 6', () => {
      const result = calculateAgentOverride(1000, 7);
      expect(result).toBe(0);
    });

    it('should return 0 for negative generation', () => {
      const result = calculateAgentOverride(1000, -1);
      expect(result).toBe(0);
    });

    it('should handle zero commission amount', () => {
      const result = calculateAgentOverride(0, 1);
      expect(result).toBe(0);
    });

    it('should handle large commission amounts', () => {
      const result = calculateAgentOverride(100000, 1);
      expect(result).toBe(15000);
    });

    it('should handle decimal commission amounts', () => {
      const result = calculateAgentOverride(999.99, 1);
      expect(result).toBeCloseTo(149.9985, 2);
    });
  });

  describe('getOverrideBreakdown', () => {
    it('should return breakdown for all 6 generations', () => {
      const breakdown = getOverrideBreakdown();

      expect(breakdown.length).toBe(6);
    });

    it('should have correct generation numbers', () => {
      const breakdown = getOverrideBreakdown();

      breakdown.forEach((gen, index) => {
        expect(gen.generation).toBe(index + 1);
      });
    });

    it('should format percentages correctly', () => {
      const breakdown = getOverrideBreakdown();

      expect(breakdown[0].percentage).toBe('15.0%');
      expect(breakdown[1].percentage).toBe('5.0%');
      expect(breakdown[2].percentage).toBe('3.0%');
      expect(breakdown[3].percentage).toBe('2.0%');
      expect(breakdown[4].percentage).toBe('1.0%');
      expect(breakdown[5].percentage).toBe('0.5%');
    });

    it('should format cumulative percentages correctly', () => {
      const breakdown = getOverrideBreakdown();

      expect(breakdown[0].cumulative).toBe('15.0%');
      expect(breakdown[1].cumulative).toBe('20.0%');
      expect(breakdown[2].cumulative).toBe('23.0%');
      expect(breakdown[3].cumulative).toBe('25.0%');
      expect(breakdown[4].cumulative).toBe('26.0%');
      expect(breakdown[5].cumulative).toBe('26.5%');
    });
  });

  describe('calculateTotalPotentialOverrides', () => {
    it('should calculate total potential overrides (26.5%)', () => {
      const result = calculateTotalPotentialOverrides(1000);

      // 15% + 5% + 3% + 2% + 1% + 0.5% = 26.5%
      expect(result).toBeCloseTo(265, 2);
    });

    it('should return 0 for zero commission', () => {
      const result = calculateTotalPotentialOverrides(0);

      expect(result).toBe(0);
    });

    it('should scale linearly with commission amount', () => {
      const result1 = calculateTotalPotentialOverrides(1000);
      const result2 = calculateTotalPotentialOverrides(2000);

      expect(result2).toBeCloseTo(result1 * 2, 2);
    });

    it('should handle large amounts', () => {
      const result = calculateTotalPotentialOverrides(100000);

      expect(result).toBeCloseTo(26500, 2);
    });
  });

  describe('determineGeneration', () => {
    it('should return 1 for direct sponsor', () => {
      const agentPath = '1.5.23.45';
      const sponsorPath = '1.5.23';

      const result = determineGeneration(agentPath, sponsorPath);

      expect(result).toBe(1);
    });

    it('should return 2 for second generation', () => {
      const agentPath = '1.5.23.45';
      const sponsorPath = '1.5';

      const result = determineGeneration(agentPath, sponsorPath);

      expect(result).toBe(2);
    });

    it('should return 3 for third generation', () => {
      const agentPath = '1.5.23.45';
      const sponsorPath = '1';

      const result = determineGeneration(agentPath, sponsorPath);

      expect(result).toBe(3);
    });

    it('should return 6 for sixth generation', () => {
      const agentPath = '1.2.3.4.5.6.7';
      const sponsorPath = '1';

      const result = determineGeneration(agentPath, sponsorPath);

      expect(result).toBe(6);
    });

    it('should return 0 for generation > 6', () => {
      const agentPath = '1.2.3.4.5.6.7.8';
      const sponsorPath = '1';

      const result = determineGeneration(agentPath, sponsorPath);

      expect(result).toBe(0);
    });

    it('should return 0 if sponsor is not in agent upline', () => {
      const agentPath = '1.5.23.45';
      const sponsorPath = '2.10';

      const result = determineGeneration(agentPath, sponsorPath);

      expect(result).toBe(0);
    });

    it('should return 0 if paths are same (same agent)', () => {
      const agentPath = '1.5.23';
      const sponsorPath = '1.5.23';

      const result = determineGeneration(agentPath, sponsorPath);

      expect(result).toBe(0);
    });

    it('should handle root path (founder)', () => {
      const agentPath = '1.5';
      const sponsorPath = '1';

      const result = determineGeneration(agentPath, sponsorPath);

      expect(result).toBe(1);
    });

    it('should handle simple single-level paths', () => {
      const agentPath = '1';
      const sponsorPath = '';

      const result = determineGeneration(agentPath, sponsorPath);

      // This is an edge case - sponsor path is empty, so startsWith returns true
      // but the calculation would be 1 level (agent) - 1 empty level = 0
      expect(result).toBe(0);
    });
  });

  describe('Override percentages configuration', () => {
    it('should have decreasing percentages for higher generations', () => {
      let previousPercentage = 1;

      for (let gen = 1; gen <= MAX_GENERATIONS; gen++) {
        const percentage = getOverridePercentage(gen);
        expect(percentage).toBeLessThanOrEqual(previousPercentage);
        previousPercentage = percentage;
      }
    });

    it('should have all generations configured', () => {
      expect(GENERATION_OVERRIDES.length).toBe(MAX_GENERATIONS);
    });

    it('should have cumulative percentages that increase', () => {
      let previousCumulative = 0;

      for (const gen of GENERATION_OVERRIDES) {
        expect(gen.cumulativePercentage).toBeGreaterThan(previousCumulative);
        previousCumulative = gen.cumulativePercentage;
      }
    });

    it('should have cumulative percentage equal sum of all previous', () => {
      let runningTotal = 0;

      for (const gen of GENERATION_OVERRIDES) {
        runningTotal += gen.percentage;
        expect(gen.cumulativePercentage).toBeCloseTo(runningTotal, 5);
      }
    });

    it('MAX_GENERATIONS should be 6', () => {
      expect(MAX_GENERATIONS).toBe(6);
    });
  });

  describe('Edge cases', () => {
    it('should handle commission with zero amount', () => {
      const commission = createMockCommission({ commission_amount: 0 });

      const upline = [
        { id: 'sponsor-1', firstName: 'Gen1', lastName: 'Sponsor' },
      ];

      const result = calculateOverrideChain(commission, upline);

      expect(result.overrides[0].overrideAmount).toBe(0);
      expect(result.totalOverrides).toBe(0);
    });

    it('should handle very small commission amounts', () => {
      const commission = createMockCommission({ commission_amount: 0.01 });

      const upline = [
        { id: 'sponsor-1', firstName: 'Gen1', lastName: 'Sponsor' },
      ];

      const result = calculateOverrideChain(commission, upline);

      expect(result.overrides[0].overrideAmount).toBeCloseTo(0.0015, 4);
    });

    it('should handle very large commission amounts', () => {
      const commission = createMockCommission({ commission_amount: 1000000 });

      const upline = [
        { id: 'sponsor-1', firstName: 'Gen1', lastName: 'Sponsor' },
      ];

      const result = calculateOverrideChain(commission, upline);

      expect(result.overrides[0].overrideAmount).toBe(150000);
    });
  });
});
