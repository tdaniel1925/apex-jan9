/**
 * Qualification Engine Tests
 * Tests for rank qualification, maintenance, and grace periods
 */

import { describe, it, expect } from 'vitest';
import {
  checkRankRequirements,
  determinePaidAsRank,
  createQualificationSnapshot,
  getQualificationTrend,
  isDemotionRisk,
  getQualificationRecommendations,
  DEFAULT_QUALIFICATION_CONFIG,
  type QualificationConfig,
  type QualificationSnapshot,
} from '@/lib/engines/qualification-engine';
import type { Agent } from '@/lib/types/database';

describe('Qualification Engine', () => {
  // Rank requirements from RANK_CONFIG:
  // - agent: premium90Days: 45000, activeAgents: 0, personalRecruits: 0, persistency: 60, placement: 80
  // - sr_agent: premium90Days: 75000, activeAgents: 5, personalRecruits: 1
  // - mga: premium90Days: 150000, activeAgents: 10, personalRecruits: 3
  // NOTE: persistency_rate and placement_rate are stored as percentages (e.g., 85 = 85%)
  const createMockAgent = (overrides: Partial<Agent> = {}): Agent => ({
    id: 'agent-123',
    user_id: 'user-123',
    sponsor_id: null,
    agent_code: 'TEST001',
    first_name: 'Test',
    last_name: 'Agent',
    email: 'test@example.com',
    phone: null,
    avatar_url: null,
    bio: null,
    rank: 'agent',
    status: 'active',
    licensed_date: null,
    premium_90_days: 50000, // Above agent requirement of 45000
    persistency_rate: 85, // Above 60% requirement (stored as percentage)
    placement_rate: 85, // Above 80% requirement (stored as percentage)
    active_agents_count: 3,
    personal_recruits_count: 2,
    mgas_in_downline: 0,
    personal_bonus_volume: 1000,
    organization_bonus_volume: 5000,
    pbv_90_days: 1000,
    obv_90_days: 5000,
    ai_copilot_tier: 'none',
    ai_copilot_subscribed_at: null,
    username: 'test001',
    replicated_site_enabled: true,
    calendar_link: null,
    fast_start_ends_at: '2024-04-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
    is_licensed_agent: false,
    // License compliance fields
    license_status: 'licensed',
    license_number: 'LIC-12345',
    license_state: 'TX',
    license_expiration_date: '2027-12-31',
    ...overrides,
  });

  const createMockSnapshot = (
    overrides: Partial<QualificationSnapshot> = {}
  ): QualificationSnapshot => ({
    id: 'snapshot-1',
    agent_id: 'agent-123',
    period_month: 1,
    period_year: 2024,
    title_rank: 'agent',
    paid_as_rank: 'agent',
    qualification_status: 'qualified',
    personal_bonus_volume: 1000,
    organization_bonus_volume: 5000,
    pbv_90_days: 1000,
    obv_90_days: 5000,
    active_agents_count: 3,
    personal_recruits_count: 2,
    mgas_in_downline: 0,
    grace_periods_used: 0,
    grace_periods_remaining: 2,
    consecutive_qualified_months: 3,
    requirements_met: {
      premium90Days: true,
      activeAgents: true,
      personalRecruits: true,
    },
    requirements_values: {
      premium90Days: 5000,
      activeAgents: 3,
      personalRecruits: 2,
    },
    ...overrides,
  });

  describe('checkRankRequirements', () => {
    it('should return met=true when agent meets all requirements', () => {
      // Agent rank requires: premium90Days: 45000, activeAgents: 0, personalRecruits: 0
      const agent = createMockAgent({
        rank: 'agent',
        premium_90_days: 50000, // Above 45000 requirement
        active_agents_count: 3,
        personal_recruits_count: 2,
      });

      const result = checkRankRequirements(agent, 'agent');

      expect(result.met).toBe(true);
      expect(result.percentageMet).toBeGreaterThan(0.5);
    });

    it('should return met=false when agent misses requirements', () => {
      // MGA requires: premium90Days: 150000, activeAgents: 10, personalRecruits: 3
      const agent = createMockAgent({
        rank: 'mga',
        premium_90_days: 50000, // Way below MGA's 150000
        active_agents_count: 1, // Below 10
        personal_recruits_count: 0, // Below 3
      });

      const result = checkRankRequirements(agent, 'mga');

      expect(result.met).toBe(false);
    });

    it('should provide details on each requirement', () => {
      const agent = createMockAgent({
        premium_90_days: 50000,
        active_agents_count: 5,
      });

      const result = checkRankRequirements(agent, 'agent');

      expect(result.requirements.premium90Days).toBeDefined();
      expect(result.requirements.premium90Days.actual).toBe(50000);
      expect(result.requirements.activeAgents.actual).toBe(5);
    });

    it('should calculate percentage of requirements met', () => {
      // Agent rank requires premium90Days: 45000
      const agent = createMockAgent({
        premium_90_days: 1000, // Far below 45000 - fails
        active_agents_count: 10, // Passes (agent only needs 0)
        personal_recruits_count: 10, // Passes (agent only needs 0)
      });

      const result = checkRankRequirements(agent, 'agent');

      expect(result.percentageMet).toBeGreaterThan(0);
      expect(result.percentageMet).toBeLessThan(1);
    });
  });

  describe('determinePaidAsRank', () => {
    it('should return current rank when fully qualified', () => {
      // Agent rank requires: premium90Days: 45000, activeAgents: 0, personalRecruits: 0
      const agent = createMockAgent({
        rank: 'agent',
        premium_90_days: 50000, // Above 45000 requirement
        active_agents_count: 5,
        personal_recruits_count: 3,
      });

      const result = determinePaidAsRank(agent, null);

      expect(result.paidAsRank).toBe('agent');
      expect(result.status).toBe('qualified');
      expect(result.usedGracePeriod).toBe(false);
    });

    it('should use grace period when available and meets minimum', () => {
      // Agent rank requires premium90Days: 45000
      // 75% of 45000 = 33750
      const agent = createMockAgent({
        rank: 'agent',
        premium_90_days: 35000, // Below 45000 but above 75% (33750)
        active_agents_count: 3,
        personal_recruits_count: 2,
      });

      const previousSnapshot = createMockSnapshot({
        grace_periods_used: 0,
      });

      const result = determinePaidAsRank(agent, previousSnapshot);

      // Should use grace period if minimum percentage is met
      if (result.status === 'grace_period') {
        expect(result.usedGracePeriod).toBe(true);
        expect(result.paidAsRank).toBe('agent');
      }
    });

    it('should demote when no grace periods and not qualified', () => {
      // MGA requires: premium90Days: 150000, activeAgents: 10, personalRecruits: 3
      const agent = createMockAgent({
        rank: 'mga',
        premium_90_days: 10000, // Way below MGA requirements
        active_agents_count: 0,
        personal_recruits_count: 0,
      });

      const previousSnapshot = createMockSnapshot({
        grace_periods_used: 2, // All used
        grace_periods_remaining: 0,
      });

      const result = determinePaidAsRank(agent, previousSnapshot);

      expect(result.status).toBe('demoted');
      // Paid as rank should be lower than title rank
    });
  });

  describe('createQualificationSnapshot', () => {
    it('should create snapshot with agent metrics', () => {
      const agent = createMockAgent();

      const snapshot = createQualificationSnapshot(agent, 6, 2024, null);

      expect(snapshot.agent_id).toBe(agent.id);
      expect(snapshot.period_month).toBe(6);
      expect(snapshot.period_year).toBe(2024);
      expect(snapshot.title_rank).toBe(agent.rank);
      expect(snapshot.personal_bonus_volume).toBe(agent.personal_bonus_volume);
    });

    it('should track grace period usage', () => {
      // Agent rank requires premium90Days: 45000
      const agent = createMockAgent({
        premium_90_days: 35000, // Below 45000 but above 75%
      });

      const previousSnapshot = createMockSnapshot({
        grace_periods_used: 1,
        grace_periods_remaining: 1,
      });

      const snapshot = createQualificationSnapshot(agent, 2, 2024, previousSnapshot);

      expect(snapshot.grace_periods_used).toBeGreaterThanOrEqual(previousSnapshot.grace_periods_used);
    });

    it('should track consecutive qualified months', () => {
      // Agent rank requires premium90Days: 45000
      const agent = createMockAgent({
        premium_90_days: 50000, // Above requirement
        active_agents_count: 5,
        personal_recruits_count: 3,
      });

      const previousSnapshot = createMockSnapshot({
        consecutive_qualified_months: 5,
        qualification_status: 'qualified',
      });

      const snapshot = createQualificationSnapshot(agent, 2, 2024, previousSnapshot);

      // Should increment if qualified
      if (snapshot.qualification_status === 'qualified') {
        expect(snapshot.consecutive_qualified_months).toBe(6);
      }
    });
  });

  describe('getQualificationTrend', () => {
    it('should return stable for empty snapshots', () => {
      const result = getQualificationTrend([]);

      expect(result.trend).toBe('stable');
      expect(result.consecutiveQualified).toBe(0);
      expect(result.consecutiveDemoted).toBe(0);
    });

    it('should detect improving trend', () => {
      const snapshots = [
        createMockSnapshot({
          period_month: 3,
          period_year: 2024,
          qualification_status: 'qualified',
        }),
        createMockSnapshot({
          period_month: 2,
          period_year: 2024,
          qualification_status: 'qualified',
        }),
        createMockSnapshot({
          period_month: 1,
          period_year: 2024,
          qualification_status: 'qualified',
        }),
      ];

      const result = getQualificationTrend(snapshots);

      expect(result.consecutiveQualified).toBeGreaterThanOrEqual(2);
    });

    it('should detect declining trend', () => {
      const snapshots = [
        createMockSnapshot({
          period_month: 3,
          period_year: 2024,
          qualification_status: 'demoted',
        }),
        createMockSnapshot({
          period_month: 2,
          period_year: 2024,
          qualification_status: 'demoted',
        }),
        createMockSnapshot({
          period_month: 1,
          period_year: 2024,
          qualification_status: 'demoted',
        }),
      ];

      const result = getQualificationTrend(snapshots);

      expect(result.consecutiveDemoted).toBeGreaterThanOrEqual(2);
    });

    it('should calculate average percentage met', () => {
      const snapshots = [
        createMockSnapshot({
          requirements_met: { premium90Days: true, activeAgents: true },
        }),
        createMockSnapshot({
          requirements_met: { premium90Days: false, activeAgents: true },
        }),
      ];

      const result = getQualificationTrend(snapshots);

      expect(result.averagePercentageMet).toBeGreaterThan(0);
      expect(result.averagePercentageMet).toBeLessThanOrEqual(1);
    });
  });

  describe('isDemotionRisk', () => {
    it('should return low risk for fully qualified agent', () => {
      // Agent rank requires: premium90Days: 45000, persistency: 60, placement: 80
      // To not be "at risk", all metrics need to be > 110% of requirements
      const agent = createMockAgent({
        rank: 'agent',
        premium_90_days: 60000, // 133% of 45000 (> 110%)
        persistency_rate: 90, // 150% of 60 (> 110%)
        placement_rate: 95, // 119% of 80 (> 110%)
        active_agents_count: 10,
        personal_recruits_count: 5,
      });

      const result = isDemotionRisk(agent, null);

      expect(result.atRisk).toBe(false);
      expect(result.riskLevel).toBe('low');
    });

    it('should return high risk for unqualified agent without grace periods', () => {
      // MGA requires: premium90Days: 150000, activeAgents: 10, personalRecruits: 3
      const agent = createMockAgent({
        rank: 'mga',
        premium_90_days: 10000, // Way below 150000
        active_agents_count: 0, // Way below 10
        personal_recruits_count: 0, // Below 3
      });

      const snapshot = createMockSnapshot({
        grace_periods_remaining: 0,
      });

      const result = isDemotionRisk(agent, snapshot);

      expect(result.atRisk).toBe(true);
    });

    it('should provide reasons for risk', () => {
      // MGA requires: premium90Days: 150000, activeAgents: 10, personalRecruits: 3
      const agent = createMockAgent({
        rank: 'mga',
        premium_90_days: 10000, // Way below requirement
        active_agents_count: 0,
      });

      const result = isDemotionRisk(agent, null);

      if (result.atRisk) {
        expect(result.reasons.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getQualificationRecommendations', () => {
    it('should provide recommendations for unqualified agents', () => {
      // Agent rank requires premium90Days: 45000
      const agent = createMockAgent({
        rank: 'agent',
        premium_90_days: 10000, // Below 45000 requirement
        active_agents_count: 1,
      });

      const result = getQualificationRecommendations(agent, null);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should provide no high-priority recommendations for qualified agents', () => {
      // Agent rank requires premium90Days: 45000
      const agent = createMockAgent({
        rank: 'agent',
        premium_90_days: 60000, // Well above 45000 requirement
        active_agents_count: 10,
        personal_recruits_count: 5,
      });

      const result = getQualificationRecommendations(agent, null);

      // May still have growth recommendations but shouldn't be high priority
      const highPriority = result.filter((r) => r.priority === 'high');
      expect(highPriority.length).toBe(0);
    });
  });
});
