/**
 * Clawback Engine Tests
 * Tests commission reversal calculations and validation
 */

import { describe, it, expect } from 'vitest';
import {
  calculateClawbackAmounts,
  createClawbackRecord,
  createClawbackDebitTransactions,
  checkDemotionAfterClawback,
  identifyRelatedBonuses,
  getClawbackPriority,
  validateClawback,
  formatClawbackSummary,
  type ClawbackEvent,
  type ClawbackResult,
} from '@/lib/engines/clawback-engine';
import type { Commission, Override, Bonus, Agent } from '@/lib/types/database';

describe('Clawback Engine', () => {
  const mockCommission: Commission = {
    id: 'comm-123',
    agent_id: 'agent-123',
    carrier: 'columbus_life',
    policy_number: 'POL-123',
    premium_amount: 1000,
    commission_rate: 0.15,
    commission_amount: 150,
    policy_date: '2024-01-01',
    status: 'paid',
    source: 'smart_office',
    bonus_volume: 100,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockOverrides: Override[] = [
    {
      id: 'over-1',
      commission_id: 'comm-123',
      agent_id: 'upline-1',
      source_agent_id: 'agent-123',
      generation: 1,
      override_rate: 0.15,
      override_amount: 15,
      status: 'paid',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'over-2',
      commission_id: 'comm-123',
      agent_id: 'upline-2',
      source_agent_id: 'agent-123',
      generation: 2,
      override_rate: 0.05,
      override_amount: 5,
      status: 'paid',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  // Agent rank requires: premium90Days: 45000, activeAgents: 0, personalRecruits: 0, persistency: 60, placement: 80
  // NOTE: persistency_rate and placement_rate are stored as percentages (e.g., 80 = 80%)
  const mockAgent: Agent = {
    id: 'agent-123',
    user_id: 'user-123',
    sponsor_id: 'upline-1',
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
    premium_90_days: 50000, // Above 45000 requirement for 'agent' rank
    persistency_rate: 80, // Above 60% requirement (stored as percentage)
    placement_rate: 85, // Above 80% requirement (stored as percentage)
    active_agents_count: 0,
    personal_recruits_count: 0,
    mgas_in_downline: 0,
    personal_bonus_volume: 500,
    organization_bonus_volume: 1000,
    pbv_90_days: 500,
    obv_90_days: 1000,
    ai_copilot_tier: 'none',
    ai_copilot_subscribed_at: null,
    username: 'test001',
    replicated_site_enabled: true,
    calendar_link: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    fast_start_ends_at: '2024-04-01T00:00:00Z',
    is_licensed_agent: false,
  };

  describe('calculateClawbackAmounts', () => {
    it('should calculate full clawback amounts', () => {
      const result = calculateClawbackAmounts(mockCommission, mockOverrides, 1.0);

      expect(result.commissionClawback).toBe(150);
      expect(result.overrideClawbacks).toHaveLength(2);
      expect(result.overrideClawbacks[0].amount).toBe(15);
      expect(result.overrideClawbacks[1].amount).toBe(5);
      expect(result.totalClawback).toBe(170); // 150 + 15 + 5
    });

    it('should calculate partial clawback amounts (50%)', () => {
      const result = calculateClawbackAmounts(mockCommission, mockOverrides, 0.5);

      expect(result.commissionClawback).toBe(75); // 150 * 0.5
      expect(result.overrideClawbacks[0].amount).toBe(7.5); // 15 * 0.5
      expect(result.overrideClawbacks[1].amount).toBe(2.5); // 5 * 0.5
      expect(result.totalClawback).toBe(85);
    });

    it('should handle no overrides', () => {
      const result = calculateClawbackAmounts(mockCommission, [], 1.0);

      expect(result.commissionClawback).toBe(150);
      expect(result.overrideClawbacks).toHaveLength(0);
      expect(result.totalClawback).toBe(150);
    });
  });

  describe('createClawbackRecord', () => {
    it('should create a clawback record with correct fields', () => {
      const event: ClawbackEvent = {
        type: 'refund',
        commissionId: 'comm-123',
        reason: 'Customer requested refund',
        initiatedBy: 'admin-1',
      };

      const record = createClawbackRecord(event, mockCommission, 170);

      expect(record.commission_id).toBe('comm-123');
      expect(record.clawback_type).toBe('refund');
      expect(record.original_amount).toBe(150);
      expect(record.clawback_amount).toBe(170);
      expect(record.reason).toBe('Customer requested refund');
      expect(record.initiated_by).toBe('admin-1');
      expect(record.status).toBe('pending');
    });
  });

  describe('createClawbackDebitTransactions', () => {
    it('should create debit transaction with correct balance', () => {
      const result = createClawbackDebitTransactions(
        'agent-123',
        500, // current balance
        150, // clawback amount
        'commission',
        'Clawback: refund',
        'clawback-123'
      );

      expect(result.transaction.agent_id).toBe('agent-123');
      expect(result.transaction.type).toBe('debit');
      expect(result.transaction.category).toBe('commission');
      expect(result.transaction.amount).toBe(150);
      expect(result.transaction.balance_after).toBe(350);
      expect(result.newBalance).toBe(350);
    });

    it('should not allow negative balance', () => {
      const result = createClawbackDebitTransactions(
        'agent-123',
        100, // current balance less than clawback
        150, // clawback amount
        'commission',
        'Clawback: refund',
        'clawback-123'
      );

      expect(result.transaction.balance_after).toBe(0);
      expect(result.newBalance).toBe(0);
    });
  });

  describe('checkDemotionAfterClawback', () => {
    it('should not demote if still qualified', () => {
      const result = checkDemotionAfterClawback(mockAgent, 50);

      expect(result.shouldDemote).toBe(false);
    });

    it('should indicate demotion when premium drops below threshold', () => {
      // Create an agent whose premium_90_days is below 'agent' threshold (45000)
      // so they would be calculated at a lower rank
      const underqualifiedAgent = {
        ...mockAgent,
        rank: 'agent' as const,
        premium_90_days: 10000, // Below 45000 agent requirement
        personal_bonus_volume: 100,
        pbv_90_days: 100,
      };
      const result = checkDemotionAfterClawback(underqualifiedAgent, 50);

      // Agent is already below threshold, so demotion should be recommended
      expect(result.shouldDemote).toBe(true);
    });
  });

  describe('identifyRelatedBonuses', () => {
    const mockBonuses: Bonus[] = [
      {
        id: 'bonus-1',
        agent_id: 'agent-123',
        bonus_type: 'fast_start',
        amount: 100,
        description: 'Fast start bonus',
        reference_id: 'comm-123',
        status: 'paid',
        payout_date: '2024-01-15',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'bonus-2',
        agent_id: 'other-agent',
        bonus_type: 'rank_advancement',
        amount: 500,
        description: 'Rank advancement',
        reference_id: 'other-comm',
        status: 'paid',
        payout_date: '2024-01-15',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    it('should identify bonuses related to commission', () => {
      const related = identifyRelatedBonuses(mockBonuses, 'comm-123', 'agent-123');

      expect(related).toHaveLength(1);
      expect(related[0].id).toBe('bonus-1');
    });

    it('should not include unrelated bonuses', () => {
      const related = identifyRelatedBonuses(mockBonuses, 'comm-999', 'other-agent-999');

      expect(related).toHaveLength(0);
    });
  });

  describe('getClawbackPriority', () => {
    it('should return highest priority for fraud', () => {
      expect(getClawbackPriority('fraud')).toBe(1);
    });

    it('should return lower priority for refund', () => {
      expect(getClawbackPriority('refund')).toBe(4);
    });

    it('should return lowest priority for admin_adjustment', () => {
      expect(getClawbackPriority('admin_adjustment')).toBe(8);
    });
  });

  describe('validateClawback', () => {
    it('should validate valid clawback request', () => {
      const event: ClawbackEvent = {
        type: 'refund',
        commissionId: 'comm-123',
        reason: 'Refund requested',
        initiatedBy: 'admin-1',
      };

      const result = validateClawback(mockCommission, event);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject already reversed commission', () => {
      const reversedCommission = { ...mockCommission, status: 'reversed' as const };
      const event: ClawbackEvent = {
        type: 'refund',
        commissionId: 'comm-123',
        reason: 'Refund requested',
        initiatedBy: 'admin-1',
      };

      const result = validateClawback(reversedCommission, event);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Commission has already been reversed');
    });

    it('should reject negative partial amount', () => {
      const event: ClawbackEvent = {
        type: 'refund',
        commissionId: 'comm-123',
        reason: 'Refund requested',
        initiatedBy: 'admin-1',
        partialAmount: -50,
      };

      const result = validateClawback(mockCommission, event);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Partial clawback amount must be positive');
    });

    it('should reject partial amount exceeding original', () => {
      const event: ClawbackEvent = {
        type: 'refund',
        commissionId: 'comm-123',
        reason: 'Refund requested',
        initiatedBy: 'admin-1',
        partialAmount: 200, // More than 150 commission
      };

      const result = validateClawback(mockCommission, event);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Partial clawback amount cannot exceed original commission');
    });
  });

  describe('formatClawbackSummary', () => {
    it('should format complete clawback summary', () => {
      const result: ClawbackResult = {
        success: true,
        commissionReversed: { id: 'comm-123', amount: 150 },
        overridesReversed: [
          { id: 'over-1', agentId: 'upline-1', amount: 15, generation: 1 },
        ],
        bonusesReversed: [{ id: 'bonus-1', type: 'fast_start', amount: 100 }],
        walletsDebited: [{ agentId: 'agent-123', amount: 250, category: 'commission' }],
        rankDemoted: true,
        newRank: 'associate',
        errors: [],
      };

      const summary = formatClawbackSummary(result);

      expect(summary).toContain('CLAWBACK SUMMARY');
      expect(summary).toContain('Commission Reversed: $150.00');
      expect(summary).toContain('Overrides Reversed: 1');
      expect(summary).toContain('Bonuses Reversed: 1');
      expect(summary).toContain('Rank Demoted To: associate');
    });

    it('should format summary with errors', () => {
      const result: ClawbackResult = {
        success: false,
        commissionReversed: null,
        overridesReversed: [],
        bonusesReversed: [],
        walletsDebited: [],
        rankDemoted: false,
        errors: ['Failed to update commission', 'Wallet not found'],
      };

      const summary = formatClawbackSummary(result);

      expect(summary).toContain('Errors:');
      expect(summary).toContain('Failed to update commission');
      expect(summary).toContain('Wallet not found');
    });
  });
});
