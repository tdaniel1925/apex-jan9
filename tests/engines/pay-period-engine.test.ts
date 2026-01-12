/**
 * Pay Period Engine Tests
 * Tests for commission batching and pay period calculations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculatePayPeriodDates,
  getCurrentPayPeriod,
  canRecordCommission,
  isReadyForPayout,
  calculateAgentPeriodPayout,
  isDateInPayPeriod,
  DEFAULT_PAY_PERIOD_CONFIG,
  type PayPeriod,
  type PayPeriodConfig,
} from '@/lib/engines/pay-period-engine';

describe('Pay Period Engine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  describe('calculatePayPeriodDates', () => {
    it('should calculate weekly period dates correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z'); // Monday of week 3
      const result = calculatePayPeriodDates(date, 'weekly');

      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
      expect(result.cutoffDate).toBeDefined();
      expect(result.payoutDate).toBeDefined();

      // Start should be a Monday
      expect(result.startDate.getDay()).toBe(1);
      // End should be a Sunday
      expect(result.endDate.getDay()).toBe(0);
    });

    it('should calculate monthly period dates correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = calculatePayPeriodDates(date, 'monthly');

      expect(result.periodNumber).toBe(1); // January
      expect(result.year).toBe(2024);
      expect(result.startDate.getDate()).toBe(1);
      // Last day of January
      expect(result.endDate.getMonth()).toBe(0);
    });

    it('should calculate biweekly period dates correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = calculatePayPeriodDates(date, 'biweekly');

      expect(result.periodNumber).toBeGreaterThan(0);
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();

      // Period should be approximately 14 days (13 days difference + 1 day inclusive)
      const days = (result.endDate.getTime() - result.startDate.getTime()) / (24 * 60 * 60 * 1000);
      // Allow for timezone and rounding differences - should be between 12 and 15 days
      expect(days).toBeGreaterThanOrEqual(12);
      expect(days).toBeLessThanOrEqual(15);
    });

    it('should respect config for cutoff and payout dates', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const config: PayPeriodConfig = {
        ...DEFAULT_PAY_PERIOD_CONFIG,
        cutoffDaysBefore: 5,
        payoutDaysAfter: 10,
      };
      const result = calculatePayPeriodDates(date, 'monthly', config);

      // Cutoff should be 5 days before end
      const cutoffDaysBeforeEnd =
        (result.endDate.getTime() - result.cutoffDate.getTime()) / (24 * 60 * 60 * 1000);
      expect(Math.round(cutoffDaysBeforeEnd)).toBe(5);
    });
  });

  describe('getCurrentPayPeriod', () => {
    it('should return current pay period', () => {
      const period = getCurrentPayPeriod('monthly');

      expect(period.period_type).toBe('monthly');
      expect(period.period_number).toBe(1); // January
      expect(period.year).toBe(2024);
      expect(period.status).toBeDefined();
    });

    it('should return status as open when before cutoff', () => {
      // Jan 15 is before month end cutoff
      const period = getCurrentPayPeriod('monthly');
      expect(period.status).toBe('open');
    });

    it('should initialize totals to zero', () => {
      const period = getCurrentPayPeriod('monthly');

      expect(period.total_commissions).toBe(0);
      expect(period.total_overrides).toBe(0);
      expect(period.total_bonuses).toBe(0);
      expect(period.total_payout).toBe(0);
      expect(period.agent_count).toBe(0);
    });
  });

  describe('canRecordCommission', () => {
    it('should allow recording when period is open and before cutoff', () => {
      const period: PayPeriod = {
        id: 'period-1',
        period_type: 'monthly',
        period_number: 1,
        year: 2024,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        cutoff_date: '2024-01-29T23:59:59Z', // Future cutoff
        payout_date: '2024-02-05T00:00:00Z',
        status: 'open',
        total_commissions: 0,
        total_overrides: 0,
        total_bonuses: 0,
        total_payout: 0,
        agent_count: 0,
      };

      const result = canRecordCommission(period);
      expect(result).toBe(true);
    });

    it('should not allow recording when period is locked', () => {
      const period: PayPeriod = {
        id: 'period-1',
        period_type: 'monthly',
        period_number: 1,
        year: 2024,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        cutoff_date: '2024-01-29T23:59:59Z',
        payout_date: '2024-02-05T00:00:00Z',
        status: 'locked',
        total_commissions: 0,
        total_overrides: 0,
        total_bonuses: 0,
        total_payout: 0,
        agent_count: 0,
      };

      const result = canRecordCommission(period);
      expect(result).toBe(false);
    });

    it('should not allow recording when period is paid', () => {
      const period: PayPeriod = {
        id: 'period-1',
        period_type: 'monthly',
        period_number: 1,
        year: 2024,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        cutoff_date: '2024-01-29T23:59:59Z',
        payout_date: '2024-02-05T00:00:00Z',
        status: 'paid',
        total_commissions: 0,
        total_overrides: 0,
        total_bonuses: 0,
        total_payout: 0,
        agent_count: 0,
      };

      const result = canRecordCommission(period);
      expect(result).toBe(false);
    });
  });

  describe('isReadyForPayout', () => {
    it('should return true when processing and past payout date', () => {
      vi.setSystemTime(new Date('2024-02-10T12:00:00Z')); // Past payout date

      const period: PayPeriod = {
        id: 'period-1',
        period_type: 'monthly',
        period_number: 1,
        year: 2024,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        cutoff_date: '2024-01-29T23:59:59Z',
        payout_date: '2024-02-05T00:00:00Z',
        status: 'processing',
        total_commissions: 1000,
        total_overrides: 500,
        total_bonuses: 200,
        total_payout: 1700,
        agent_count: 5,
      };

      const result = isReadyForPayout(period);
      expect(result).toBe(true);
    });

    it('should return false when not in processing status', () => {
      vi.setSystemTime(new Date('2024-02-10T12:00:00Z'));

      const period: PayPeriod = {
        id: 'period-1',
        period_type: 'monthly',
        period_number: 1,
        year: 2024,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        cutoff_date: '2024-01-29T23:59:59Z',
        payout_date: '2024-02-05T00:00:00Z',
        status: 'open',
        total_commissions: 1000,
        total_overrides: 500,
        total_bonuses: 200,
        total_payout: 1700,
        agent_count: 5,
      };

      const result = isReadyForPayout(period);
      expect(result).toBe(false);
    });

    it('should return false before payout date', () => {
      vi.setSystemTime(new Date('2024-02-01T12:00:00Z')); // Before payout date

      const period: PayPeriod = {
        id: 'period-1',
        period_type: 'monthly',
        period_number: 1,
        year: 2024,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        cutoff_date: '2024-01-29T23:59:59Z',
        payout_date: '2024-02-05T00:00:00Z',
        status: 'processing',
        total_commissions: 1000,
        total_overrides: 500,
        total_bonuses: 200,
        total_payout: 1700,
        agent_count: 5,
      };

      const result = isReadyForPayout(period);
      expect(result).toBe(false);
    });
  });

  describe('calculateAgentPeriodPayout', () => {
    it('should calculate payout correctly', () => {
      const result = calculateAgentPeriodPayout('agent-1', 500, 300, 200);

      expect(result.agentId).toBe('agent-1');
      expect(result.commissions).toBe(500);
      expect(result.overrides).toBe(300);
      expect(result.bonuses).toBe(200);
      expect(result.grossPayout).toBe(1000);
    });

    it('should apply holdback percentage', () => {
      const config: PayPeriodConfig = {
        ...DEFAULT_PAY_PERIOD_CONFIG,
        holdbackPercentage: 0.1, // 10%
      };

      const result = calculateAgentPeriodPayout('agent-1', 500, 300, 200, config);

      expect(result.grossPayout).toBe(1000);
      expect(result.holdbackAmount).toBe(100); // 10% of 1000
      expect(result.netPayout).toBe(900);
    });

    it('should check minimum payout requirement', () => {
      const config: PayPeriodConfig = {
        ...DEFAULT_PAY_PERIOD_CONFIG,
        minimumPayout: 50,
      };

      const result = calculateAgentPeriodPayout('agent-1', 10, 10, 5, config);

      expect(result.grossPayout).toBe(25);
      expect(result.meetsMinimum).toBe(false);
    });

    it('should meet minimum when above threshold', () => {
      const config: PayPeriodConfig = {
        ...DEFAULT_PAY_PERIOD_CONFIG,
        minimumPayout: 25,
      };

      const result = calculateAgentPeriodPayout('agent-1', 50, 30, 20, config);

      expect(result.grossPayout).toBe(100);
      expect(result.meetsMinimum).toBe(true);
    });

    it('should handle zero amounts', () => {
      const result = calculateAgentPeriodPayout('agent-1', 0, 0, 0);

      expect(result.grossPayout).toBe(0);
      expect(result.netPayout).toBe(0);
    });
  });

  describe('isDateInPayPeriod', () => {
    it('should return true for date within period', () => {
      const period: PayPeriod = {
        id: 'period-1',
        period_type: 'monthly',
        period_number: 1,
        year: 2024,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        cutoff_date: '2024-01-29T23:59:59Z',
        payout_date: '2024-02-05T00:00:00Z',
        status: 'open',
        total_commissions: 0,
        total_overrides: 0,
        total_bonuses: 0,
        total_payout: 0,
        agent_count: 0,
      };

      const result = isDateInPayPeriod(new Date('2024-01-15T12:00:00Z'), period);
      expect(result).toBe(true);
    });

    it('should return false for date before period', () => {
      const period: PayPeriod = {
        id: 'period-1',
        period_type: 'monthly',
        period_number: 1,
        year: 2024,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        cutoff_date: '2024-01-29T23:59:59Z',
        payout_date: '2024-02-05T00:00:00Z',
        status: 'open',
        total_commissions: 0,
        total_overrides: 0,
        total_bonuses: 0,
        total_payout: 0,
        agent_count: 0,
      };

      const result = isDateInPayPeriod(new Date('2023-12-31T12:00:00Z'), period);
      expect(result).toBe(false);
    });

    it('should return false for date after period', () => {
      const period: PayPeriod = {
        id: 'period-1',
        period_type: 'monthly',
        period_number: 1,
        year: 2024,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        cutoff_date: '2024-01-29T23:59:59Z',
        payout_date: '2024-02-05T00:00:00Z',
        status: 'open',
        total_commissions: 0,
        total_overrides: 0,
        total_bonuses: 0,
        total_payout: 0,
        agent_count: 0,
      };

      const result = isDateInPayPeriod(new Date('2024-02-01T12:00:00Z'), period);
      expect(result).toBe(false);
    });
  });
});
