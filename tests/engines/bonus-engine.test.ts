/**
 * Bonus Engine Tests
 * Tests for all bonus calculations: Fast Start, Rank Advancement, Matching, Car, AI Copilot, Leadership Pool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateFastStart,
  calculateRankAdvancementBonus,
  calculateMatchingBonus,
  calculateCarBonus,
  calculateAICopilotBonuses,
  calculateLeadershipPool,
  getAgentBonusSummary,
} from '@/lib/engines/bonus-engine';
import { createMockAgent } from '../helpers/mocks';
import {
  FAST_START_TIERS,
  FAST_START_WINDOW_DAYS,
  FAST_START_MAX_REP,
  FAST_START_MAX_SPONSOR,
} from '@/lib/config/bonuses';

describe('Bonus Engine', () => {
  describe('calculateFastStart', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should be eligible for new agent within 90 days', () => {
      const now = new Date('2024-02-01T00:00:00Z');
      vi.setSystemTime(now);

      const agent = createMockAgent({
        created_at: '2024-01-15T00:00:00Z', // 17 days ago
      });

      const result = calculateFastStart(agent, 0);

      expect(result.eligible).toBe(true);
      expect(result.daysRemaining).toBe(FAST_START_WINDOW_DAYS - 17);
    });

    it('should not be eligible after 90 days', () => {
      const now = new Date('2024-05-01T00:00:00Z');
      vi.setSystemTime(now);

      const agent = createMockAgent({
        created_at: '2024-01-15T00:00:00Z', // 107 days ago
      });

      const result = calculateFastStart(agent, 50000);

      expect(result.eligible).toBe(false);
      expect(result.daysRemaining).toBe(0);
    });

    it('should return tier 0 with no bonuses for zero premium', () => {
      const now = new Date('2024-01-20T00:00:00Z');
      vi.setSystemTime(now);

      const agent = createMockAgent({
        created_at: '2024-01-01T00:00:00Z',
      });

      const result = calculateFastStart(agent, 0);

      expect(result.currentTier).toBe(0);
      expect(result.repBonus).toBe(0);
      expect(result.sponsorBonus).toBe(0);
    });

    it('should return tier 1 for $10,000+ premium', () => {
      const now = new Date('2024-01-20T00:00:00Z');
      vi.setSystemTime(now);

      const agent = createMockAgent({
        created_at: '2024-01-01T00:00:00Z',
      });

      const result = calculateFastStart(agent, 10000);

      expect(result.currentTier).toBe(1);
      expect(result.repBonus).toBe(FAST_START_TIERS[0].repBonus);
      expect(result.sponsorBonus).toBe(FAST_START_TIERS[0].sponsorBonus);
    });

    it('should return tier 2 for $25,000+ premium', () => {
      const now = new Date('2024-01-20T00:00:00Z');
      vi.setSystemTime(now);

      const agent = createMockAgent({
        created_at: '2024-01-01T00:00:00Z',
      });

      const result = calculateFastStart(agent, 25000);

      expect(result.currentTier).toBe(2);
      expect(result.repBonus).toBe(FAST_START_TIERS[1].repBonus);
      expect(result.sponsorBonus).toBe(FAST_START_TIERS[1].sponsorBonus);
    });

    it('should return tier 3 for $50,000+ premium', () => {
      const now = new Date('2024-01-20T00:00:00Z');
      vi.setSystemTime(now);

      const agent = createMockAgent({
        created_at: '2024-01-01T00:00:00Z',
      });

      const result = calculateFastStart(agent, 50000);

      expect(result.currentTier).toBe(3);
      expect(result.repBonus).toBe(FAST_START_TIERS[2].repBonus);
      expect(result.sponsorBonus).toBe(FAST_START_TIERS[2].sponsorBonus);
    });

    it('should return tier 4 for $100,000+ premium', () => {
      const now = new Date('2024-01-20T00:00:00Z');
      vi.setSystemTime(now);

      const agent = createMockAgent({
        created_at: '2024-01-01T00:00:00Z',
      });

      const result = calculateFastStart(agent, 100000);

      expect(result.currentTier).toBe(4);
      expect(result.repBonus).toBe(FAST_START_TIERS[3].repBonus);
      expect(result.sponsorBonus).toBe(FAST_START_TIERS[3].sponsorBonus);
    });

    it('should cap rep bonus at maximum', () => {
      const now = new Date('2024-01-20T00:00:00Z');
      vi.setSystemTime(now);

      const agent = createMockAgent({
        created_at: '2024-01-01T00:00:00Z',
      });

      const result = calculateFastStart(agent, 500000); // Very high premium

      // Should be capped at max values
      expect(result.repBonus).toBeLessThanOrEqual(FAST_START_MAX_REP);
      expect(result.sponsorBonus).toBeLessThanOrEqual(FAST_START_MAX_SPONSOR);
    });

    it('should calculate next tier correctly', () => {
      const now = new Date('2024-01-20T00:00:00Z');
      vi.setSystemTime(now);

      const agent = createMockAgent({
        created_at: '2024-01-01T00:00:00Z',
      });

      const result = calculateFastStart(agent, 15000); // Between tier 1 and 2

      expect(result.currentTier).toBe(1);
      expect(result.nextTier).not.toBeNull();
      expect(result.nextTier?.threshold).toBe(25000);
      expect(result.premiumNeededForNext).toBe(10000); // 25000 - 15000
    });

    it('should return null next tier when at max tier', () => {
      const now = new Date('2024-01-20T00:00:00Z');
      vi.setSystemTime(now);

      const agent = createMockAgent({
        created_at: '2024-01-01T00:00:00Z',
      });

      const result = calculateFastStart(agent, 150000); // Above tier 4

      expect(result.currentTier).toBe(4);
      expect(result.nextTier).toBeNull();
      expect(result.premiumNeededForNext).toBe(0);
    });
  });

  describe('calculateRankAdvancementBonus', () => {
    it('should return bonus for eligible rank in Phase 2+', () => {
      const result = calculateRankAdvancementBonus('pre_associate', 'associate', 150); // Phase 2

      expect(result.eligible).toBe(true);
      expect(result.type).toBe('rank_advancement');
      expect(result.amount).toBe(25); // $25 for associate
    });

    it('should return higher bonus for higher ranks', () => {
      const result = calculateRankAdvancementBonus('agent', 'sr_agent', 150); // Phase 2

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe(200); // $200 for sr_agent
    });

    it('should return MGA bonus amount', () => {
      const result = calculateRankAdvancementBonus('sr_agent', 'mga', 150); // Phase 2

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe(500); // $500 for MGA
    });

    it('should not be eligible in Phase 1', () => {
      const result = calculateRankAdvancementBonus('pre_associate', 'associate', 50); // Phase 1

      expect(result.eligible).toBe(false);
      expect(result.amount).toBe(0);
      expect(result.reason).toContain('Phase');
    });

    it('should require Phase 3 for associate_mga', () => {
      const phase2Result = calculateRankAdvancementBonus('mga', 'associate_mga', 150); // Phase 2
      const phase3Result = calculateRankAdvancementBonus('mga', 'associate_mga', 300); // Phase 3

      expect(phase2Result.eligible).toBe(false);
      expect(phase3Result.eligible).toBe(true);
      expect(phase3Result.amount).toBe(1000);
    });

    it('should require Phase 4 for national_mga', () => {
      const phase3Result = calculateRankAdvancementBonus('regional_mga', 'national_mga', 400); // Phase 3
      const phase4Result = calculateRankAdvancementBonus('regional_mga', 'national_mga', 600); // Phase 4

      expect(phase3Result.eligible).toBe(false);
      expect(phase4Result.eligible).toBe(true);
      expect(phase4Result.amount).toBe(5000);
    });

    it('should return premier_mga bonus in Phase 4', () => {
      const result = calculateRankAdvancementBonus('executive_mga', 'premier_mga', 600); // Phase 4

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe(20000);
    });
  });

  describe('calculateMatchingBonus', () => {
    it('should return not eligible for low ranks', () => {
      const agent = createMockAgent({ rank: 'associate' });

      const result = calculateMatchingBonus(agent, 1000, 0, 300); // Phase 3

      expect(result.eligible).toBe(false);
      expect(result.matchPercentage).toBe(0);
    });

    it('should return 3% match for sr_agent in Phase 3', () => {
      const agent = createMockAgent({ rank: 'sr_agent' });

      const result = calculateMatchingBonus(agent, 10000, 0, 300); // Phase 3

      expect(result.eligible).toBe(true);
      expect(result.matchPercentage).toBe(0.03);
      expect(result.monthlyCap).toBe(300);
      expect(result.amountThisMonth).toBe(300); // 10000 * 0.03 = 300, capped at 300
    });

    it('should return 5% match for MGA+ in Phase 3', () => {
      const agent = createMockAgent({ rank: 'mga' });

      const result = calculateMatchingBonus(agent, 5000, 0, 300); // Phase 3

      expect(result.eligible).toBe(true);
      expect(result.matchPercentage).toBe(0.05);
      expect(result.amountThisMonth).toBe(250); // 5000 * 0.05 = 250
    });

    it('should enforce monthly cap', () => {
      const agent = createMockAgent({ rank: 'mga' });

      const result = calculateMatchingBonus(agent, 50000, 0, 300); // Phase 3

      // 50000 * 0.05 = 2500, but cap is 400 for MGA
      expect(result.amountThisMonth).toBe(400);
      expect(result.remainingCap).toBe(0);
    });

    it('should subtract already paid amount from cap', () => {
      const agent = createMockAgent({ rank: 'mga' });

      const result = calculateMatchingBonus(agent, 50000, 200, 300); // Phase 3, already paid $200

      // Cap is 400, already paid 200, remaining is 200
      expect(result.amountThisMonth).toBe(200);
      expect(result.remainingCap).toBe(0);
    });

    it('should not be eligible before Phase 3', () => {
      const agent = createMockAgent({ rank: 'mga' });

      const result = calculateMatchingBonus(agent, 10000, 0, 100); // Phase 2

      expect(result.eligible).toBe(false);
    });
  });

  describe('calculateCarBonus', () => {
    it('should not be eligible before Phase 4', () => {
      const agent = createMockAgent({ rank: 'regional_mga' });

      const result = calculateCarBonus(agent, 300); // Phase 3

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Phase 4');
    });

    it('should not be eligible for low ranks in Phase 4', () => {
      const agent = createMockAgent({ rank: 'mga' });

      const result = calculateCarBonus(agent, 600); // Phase 4

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('not eligible');
    });

    it('should return $300/month for regional_mga in Phase 4', () => {
      const agent = createMockAgent({ rank: 'regional_mga' });

      const result = calculateCarBonus(agent, 600); // Phase 4

      expect(result.eligible).toBe(true);
      expect(result.type).toBe('car');
      expect(result.amount).toBe(300);
    });

    it('should return $500/month for national_mga in Phase 4', () => {
      const agent = createMockAgent({ rank: 'national_mga' });

      const result = calculateCarBonus(agent, 600);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe(500);
    });

    it('should return $750/month for executive_mga in Phase 4', () => {
      const agent = createMockAgent({ rank: 'executive_mga' });

      const result = calculateCarBonus(agent, 600);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe(750);
    });

    it('should return $1000/month for premier_mga in Phase 4', () => {
      const agent = createMockAgent({ rank: 'premier_mga' });

      const result = calculateCarBonus(agent, 600);

      expect(result.eligible).toBe(true);
      expect(result.amount).toBe(1000);
    });
  });

  describe('calculateAICopilotBonuses', () => {
    it('should return personal subscription bonus when subscribed', () => {
      const agent = createMockAgent({ ai_copilot_tier: 'pro' });

      const bonuses = calculateAICopilotBonuses(agent, 0, false);

      const personalBonus = bonuses.find(b => b.type === 'ai_copilot_personal');
      expect(personalBonus).toBeDefined();
      expect(personalBonus?.amount).toBe(10);
    });

    it('should not return personal bonus when not subscribed', () => {
      const agent = createMockAgent({ ai_copilot_tier: 'none' });

      const bonuses = calculateAICopilotBonuses(agent, 0, false);

      const personalBonus = bonuses.find(b => b.type === 'ai_copilot_personal');
      expect(personalBonus).toBeUndefined();
    });

    it('should return referral bonus for new referral', () => {
      const agent = createMockAgent({ ai_copilot_tier: 'none' });

      const bonuses = calculateAICopilotBonuses(agent, 0, true);

      const referralBonus = bonuses.find(b => b.type === 'ai_copilot_referral');
      expect(referralBonus).toBeDefined();
      expect(referralBonus?.amount).toBe(25);
    });

    it('should return team milestone bonus for 5+ subscribers', () => {
      const agent = createMockAgent({ ai_copilot_tier: 'none' });

      const bonuses = calculateAICopilotBonuses(agent, 5, false);

      const teamBonus = bonuses.find(b => b.description.includes('5+'));
      expect(teamBonus).toBeDefined();
      expect(teamBonus?.type).toBe('ai_copilot_team');
      expect(teamBonus?.amount).toBe(50);
    });

    it('should return team milestone bonus for 10+ subscribers', () => {
      const agent = createMockAgent({ ai_copilot_tier: 'none' });

      const bonuses = calculateAICopilotBonuses(agent, 10, false);

      const teamBonus = bonuses.find(b => b.description.includes('10'));
      expect(teamBonus).toBeDefined();
      expect(teamBonus?.amount).toBe(200);
    });

    it('should return team milestone bonus for 25+ subscribers', () => {
      const agent = createMockAgent({ ai_copilot_tier: 'none' });

      const bonuses = calculateAICopilotBonuses(agent, 25, false);

      const teamBonus = bonuses.find(b => b.description.includes('25'));
      expect(teamBonus).toBeDefined();
      expect(teamBonus?.amount).toBe(500);
    });

    it('should return all milestone bonuses when all thresholds met', () => {
      const agent = createMockAgent({ ai_copilot_tier: 'pro' });

      const bonuses = calculateAICopilotBonuses(agent, 30, true);

      // Should have: personal, referral, 5+, 10+, 25+
      expect(bonuses.length).toBe(5);
      const totalAmount = bonuses.reduce((sum, b) => sum + b.amount, 0);
      expect(totalAmount).toBe(10 + 25 + 50 + 200 + 500);
    });
  });

  describe('calculateLeadershipPool', () => {
    it('should not be eligible before Phase 4', () => {
      const agent = createMockAgent({ rank: 'regional_mga' });

      const result = calculateLeadershipPool(agent, 100000, 10, 300); // Phase 3

      expect(result.eligible).toBe(false);
      expect(result.shares).toBe(0);
      expect(result.estimatedPayout).toBe(0);
    });

    it('should not be eligible for ranks without shares', () => {
      const agent = createMockAgent({ rank: 'mga' });

      const result = calculateLeadershipPool(agent, 100000, 10, 600); // Phase 4

      expect(result.eligible).toBe(false);
    });

    it('should return 1 share for regional_mga in Phase 4', () => {
      const agent = createMockAgent({ rank: 'regional_mga' });

      const result = calculateLeadershipPool(agent, 100000, 10, 600); // Phase 4

      expect(result.eligible).toBe(true);
      expect(result.shares).toBe(1);
    });

    it('should return 2 shares for national_mga in Phase 4', () => {
      const agent = createMockAgent({ rank: 'national_mga' });

      const result = calculateLeadershipPool(agent, 100000, 10, 600);

      expect(result.eligible).toBe(true);
      expect(result.shares).toBe(2);
    });

    it('should return 3 shares for executive_mga in Phase 4', () => {
      const agent = createMockAgent({ rank: 'executive_mga' });

      const result = calculateLeadershipPool(agent, 100000, 10, 600);

      expect(result.eligible).toBe(true);
      expect(result.shares).toBe(3);
    });

    it('should return 4 shares for premier_mga in Phase 4', () => {
      const agent = createMockAgent({ rank: 'premier_mga' });

      const result = calculateLeadershipPool(agent, 100000, 10, 600);

      expect(result.eligible).toBe(true);
      expect(result.shares).toBe(4);
    });

    it('should calculate payout correctly', () => {
      const agent = createMockAgent({ rank: 'national_mga' }); // 2 shares

      // $100,000 total revenue * 1% pool = $1,000 pool
      // 10 total shares, so $100 per share
      // Agent has 2 shares = $200 estimated payout
      const result = calculateLeadershipPool(agent, 100000, 10, 600);

      expect(result.estimatedPayout).toBe(200);
    });

    it('should handle zero total shares gracefully', () => {
      const agent = createMockAgent({ rank: 'regional_mga' });

      const result = calculateLeadershipPool(agent, 100000, 0, 600);

      expect(result.eligible).toBe(true);
      expect(result.shares).toBe(1);
      expect(result.estimatedPayout).toBe(0); // Can't divide by zero
    });
  });

  describe('getAgentBonusSummary', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-02-01T00:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should calculate all bonuses in summary', () => {
      const agent = createMockAgent({
        rank: 'regional_mga',
        premium_90_days: 50000,
        created_at: '2024-01-15T00:00:00Z', // Within fast start window
        ai_copilot_tier: 'pro',
      });

      const summary = getAgentBonusSummary(agent, {
        agentCount: 600, // Phase 4
        firstGenEarnings: 5000,
        matchingPaidThisMonth: 0,
        totalAICopilotRevenue: 100000,
        totalLeadershipShares: 10,
      });

      // Fast Start should be calculated
      expect(summary.fastStart.eligible).toBe(true);
      expect(summary.fastStart.currentTier).toBe(3); // $50k premium

      // No rank advancement without previousRank
      expect(summary.rankAdvancement).toBeNull();

      // Matching should be calculated
      expect(summary.matching.eligible).toBe(true);

      // Car bonus should be eligible in Phase 4 for regional_mga
      expect(summary.car.eligible).toBe(true);
      expect(summary.car.amount).toBe(300);

      // Leadership pool should be calculated
      expect(summary.leadershipPool.eligible).toBe(true);
      expect(summary.leadershipPool.shares).toBe(1);
    });

    it('should include rank advancement when previousRank provided', () => {
      const agent = createMockAgent({
        rank: 'mga',
        premium_90_days: 50000,
        created_at: '2024-01-15T00:00:00Z',
      });

      const summary = getAgentBonusSummary(agent, {
        agentCount: 300, // Phase 3
        firstGenEarnings: 0,
        matchingPaidThisMonth: 0,
        totalAICopilotRevenue: 0,
        totalLeadershipShares: 0,
        previousRank: 'sr_agent',
      });

      expect(summary.rankAdvancement).not.toBeNull();
      expect(summary.rankAdvancement?.eligible).toBe(true);
      expect(summary.rankAdvancement?.amount).toBe(500);
    });

    it('should calculate total eligible bonuses correctly', () => {
      const agent = createMockAgent({
        rank: 'regional_mga',
        premium_90_days: 50000,
        created_at: '2024-01-15T00:00:00Z',
        ai_copilot_tier: 'pro',
      });

      const summary = getAgentBonusSummary(agent, {
        agentCount: 600, // Phase 4
        firstGenEarnings: 5000,
        matchingPaidThisMonth: 0,
        totalAICopilotRevenue: 100000,
        totalLeadershipShares: 10,
        previousRank: 'senior_mga',
      });

      // Should include:
      // - Fast Start rep bonus: $200 (tier 3)
      // - Rank advancement: $3500
      // - Matching: 5% of $5000 capped at $500 = $250
      // - Car: $300
      // - Leadership Pool: 1 share * ($100k * 1% / 10 shares) = $100

      expect(summary.totalEligibleBonuses).toBeGreaterThan(0);
      expect(summary.totalEligibleBonuses).toBe(
        summary.fastStart.repBonus +
        (summary.rankAdvancement?.amount ?? 0) +
        summary.matching.amountThisMonth +
        summary.car.amount +
        summary.leadershipPool.estimatedPayout
      );
    });

    it('should handle new agent with minimal metrics', () => {
      const agent = createMockAgent({
        rank: 'pre_associate',
        premium_90_days: 0,
        created_at: '2024-01-15T00:00:00Z',
        ai_copilot_tier: 'none',
      });

      const summary = getAgentBonusSummary(agent, {
        agentCount: 50, // Phase 1
        firstGenEarnings: 0,
        matchingPaidThisMonth: 0,
        totalAICopilotRevenue: 0,
        totalLeadershipShares: 0,
      });

      expect(summary.fastStart.eligible).toBe(true);
      expect(summary.fastStart.currentTier).toBe(0);
      expect(summary.matching.eligible).toBe(false);
      expect(summary.car.eligible).toBe(false);
      expect(summary.leadershipPool.eligible).toBe(false);
      expect(summary.totalEligibleBonuses).toBe(0);
    });
  });

  describe('Phase determination', () => {
    it('should be Phase 1 for 0-99 agents', () => {
      const agent = createMockAgent({ rank: 'associate' });
      const result = calculateRankAdvancementBonus('pre_associate', 'associate', 50);
      expect(result.eligible).toBe(false); // Phase 1 doesn't have rank advancement
    });

    it('should be Phase 2 for 100-249 agents', () => {
      const agent = createMockAgent({ rank: 'associate' });
      const result = calculateRankAdvancementBonus('pre_associate', 'associate', 150);
      expect(result.eligible).toBe(true); // Phase 2 has rank advancement
    });

    it('should be Phase 3 for 250-499 agents', () => {
      const agent = createMockAgent({ rank: 'mga' });
      const matching = calculateMatchingBonus(agent, 10000, 0, 300);
      expect(matching.eligible).toBe(true); // Phase 3 has matching bonus
    });

    it('should be Phase 4 for 500+ agents', () => {
      const agent = createMockAgent({ rank: 'regional_mga' });
      const car = calculateCarBonus(agent, 600);
      expect(car.eligible).toBe(true); // Phase 4 has car bonus
    });
  });
});
