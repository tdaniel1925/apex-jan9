/**
 * Active Status Engine Tests
 * Tests for automatic agent status transitions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  evaluateAgentStatus,
  createStatusChangeRecord,
  canPerformAction,
  identifyAtRiskAgents,
  formatStatusChangeMessage,
  getDaysUntilStatusChange,
  DEFAULT_ACTIVE_STATUS_CONFIG,
  type ActivityCheck,
  type ActiveStatusConfig,
} from '@/lib/engines/active-status-engine';
import type { Agent } from '@/lib/types/database';

describe('Active Status Engine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

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
    premium_90_days: 5000,
    persistency_rate: 0,
    placement_rate: 0,
    active_agents_count: 5,
    personal_recruits_count: 3,
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

  const createActivityCheck = (overrides: Partial<ActivityCheck> = {}): ActivityCheck => ({
    agentId: 'agent-123',
    lastSaleDate: new Date('2024-05-15T00:00:00Z'), // 31 days ago
    lastLoginDate: new Date('2024-06-10T00:00:00Z'), // 5 days ago
    pbv90Days: 5000,
    currentStatus: 'active',
    ...overrides,
  });

  describe('evaluateAgentStatus', () => {
    it('should return no change for active agent with recent activity', () => {
      const activity = createActivityCheck();
      const result = evaluateAgentStatus(activity);

      expect(result.shouldChange).toBe(false);
      expect(result.newStatus).toBe('active');
      expect(result.warningOnly).toBe(false);
    });

    it('should recommend deactivation for agent without sales for 90+ days', () => {
      const activity = createActivityCheck({
        lastSaleDate: new Date('2024-03-10T00:00:00Z'), // 97 days ago
      });
      const result = evaluateAgentStatus(activity);

      expect(result.shouldChange).toBe(true);
      expect(result.newStatus).toBe('inactive');
      expect(result.reason).toBe('no_sales');
    });

    it('should show warning when approaching inactivity threshold', () => {
      const activity = createActivityCheck({
        lastSaleDate: new Date('2024-03-30T00:00:00Z'), // ~77 days ago, within warning period
      });
      const result = evaluateAgentStatus(activity);

      expect(result.warningOnly).toBe(true);
      expect(result.daysUntilChange).toBeLessThanOrEqual(14);
      expect(result.daysUntilChange).toBeGreaterThan(0);
    });

    it('should not change terminated agents', () => {
      const activity = createActivityCheck({ currentStatus: 'terminated' });
      const result = evaluateAgentStatus(activity);

      expect(result.shouldChange).toBe(false);
      expect(result.newStatus).toBe('terminated');
    });

    it('should not change pending agents', () => {
      const activity = createActivityCheck({ currentStatus: 'pending' });
      const result = evaluateAgentStatus(activity);

      expect(result.shouldChange).toBe(false);
      expect(result.newStatus).toBe('pending');
    });

    it('should deactivate for low volume if configured', () => {
      const activity = createActivityCheck({ pbv90Days: 500 });
      const config: ActiveStatusConfig = {
        ...DEFAULT_ACTIVE_STATUS_CONFIG,
        minimumPersonalVolume: 1000,
      };
      const result = evaluateAgentStatus(activity, config);

      expect(result.shouldChange).toBe(true);
      expect(result.newStatus).toBe('inactive');
      expect(result.reason).toBe('below_minimum_volume');
    });

    it('should check for reactivation of inactive agents with recent sales', () => {
      const activity = createActivityCheck({
        currentStatus: 'inactive',
        lastSaleDate: new Date('2024-06-10T00:00:00Z'), // 5 days ago
      });
      const result = evaluateAgentStatus(activity);

      expect(result.shouldChange).toBe(true);
      expect(result.newStatus).toBe('active');
    });
  });

  describe('createStatusChangeRecord', () => {
    it('should create status change record with correct fields', () => {
      const agent = createMockAgent();
      const record = createStatusChangeRecord(agent, 'inactive', 'no_sales', 'system');

      expect(record.agentId).toBe(agent.id);
      expect(record.previousStatus).toBe('active');
      expect(record.newStatus).toBe('inactive');
      expect(record.reason).toBe('no_sales');
      expect(record.triggeredBy).toBe('system');
    });

    it('should include metadata with agent info', () => {
      const agent = createMockAgent({ rank: 'sr_agent', pbv_90_days: 3000 });
      const record = createStatusChangeRecord(agent, 'inactive', 'no_sales', 'admin');

      expect(record.metadata).toBeDefined();
      expect(record.metadata?.rank).toBe('sr_agent');
      expect(record.metadata?.pbv90Days).toBe(3000);
    });

    it('should support admin-triggered changes', () => {
      const agent = createMockAgent();
      const record = createStatusChangeRecord(agent, 'terminated', 'manual_deactivation', 'admin');

      expect(record.triggeredBy).toBe('admin');
      expect(record.newStatus).toBe('terminated');
    });
  });

  describe('canPerformAction', () => {
    it('should allow all actions for active agents', () => {
      expect(canPerformAction('active', 'sell')).toBe(true);
      expect(canPerformAction('active', 'recruit')).toBe(true);
      expect(canPerformAction('active', 'earn_commission')).toBe(true);
      expect(canPerformAction('active', 'earn_override')).toBe(true);
      expect(canPerformAction('active', 'receive_payout')).toBe(true);
    });

    it('should restrict inactive agents appropriately', () => {
      expect(canPerformAction('inactive', 'sell')).toBe(true); // Can sell to reactivate
      expect(canPerformAction('inactive', 'recruit')).toBe(false);
      expect(canPerformAction('inactive', 'earn_commission')).toBe(true);
      expect(canPerformAction('inactive', 'earn_override')).toBe(false);
      expect(canPerformAction('inactive', 'receive_payout')).toBe(true);
    });

    it('should heavily restrict terminated agents', () => {
      expect(canPerformAction('terminated', 'sell')).toBe(false);
      expect(canPerformAction('terminated', 'recruit')).toBe(false);
      expect(canPerformAction('terminated', 'earn_commission')).toBe(false);
      expect(canPerformAction('terminated', 'earn_override')).toBe(false);
      expect(canPerformAction('terminated', 'receive_payout')).toBe(true); // Final payout
    });

    it('should restrict pending agents from all business actions', () => {
      expect(canPerformAction('pending', 'sell')).toBe(false);
      expect(canPerformAction('pending', 'recruit')).toBe(false);
      expect(canPerformAction('pending', 'earn_commission')).toBe(false);
      expect(canPerformAction('pending', 'earn_override')).toBe(false);
    });
  });

  describe('identifyAtRiskAgents', () => {
    it('should identify agents approaching inactivity threshold', () => {
      const agents = [
        {
          ...createMockAgent({ id: 'agent-1' }),
          last_sale_date: '2024-03-30T00:00:00Z', // ~77 days ago, at risk
        },
        {
          ...createMockAgent({ id: 'agent-2' }),
          last_sale_date: '2024-05-15T00:00:00Z', // ~31 days ago, not at risk
        },
      ];

      const atRisk = identifyAtRiskAgents(agents);

      expect(atRisk.length).toBe(1);
      expect(atRisk[0].agent.id).toBe('agent-1');
      expect(atRisk[0].reason).toBe('no_sales');
    });

    it('should sort by urgency (most urgent first)', () => {
      const agents = [
        {
          ...createMockAgent({ id: 'agent-1' }),
          last_sale_date: '2024-03-28T00:00:00Z', // ~79 days, ~11 days until inactive
        },
        {
          ...createMockAgent({ id: 'agent-2' }),
          last_sale_date: '2024-03-20T00:00:00Z', // ~87 days, ~3 days until inactive
        },
      ];

      const atRisk = identifyAtRiskAgents(agents);

      // Agent-2 should be first (fewer days until deactivation)
      expect(atRisk.length).toBe(2);
      expect(atRisk[0].agent.id).toBe('agent-2');
      expect(atRisk[0].daysUntilDeactivation).toBeLessThan(atRisk[1].daysUntilDeactivation);
    });

    it('should not include inactive agents', () => {
      const agents = [
        {
          ...createMockAgent({ id: 'agent-1', status: 'inactive' }),
          last_sale_date: '2024-01-01T00:00:00Z', // Long ago, but already inactive
        },
      ];

      const atRisk = identifyAtRiskAgents(agents);
      expect(atRisk.length).toBe(0);
    });

    it('should flag agents with low volume if configured', () => {
      const agents = [
        {
          ...createMockAgent({ id: 'agent-1', pbv_90_days: 500 }),
          last_sale_date: '2024-06-10T00:00:00Z', // Recent sale
        },
      ];

      const config: ActiveStatusConfig = {
        ...DEFAULT_ACTIVE_STATUS_CONFIG,
        minimumPersonalVolume: 1000,
      };

      const atRisk = identifyAtRiskAgents(agents, config);
      expect(atRisk.length).toBe(1);
      expect(atRisk[0].reason).toBe('below_minimum_volume');
    });
  });

  describe('formatStatusChangeMessage', () => {
    it('should format activation message', () => {
      const event = {
        agentId: 'agent-1',
        previousStatus: 'inactive' as const,
        newStatus: 'active' as const,
        reason: 'reactivated',
        triggeredBy: 'system' as const,
      };

      const message = formatStatusChangeMessage(event);
      expect(message.subject).toContain('Activated');
    });

    it('should format deactivation message with reason', () => {
      const event = {
        agentId: 'agent-1',
        previousStatus: 'active' as const,
        newStatus: 'inactive' as const,
        reason: 'no_sales',
        triggeredBy: 'system' as const,
      };

      const message = formatStatusChangeMessage(event);
      expect(message.subject).toContain('Inactive');
      expect(message.body).toContain('no_sales');
    });

    it('should format termination message', () => {
      const event = {
        agentId: 'agent-1',
        previousStatus: 'active' as const,
        newStatus: 'terminated' as const,
        reason: 'compliance_violation',
        triggeredBy: 'admin' as const,
      };

      const message = formatStatusChangeMessage(event);
      expect(message.subject).toContain('Terminated');
    });
  });

  describe('getDaysUntilStatusChange', () => {
    it('should return days until deactivation for active agent', () => {
      const agent = {
        ...createMockAgent(),
        last_sale_date: '2024-04-15T00:00:00Z', // 61 days ago
      };

      const days = getDaysUntilStatusChange(agent);
      expect(days).toBe(29); // 90 - 61 = 29
    });

    it('should return null for inactive agents', () => {
      const agent = {
        ...createMockAgent({ status: 'inactive' }),
        last_sale_date: '2024-06-01T00:00:00Z',
      };

      const days = getDaysUntilStatusChange(agent);
      expect(days).toBeNull();
    });

    it('should return 0 for agents past threshold', () => {
      const agent = {
        ...createMockAgent(),
        last_sale_date: '2024-02-01T00:00:00Z', // 135 days ago
      };

      const days = getDaysUntilStatusChange(agent);
      expect(days).toBe(0);
    });

    it('should return full inactivity days if no sale date', () => {
      const agent = {
        ...createMockAgent(),
      };

      const days = getDaysUntilStatusChange(agent);
      expect(days).toBe(DEFAULT_ACTIVE_STATUS_CONFIG.inactivityDays);
    });
  });
});
