import { describe, it, expect } from 'vitest';
import {
  CAR_BONUS_TIERS,
  FAST_START_MILESTONES,
  FAST_START_CONFIG,
  QUALITY_GATES,
  getCarBonusTier,
  getNextCarBonusTier,
  getAvailableFastStartMilestones,
  calculateAssistBonus,
  calculateMaxFastStartBonus,
  passesQualityGates,
  getCurrentQuarterName,
  getQuarterDates,
} from '@/lib/config/incentives';

/**
 * Unit tests for Incentive Programs Configuration
 * Tests helper functions from lib/config/incentives.ts
 */

describe('Incentive Programs Configuration', () => {
  describe('CAR_BONUS_TIERS', () => {
    it('should have 4 tiers in correct order', () => {
      expect(CAR_BONUS_TIERS).toHaveLength(4);
      expect(CAR_BONUS_TIERS[0].tierName).toBe('Silver');
      expect(CAR_BONUS_TIERS[1].tierName).toBe('Gold');
      expect(CAR_BONUS_TIERS[2].tierName).toBe('Platinum');
      expect(CAR_BONUS_TIERS[3].tierName).toBe('Elite');
    });

    it('should have correct tier boundaries', () => {
      expect(CAR_BONUS_TIERS[0].minMonthlyPremium).toBe(15000);
      expect(CAR_BONUS_TIERS[0].maxMonthlyPremium).toBe(24999.99);
      expect(CAR_BONUS_TIERS[3].minMonthlyPremium).toBe(60000);
      expect(CAR_BONUS_TIERS[3].maxMonthlyPremium).toBeNull(); // Elite has no cap
    });

    it('should have correct bonus amounts', () => {
      expect(CAR_BONUS_TIERS[0].monthlyBonusAmount).toBe(300);
      expect(CAR_BONUS_TIERS[1].monthlyBonusAmount).toBe(500);
      expect(CAR_BONUS_TIERS[2].monthlyBonusAmount).toBe(800);
      expect(CAR_BONUS_TIERS[3].monthlyBonusAmount).toBe(1200);
    });
  });

  describe('FAST_START_MILESTONES', () => {
    it('should have 4 milestones', () => {
      expect(FAST_START_MILESTONES).toHaveLength(4);
    });

    it('should have correct milestone structure', () => {
      const firstPolicy = FAST_START_MILESTONES[0];
      expect(firstPolicy.milestoneName).toBe('First Policy Placed');
      expect(firstPolicy.milestoneType).toBe('first_policy');
      expect(firstPolicy.daysLimit).toBe(30);
      expect(firstPolicy.bonusAmount).toBe(100);
    });

    it('should have increasing premium thresholds', () => {
      const premiumMilestones = FAST_START_MILESTONES.filter(
        (m) => m.milestoneType === 'premium_threshold'
      );
      expect(premiumMilestones[0].premiumThreshold).toBe(5000);
      expect(premiumMilestones[1].premiumThreshold).toBe(10000);
      expect(premiumMilestones[2].premiumThreshold).toBe(25000);
    });
  });

  describe('getCarBonusTier', () => {
    it('should return null for premium below minimum', () => {
      expect(getCarBonusTier(10000)).toBeNull();
      expect(getCarBonusTier(14999)).toBeNull();
    });

    it('should return Silver tier for 15k-25k premium', () => {
      const tier = getCarBonusTier(15000);
      expect(tier?.tierName).toBe('Silver');
      expect(tier?.monthlyBonusAmount).toBe(300);

      const tierMid = getCarBonusTier(20000);
      expect(tierMid?.tierName).toBe('Silver');
    });

    it('should return Gold tier for 25k-40k premium', () => {
      const tier = getCarBonusTier(25000);
      expect(tier?.tierName).toBe('Gold');
      expect(tier?.monthlyBonusAmount).toBe(500);

      const tierMid = getCarBonusTier(35000);
      expect(tierMid?.tierName).toBe('Gold');
    });

    it('should return Platinum tier for 40k-60k premium', () => {
      const tier = getCarBonusTier(40000);
      expect(tier?.tierName).toBe('Platinum');
      expect(tier?.monthlyBonusAmount).toBe(800);
    });

    it('should return Elite tier for 60k+ premium', () => {
      const tier = getCarBonusTier(60000);
      expect(tier?.tierName).toBe('Elite');
      expect(tier?.monthlyBonusAmount).toBe(1200);

      // Elite has no cap
      const tierHigh = getCarBonusTier(150000);
      expect(tierHigh?.tierName).toBe('Elite');
    });
  });

  describe('getNextCarBonusTier', () => {
    it('should return Gold for Silver tier', () => {
      const next = getNextCarBonusTier('Silver');
      expect(next?.tierName).toBe('Gold');
    });

    it('should return Platinum for Gold tier', () => {
      const next = getNextCarBonusTier('Gold');
      expect(next?.tierName).toBe('Platinum');
    });

    it('should return Elite for Platinum tier', () => {
      const next = getNextCarBonusTier('Platinum');
      expect(next?.tierName).toBe('Elite');
    });

    it('should return null for Elite tier (top tier)', () => {
      const next = getNextCarBonusTier('Elite');
      expect(next).toBeNull();
    });

    it('should return null for invalid tier name', () => {
      const next = getNextCarBonusTier('Diamond');
      expect(next).toBeNull();
    });
  });

  describe('getAvailableFastStartMilestones', () => {
    it('should return all milestones for day 0', () => {
      const milestones = getAvailableFastStartMilestones(0);
      expect(milestones).toHaveLength(4);
    });

    it('should return milestones available at day 30', () => {
      const milestones = getAvailableFastStartMilestones(30);
      expect(milestones).toHaveLength(4);
      expect(milestones.some((m) => m.milestoneName === 'First Policy Placed')).toBe(true);
    });

    it('should return only 3 milestones after 30 days', () => {
      const milestones = getAvailableFastStartMilestones(31);
      expect(milestones).toHaveLength(3);
      expect(milestones.some((m) => m.milestoneName === 'First Policy Placed')).toBe(false);
    });

    it('should return only 2 milestones after 45 days', () => {
      const milestones = getAvailableFastStartMilestones(46);
      expect(milestones).toHaveLength(2);
    });

    it('should return only 1 milestone after 60 days', () => {
      const milestones = getAvailableFastStartMilestones(61);
      expect(milestones).toHaveLength(1);
      expect(milestones[0].milestoneName).toBe('$25,000 Premium');
    });

    it('should return empty array after 90 days', () => {
      const milestones = getAvailableFastStartMilestones(91);
      expect(milestones).toHaveLength(0);
    });
  });

  describe('calculateAssistBonus', () => {
    it('should return $50 for low premium policies', () => {
      expect(calculateAssistBonus(1000)).toBe(50);
      expect(calculateAssistBonus(2499)).toBe(50);
    });

    it('should return $75 for medium premium policies', () => {
      expect(calculateAssistBonus(2500)).toBe(75);
      expect(calculateAssistBonus(4999)).toBe(75);
    });

    it('should return $100 for high premium policies', () => {
      expect(calculateAssistBonus(5000)).toBe(100);
      expect(calculateAssistBonus(10000)).toBe(100);
      expect(calculateAssistBonus(50000)).toBe(100);
    });
  });

  describe('calculateMaxFastStartBonus', () => {
    it('should return total of all milestone bonuses', () => {
      const max = calculateMaxFastStartBonus();
      // $100 + $150 + $250 + $500 = $1000
      expect(max).toBe(1000);
      expect(max).toBe(FAST_START_CONFIG.maxTotalBonus);
    });
  });

  describe('passesQualityGates', () => {
    it('should pass when all requirements met', () => {
      const result = passesQualityGates(70, 85, false);
      expect(result.passed).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('should fail when placement ratio too low', () => {
      const result = passesQualityGates(50, 85, false);
      expect(result.passed).toBe(false);
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toContain('Placement ratio');
    });

    it('should fail when persistency ratio too low', () => {
      const result = passesQualityGates(70, 70, false);
      expect(result.passed).toBe(false);
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toContain('Persistency ratio');
    });

    it('should fail when has chargebacks', () => {
      const result = passesQualityGates(70, 85, true);
      expect(result.passed).toBe(false);
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toContain('chargebacks');
    });

    it('should fail with multiple reasons when all requirements not met', () => {
      const result = passesQualityGates(50, 70, true);
      expect(result.passed).toBe(false);
      expect(result.reasons).toHaveLength(3);
    });

    it('should pass at exactly minimum thresholds', () => {
      const result = passesQualityGates(
        QUALITY_GATES.minPlacementRatio,
        QUALITY_GATES.minPersistencyRatio,
        false
      );
      expect(result.passed).toBe(true);
    });
  });

  describe('getCurrentQuarterName', () => {
    it('should return Q1 for January-March', () => {
      expect(getCurrentQuarterName(new Date('2026-01-15'))).toBe('Q1 2026');
      expect(getCurrentQuarterName(new Date('2026-02-15'))).toBe('Q1 2026');
      expect(getCurrentQuarterName(new Date('2026-03-15'))).toBe('Q1 2026');
    });

    it('should return Q2 for April-June', () => {
      expect(getCurrentQuarterName(new Date('2026-04-15'))).toBe('Q2 2026');
      expect(getCurrentQuarterName(new Date('2026-05-15'))).toBe('Q2 2026');
      expect(getCurrentQuarterName(new Date('2026-06-15'))).toBe('Q2 2026');
    });

    it('should return Q3 for July-September', () => {
      expect(getCurrentQuarterName(new Date('2026-07-15'))).toBe('Q3 2026');
      expect(getCurrentQuarterName(new Date('2026-08-15'))).toBe('Q3 2026');
      expect(getCurrentQuarterName(new Date('2026-09-15'))).toBe('Q3 2026');
    });

    it('should return Q4 for October-December', () => {
      expect(getCurrentQuarterName(new Date('2026-10-15'))).toBe('Q4 2026');
      expect(getCurrentQuarterName(new Date('2026-11-15'))).toBe('Q4 2026');
      expect(getCurrentQuarterName(new Date('2026-12-15'))).toBe('Q4 2026');
    });
  });

  describe('getQuarterDates', () => {
    it('should return correct dates for Q1 2026', () => {
      const dates = getQuarterDates('Q1 2026');
      expect(dates).not.toBeNull();
      expect(dates!.startDate.getFullYear()).toBe(2026);
      expect(dates!.startDate.getMonth()).toBe(0); // January
      expect(dates!.startDate.getDate()).toBe(1);
      expect(dates!.endDate.getMonth()).toBe(2); // March
      expect(dates!.endDate.getDate()).toBe(31);
    });

    it('should return correct dates for Q2 2026', () => {
      const dates = getQuarterDates('Q2 2026');
      expect(dates).not.toBeNull();
      expect(dates!.startDate.getMonth()).toBe(3); // April
      expect(dates!.endDate.getMonth()).toBe(5); // June
      expect(dates!.endDate.getDate()).toBe(30);
    });

    it('should return correct dates for Q3 2026', () => {
      const dates = getQuarterDates('Q3 2026');
      expect(dates).not.toBeNull();
      expect(dates!.startDate.getMonth()).toBe(6); // July
      expect(dates!.endDate.getMonth()).toBe(8); // September
      expect(dates!.endDate.getDate()).toBe(30);
    });

    it('should return correct dates for Q4 2026', () => {
      const dates = getQuarterDates('Q4 2026');
      expect(dates).not.toBeNull();
      expect(dates!.startDate.getMonth()).toBe(9); // October
      expect(dates!.endDate.getMonth()).toBe(11); // December
      expect(dates!.endDate.getDate()).toBe(31);
    });

    it('should return null for invalid quarter format', () => {
      expect(getQuarterDates('Invalid')).toBeNull();
      expect(getQuarterDates('2026 Q1')).toBeNull(); // Wrong order
      expect(getQuarterDates('')).toBeNull();
      expect(getQuarterDates('Q 2026')).toBeNull(); // Missing quarter number
    });

    it('should handle edge case quarter numbers (wraps to next year)', () => {
      // Note: The function does not validate quarter is 1-4, it just parses
      // Q5 2026 returns dates in early 2027 due to month overflow
      const dates = getQuarterDates('Q5 2026');
      expect(dates).not.toBeNull(); // It parses but wraps to next year
    });
  });
});
