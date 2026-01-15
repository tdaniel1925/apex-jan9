/**
 * Rank Engine Tests
 * Tests for rank calculations, eligibility, and promotions
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRank,
  checkRankEligibility,
  getRankProgress,
  shouldPromote,
  shouldDemote,
  getRanksBelow,
  getRanksAbove,
  isManuallyAssignedRank,
} from '@/lib/engines/rank-engine';
import { createMockAgent } from '../helpers/mocks';
import { RANK_CONFIG } from '@/lib/config/ranks';
import type { Rank } from '@/lib/config/ranks';

describe('Rank Engine', () => {
  describe('isManuallyAssignedRank', () => {
    it('should return true for founder rank', () => {
      expect(isManuallyAssignedRank('founder')).toBe(true);
    });

    it('should return false for regular ranks', () => {
      expect(isManuallyAssignedRank('associate')).toBe(false);
      expect(isManuallyAssignedRank('mga')).toBe(false);
      expect(isManuallyAssignedRank('regional_mga')).toBe(false);
    });
  });

  describe('calculateRank', () => {
    it('should return pre_associate for new agent with no metrics', () => {
      const agent = createMockAgent({
        rank: 'pre_associate',
        premium_90_days: 0,
        active_agents_count: 0,
        personal_recruits_count: 0,
        mgas_in_downline: 0,
        persistency_rate: 0,
        placement_rate: 0,
      });

      expect(calculateRank(agent)).toBe('pre_associate');
    });

    it('should return associate when premium threshold met', () => {
      const agent = createMockAgent({
        rank: 'pre_associate',
        premium_90_days: 15000, // > 10000 required
        persistency_rate: 70, // > 60% required
        placement_rate: 85, // > 80% required
        active_agents_count: 0,
        personal_recruits_count: 0,
      });

      expect(calculateRank(agent)).toBe('associate');
    });

    it('should return sr_associate when premium threshold met', () => {
      const agent = createMockAgent({
        rank: 'associate',
        premium_90_days: 30000, // > 25000 required
        persistency_rate: 70,
        placement_rate: 85,
        active_agents_count: 0,
        personal_recruits_count: 0,
      });

      expect(calculateRank(agent)).toBe('sr_associate');
    });

    it('should return agent when premium threshold met', () => {
      const agent = createMockAgent({
        rank: 'sr_associate',
        premium_90_days: 50000, // > 45000 required
        persistency_rate: 70,
        placement_rate: 85,
        active_agents_count: 0,
        personal_recruits_count: 0,
      });

      expect(calculateRank(agent)).toBe('agent');
    });

    it('should return sr_agent when all requirements met', () => {
      const agent = createMockAgent({
        rank: 'agent',
        premium_90_days: 80000, // > 75000 required
        active_agents_count: 6, // > 5 required
        personal_recruits_count: 2, // > 1 required
        persistency_rate: 70,
        placement_rate: 85,
      });

      expect(calculateRank(agent)).toBe('sr_agent');
    });

    it('should return mga when all requirements met', () => {
      const agent = createMockAgent({
        rank: 'sr_agent',
        premium_90_days: 160000, // > 150000 required
        active_agents_count: 12, // > 10 required
        personal_recruits_count: 4, // > 3 required
        persistency_rate: 70,
        placement_rate: 85,
        mgas_in_downline: 0,
      });

      expect(calculateRank(agent)).toBe('mga');
    });

    it('should return associate_mga when mgas_in_downline met', () => {
      const agent = createMockAgent({
        rank: 'mga',
        premium_90_days: 160000,
        active_agents_count: 12,
        personal_recruits_count: 4,
        persistency_rate: 70,
        placement_rate: 85,
        mgas_in_downline: 3, // > 2 required
      });

      expect(calculateRank(agent)).toBe('associate_mga');
    });

    it('should return senior_mga when 4+ mgas in downline', () => {
      const agent = createMockAgent({
        rank: 'associate_mga',
        premium_90_days: 160000,
        active_agents_count: 12,
        personal_recruits_count: 4,
        persistency_rate: 70,
        placement_rate: 85,
        mgas_in_downline: 5, // > 4 required
      });

      expect(calculateRank(agent)).toBe('senior_mga');
    });

    it('should return regional_mga when 6+ mgas in downline', () => {
      const agent = createMockAgent({
        rank: 'senior_mga',
        premium_90_days: 160000,
        active_agents_count: 12,
        personal_recruits_count: 4,
        persistency_rate: 70,
        placement_rate: 85,
        mgas_in_downline: 7, // > 6 required
      });

      expect(calculateRank(agent)).toBe('regional_mga');
    });

    it('should not change founder rank (manually assigned)', () => {
      const agent = createMockAgent({
        rank: 'founder',
        premium_90_days: 500000,
        active_agents_count: 100,
        personal_recruits_count: 50,
        persistency_rate: 90,
        placement_rate: 95,
        mgas_in_downline: 20,
      });

      expect(calculateRank(agent)).toBe('founder');
    });
  });

  describe('checkRankEligibility', () => {
    it('should return eligible for pre_associate (no requirements)', () => {
      const agent = createMockAgent({
        premium_90_days: 0,
        active_agents_count: 0,
        personal_recruits_count: 0,
      });

      const eligibility = checkRankEligibility(agent, 'pre_associate');

      expect(eligibility.eligible).toBe(true);
      expect(eligibility.requirements.premium90Days.met).toBe(true);
    });

    it('should return not eligible when premium not met', () => {
      const agent = createMockAgent({
        premium_90_days: 5000, // < 10000 required
        persistency_rate: 70,
        placement_rate: 85,
      });

      const eligibility = checkRankEligibility(agent, 'associate');

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.requirements.premium90Days.met).toBe(false);
      expect(eligibility.requirements.premium90Days.current).toBe(5000);
      expect(eligibility.requirements.premium90Days.required).toBe(10000);
    });

    it('should return not eligible when persistency not met', () => {
      const agent = createMockAgent({
        premium_90_days: 15000,
        persistency_rate: 50, // < 60% required
        placement_rate: 85,
      });

      const eligibility = checkRankEligibility(agent, 'associate');

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.requirements.persistency.met).toBe(false);
    });

    it('should return not eligible when placement not met', () => {
      const agent = createMockAgent({
        premium_90_days: 15000,
        persistency_rate: 70,
        placement_rate: 70, // < 80% required
      });

      const eligibility = checkRankEligibility(agent, 'associate');

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.requirements.placement.met).toBe(false);
    });

    it('should check mgas_in_downline for MGA tiers', () => {
      const agent = createMockAgent({
        premium_90_days: 160000,
        active_agents_count: 12,
        personal_recruits_count: 4,
        persistency_rate: 70,
        placement_rate: 85,
        mgas_in_downline: 1, // < 2 required for associate_mga
      });

      const eligibility = checkRankEligibility(agent, 'associate_mga');

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.requirements.mgasInDownline?.met).toBe(false);
      expect(eligibility.requirements.mgasInDownline?.current).toBe(1);
      expect(eligibility.requirements.mgasInDownline?.required).toBe(2);
    });
  });

  describe('getRankProgress', () => {
    it('should return 100% for highest rank', () => {
      const agent = createMockAgent({
        rank: 'premier_mga',
      });

      const progress = getRankProgress(agent);

      expect(progress.currentRank).toBe('premier_mga');
      expect(progress.nextRank).toBeNull();
      expect(progress.progressToNext).toBe(100);
      expect(progress.eligibility).toBeNull();
    });

    it('should calculate progress percentage correctly', () => {
      const agent = createMockAgent({
        rank: 'pre_associate',
        premium_90_days: 5000, // 50% of 10000 required
        persistency_rate: 60,
        placement_rate: 80,
      });

      const progress = getRankProgress(agent);

      expect(progress.currentRank).toBe('pre_associate');
      expect(progress.nextRank).toBe('associate');
      expect(progress.progressToNext).toBe(50); // 50% of premium requirement met
    });

    it('should cap progress at 100% when exceeding requirements', () => {
      const agent = createMockAgent({
        rank: 'pre_associate',
        premium_90_days: 20000, // 200% of required
        persistency_rate: 90,
        placement_rate: 95,
      });

      const progress = getRankProgress(agent);

      expect(progress.progressToNext).toBe(100);
    });
  });

  describe('shouldPromote', () => {
    it('should return true when agent qualifies for higher rank', () => {
      const agent = createMockAgent({
        rank: 'pre_associate',
        premium_90_days: 15000, // Qualifies for associate
        persistency_rate: 70,
        placement_rate: 85,
      });

      const result = shouldPromote(agent);

      expect(result.shouldPromote).toBe(true);
      expect(result.newRank).toBe('associate');
    });

    it('should return false when agent is at correct rank', () => {
      const agent = createMockAgent({
        rank: 'associate',
        premium_90_days: 15000, // Exactly qualifies for associate
        persistency_rate: 70,
        placement_rate: 85,
      });

      const result = shouldPromote(agent);

      expect(result.shouldPromote).toBe(false);
      expect(result.newRank).toBeNull();
    });

    it('should not promote founder rank', () => {
      const agent = createMockAgent({
        rank: 'founder',
        premium_90_days: 500000,
        active_agents_count: 100,
        personal_recruits_count: 50,
        mgas_in_downline: 20,
      });

      const result = shouldPromote(agent);

      expect(result.shouldPromote).toBe(false);
      expect(result.newRank).toBeNull();
    });

    it('should promote multiple ranks at once if qualified', () => {
      const agent = createMockAgent({
        rank: 'pre_associate',
        premium_90_days: 100000, // Qualifies up to sr_agent
        active_agents_count: 6,
        personal_recruits_count: 2,
        persistency_rate: 70,
        placement_rate: 85,
      });

      const result = shouldPromote(agent);

      expect(result.shouldPromote).toBe(true);
      // Should promote to highest qualified rank
      expect(result.newRank).toBe('sr_agent');
    });
  });

  describe('shouldDemote', () => {
    it('should return true when agent no longer qualifies', () => {
      const agent = createMockAgent({
        rank: 'associate',
        premium_90_days: 5000, // No longer qualifies for associate
        persistency_rate: 70,
        placement_rate: 85,
      });

      const result = shouldDemote(agent);

      expect(result.shouldDemote).toBe(true);
      expect(result.newRank).toBe('pre_associate');
    });

    it('should return false when agent still qualifies', () => {
      const agent = createMockAgent({
        rank: 'associate',
        premium_90_days: 15000,
        persistency_rate: 70,
        placement_rate: 85,
      });

      const result = shouldDemote(agent);

      expect(result.shouldDemote).toBe(false);
      expect(result.newRank).toBeNull();
    });

    it('should not demote founder rank', () => {
      const agent = createMockAgent({
        rank: 'founder',
        premium_90_days: 0,
        active_agents_count: 0,
        personal_recruits_count: 0,
      });

      const result = shouldDemote(agent);

      expect(result.shouldDemote).toBe(false);
      expect(result.newRank).toBeNull();
    });
  });

  describe('getRanksBelow', () => {
    it('should return empty array for lowest rank', () => {
      const ranks = getRanksBelow('founder');
      expect(ranks).toEqual([]);
    });

    it('should return all lower ranks', () => {
      const ranks = getRanksBelow('mga');

      // MGA is order 6, should return orders 0-5
      expect(ranks).toContain('founder');
      expect(ranks).toContain('pre_associate');
      expect(ranks).toContain('associate');
      expect(ranks).toContain('sr_associate');
      expect(ranks).toContain('agent');
      expect(ranks).toContain('sr_agent');
      expect(ranks).not.toContain('mga');
      expect(ranks).not.toContain('regional_mga');
    });
  });

  describe('getRanksAbove', () => {
    it('should return empty array for highest rank', () => {
      const ranks = getRanksAbove('premier_mga');
      expect(ranks).toEqual([]);
    });

    it('should return all higher ranks', () => {
      const ranks = getRanksAbove('mga');

      // MGA is order 6, should return orders 7+
      expect(ranks).toContain('associate_mga');
      expect(ranks).toContain('senior_mga');
      expect(ranks).toContain('regional_mga');
      expect(ranks).toContain('national_mga');
      expect(ranks).toContain('executive_mga');
      expect(ranks).toContain('premier_mga');
      expect(ranks).not.toContain('mga');
      expect(ranks).not.toContain('sr_agent');
    });
  });

  describe('RANK_CONFIG integrity', () => {
    it('should have unique order for each rank', () => {
      const orders = Object.values(RANK_CONFIG).map(c => c.order);
      const uniqueOrders = new Set(orders);
      expect(orders.length).toBe(uniqueOrders.size);
    });

    it('should have all required fields for each rank', () => {
      for (const [rank, config] of Object.entries(RANK_CONFIG)) {
        expect(config.id).toBe(rank);
        expect(config.name).toBeTruthy();
        expect(config.shortName).toBeTruthy();
        expect(typeof config.order).toBe('number');
        expect(typeof config.requirements.premium90Days).toBe('number');
        expect(typeof config.requirements.activeAgents).toBe('number');
        expect(typeof config.requirements.personalRecruits).toBe('number');
        expect(typeof config.persistencyRequired).toBe('number');
        expect(typeof config.placementRequired).toBe('number');
      }
    });

    it('should have increasing requirements for higher ranks', () => {
      // Non-MGA ranks should have increasing premium requirements
      const nonMGARanks: Rank[] = ['pre_associate', 'associate', 'sr_associate', 'agent', 'sr_agent'];

      for (let i = 1; i < nonMGARanks.length; i++) {
        const prevReq = RANK_CONFIG[nonMGARanks[i - 1]].requirements.premium90Days;
        const currReq = RANK_CONFIG[nonMGARanks[i]].requirements.premium90Days;
        expect(currReq).toBeGreaterThanOrEqual(prevReq);
      }
    });

    it('should have increasing mgas_in_downline for MGA tiers', () => {
      const mgaTiers: Rank[] = [
        'associate_mga',
        'senior_mga',
        'regional_mga',
        'national_mga',
        'executive_mga',
        'premier_mga',
      ];

      for (let i = 1; i < mgaTiers.length; i++) {
        const prevReq = RANK_CONFIG[mgaTiers[i - 1]].requirements.mgasInDownline ?? 0;
        const currReq = RANK_CONFIG[mgaTiers[i]].requirements.mgasInDownline ?? 0;
        expect(currReq).toBeGreaterThan(prevReq);
      }
    });
  });
});
