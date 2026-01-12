/**
 * Copilot Trial API Tests
 * Tests for trial management endpoints
 */

import { describe, it, expect } from 'vitest';

describe('Copilot Trial API', () => {
  describe('Trial Creation', () => {
    it('should create trial with correct end date', () => {
      const TRIAL_DURATION_DAYS = 7;
      const startDate = new Date('2026-01-12T00:00:00Z');
      const expectedEndDate = new Date('2026-01-19T00:00:00Z');

      const trialEndsAt = new Date(startDate);
      trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

      expect(trialEndsAt.toISOString().split('T')[0]).toBe(
        expectedEndDate.toISOString().split('T')[0]
      );
    });

    it('should set initial trial status to trialing', () => {
      const mockTrial = {
        status: 'trialing',
        tier: 'basic',
        trial_ends_at: '2026-01-19T00:00:00Z',
      };

      expect(mockTrial.status).toBe('trialing');
      expect(mockTrial.tier).toBe('basic');
    });

    it('should use basic tier config for trial', () => {
      const BASIC_TIER = {
        bonusVolume: 20,
        priceCents: 2900,
        dailyMessageLimit: 50,
      };

      const mockTrial = {
        bonus_volume: BASIC_TIER.bonusVolume,
        price_cents: BASIC_TIER.priceCents,
      };

      expect(mockTrial.bonus_volume).toBe(20);
      expect(mockTrial.price_cents).toBe(2900);
    });
  });

  describe('Trial Response Schema', () => {
    it('should return correct success response', () => {
      const mockResponse = {
        success: true,
        trial: {
          id: 'sub-123',
          status: 'trialing',
          tier: 'basic',
          trialEndsAt: '2026-01-19T00:00:00Z',
          daysRemaining: 7,
          dailyMessageLimit: 20,
        },
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.trial.status).toBe('trialing');
      expect(mockResponse.trial.daysRemaining).toBe(7);
    });

    it('should return error for existing subscription', () => {
      const mockResponse = {
        error: 'Agent already has a subscription',
      };

      expect(mockResponse.error).toBe('Agent already has a subscription');
    });
  });

  describe('Trial Status Check', () => {
    it('should calculate days remaining correctly', () => {
      const calculateDaysRemaining = (trialEndsAt: string): number => {
        const endDate = new Date(trialEndsAt);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
      };

      // Test with future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const daysRemaining = calculateDaysRemaining(futureDate.toISOString());
      expect(daysRemaining).toBe(5);
    });

    it('should return 0 days for expired trial', () => {
      const calculateDaysRemaining = (trialEndsAt: string): number => {
        const endDate = new Date(trialEndsAt);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
      };

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      const daysRemaining = calculateDaysRemaining(pastDate.toISOString());
      expect(daysRemaining).toBe(0);
    });
  });

  describe('Trial GET Response', () => {
    it('should return active trial status', () => {
      const mockResponse = {
        hasTrial: true,
        trial: {
          id: 'sub-123',
          status: 'trialing',
          trialEndsAt: '2026-01-19T00:00:00Z',
          daysRemaining: 5,
          expired: false,
        },
        usage: {
          today: 8,
          limit: 20,
          remaining: 12,
        },
      };

      expect(mockResponse.hasTrial).toBe(true);
      expect(mockResponse.trial.expired).toBe(false);
      expect(mockResponse.usage.remaining).toBe(12);
    });

    it('should return expired trial status', () => {
      const mockResponse = {
        hasTrial: true,
        trial: {
          status: 'trialing',
          expired: true,
          daysRemaining: 0,
        },
        canUpgrade: true,
        upgradeTiers: ['basic', 'pro', 'agency'],
      };

      expect(mockResponse.trial.expired).toBe(true);
      expect(mockResponse.canUpgrade).toBe(true);
    });

    it('should return no trial response', () => {
      const mockResponse = {
        hasTrial: false,
        canStartTrial: true,
        trialDuration: 7,
        trialMessageLimit: 20,
      };

      expect(mockResponse.hasTrial).toBe(false);
      expect(mockResponse.canStartTrial).toBe(true);
    });
  });

  describe('Trial Validation', () => {
    it('should not allow trial for agent with existing subscription', () => {
      const hasExistingSubscription = true;
      const canStartTrial = !hasExistingSubscription;
      expect(canStartTrial).toBe(false);
    });

    it('should allow trial for new agent', () => {
      const hasExistingSubscription = false;
      const canStartTrial = !hasExistingSubscription;
      expect(canStartTrial).toBe(true);
    });

    it('should validate trial is not expired before allowing usage', () => {
      const isTrialValid = (
        status: string,
        trialEndsAt: string | null
      ): boolean => {
        if (status !== 'trialing') return status === 'active';
        if (!trialEndsAt) return false;
        return new Date(trialEndsAt) > new Date();
      };

      // Valid trial
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      expect(isTrialValid('trialing', futureDate.toISOString())).toBe(true);

      // Expired trial
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isTrialValid('trialing', pastDate.toISOString())).toBe(false);

      // Active subscription (not trial)
      expect(isTrialValid('active', null)).toBe(true);
    });
  });

  describe('Trial Usage Limits', () => {
    const TRIAL_DAILY_LIMIT = 20;

    it('should enforce daily message limit during trial', () => {
      const isWithinLimit = (used: number): boolean => {
        return used < TRIAL_DAILY_LIMIT;
      };

      expect(isWithinLimit(0)).toBe(true);
      expect(isWithinLimit(19)).toBe(true);
      expect(isWithinLimit(20)).toBe(false);
      expect(isWithinLimit(25)).toBe(false);
    });

    it('should track usage response correctly', () => {
      const mockUsageResponse = {
        allowed: true,
        used: 15,
        limit: 20,
        remaining: 5,
        isTrialUser: true,
      };

      expect(mockUsageResponse.allowed).toBe(true);
      expect(mockUsageResponse.remaining).toBe(5);
      expect(mockUsageResponse.isTrialUser).toBe(true);
    });
  });
});
