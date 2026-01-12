/**
 * Retail Commission Engine Tests
 * Tests commission calculation for digital product sales
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRetailCommission,
  getRetailCommissionRate,
  calculateRetailPayout,
} from '@/lib/engines/retail-commission-engine';
import type { Order, Agent } from '@/lib/types/database';

describe('Retail Commission Engine', () => {
  const mockOrder: Order = {
    id: 'order-123',
    agent_id: 'agent-123',
    user_id: 'user-123',
    total_amount: 100.00,
    total_bonus_volume: 50,
    status: 'completed',
    payment_method: 'stripe',
    payment_status: 'paid',
    stripe_session_id: 'sess_123',
    stripe_payment_intent_id: 'pi_123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockAgent: Agent = {
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
    premium_90_days: 0,
    persistency_rate: 0,
    placement_rate: 0,
    active_agents_count: 0,
    personal_recruits_count: 0,
    mgas_in_downline: 0,
    personal_bonus_volume: 0,
    organization_bonus_volume: 0,
    pbv_90_days: 0,
    obv_90_days: 0,
    ai_copilot_tier: 'none',
    ai_copilot_subscribed_at: null,
    username: 'test001',
    replicated_site_enabled: true,
    calendar_link: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    fast_start_ends_at: '2024-04-01T00:00:00Z',
  };

  describe('getRetailCommissionRate', () => {
    it('should return correct rate for pre_associate', () => {
      expect(getRetailCommissionRate('pre_associate')).toBe(0.10);
    });

    it('should return correct rate for agent', () => {
      expect(getRetailCommissionRate('agent')).toBe(0.15);
    });

    it('should return correct rate for premier_mga', () => {
      expect(getRetailCommissionRate('premier_mga')).toBe(0.35);
    });
  });

  describe('calculateRetailCommission', () => {
    it('should calculate commission correctly for agent rank', () => {
      const commission = calculateRetailCommission({
        order: mockOrder,
        agent: mockAgent,
      });

      expect(commission.agent_id).toBe('agent-123');
      expect(commission.carrier).toBe('retail');
      expect(commission.premium_amount).toBe(100.00);
      expect(commission.commission_rate).toBe(0.15); // 15% for agent
      expect(commission.commission_amount).toBe(15.00); // 100 * 0.15
      expect(commission.bonus_volume).toBe(50);
      expect(commission.source).toBe('retail');
      expect(commission.order_id).toBe('order-123');
      expect(commission.status).toBe('pending');
    });

    it('should calculate commission for premier_mga rank', () => {
      const premierAgent = { ...mockAgent, rank: 'premier_mga' as const };
      const commission = calculateRetailCommission({
        order: mockOrder,
        agent: premierAgent,
      });

      expect(commission.commission_rate).toBe(0.35); // 35% for premier_mga
      expect(commission.commission_amount).toBe(35.00); // 100 * 0.35
    });

    it('should calculate commission for pre_associate rank', () => {
      const preAssociate = { ...mockAgent, rank: 'pre_associate' as const };
      const commission = calculateRetailCommission({
        order: mockOrder,
        agent: preAssociate,
      });

      expect(commission.commission_rate).toBe(0.10); // 10% for pre_associate
      expect(commission.commission_amount).toBe(10.00); // 100 * 0.10
    });

    it('should include policy_number from order ID', () => {
      const commission = calculateRetailCommission({
        order: mockOrder,
        agent: mockAgent,
      });

      expect(commission.policy_number).toBe('RET-order-12'); // First 8 chars
    });
  });

  describe('calculateRetailPayout', () => {
    it('should calculate total payout with estimated overrides', () => {
      const payout = calculateRetailPayout(mockOrder, 'agent');

      expect(payout.directCommission).toBe(15.00); // 15% of 100
      expect(payout.commissionRate).toBe(0.15);
      // Estimated overrides: 50 BV * 0.275 = 13.75
      expect(payout.totalPayout).toBe(28.75); // 15 + 13.75
    });

    it('should calculate payout for higher rank', () => {
      const payout = calculateRetailPayout(mockOrder, 'premier_mga');

      expect(payout.directCommission).toBe(35.00); // 35% of 100
      expect(payout.commissionRate).toBe(0.35);
      // Estimated overrides: 50 BV * 0.275 = 13.75
      expect(payout.totalPayout).toBe(48.75); // 35 + 13.75
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount order', () => {
      const zeroOrder = { ...mockOrder, total_amount: 0, total_bonus_volume: 0 };
      const commission = calculateRetailCommission({
        order: zeroOrder,
        agent: mockAgent,
      });

      expect(commission.commission_amount).toBe(0);
      expect(commission.bonus_volume).toBe(0);
    });

    it('should handle decimal amounts correctly', () => {
      const decimalOrder = { ...mockOrder, total_amount: 99.99 };
      const commission = calculateRetailCommission({
        order: decimalOrder,
        agent: mockAgent,
      });

      // 99.99 * 0.15 = 14.9985
      expect(commission.commission_amount).toBeCloseTo(14.9985, 4);
    });
  });
});
