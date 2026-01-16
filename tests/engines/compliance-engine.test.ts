/**
 * Compliance Engine Tests
 * Tests for compliance holds, suspicious activity, and fraud detection
 */

import { describe, it, expect } from 'vitest';
import {
  checkSuspiciousActivity,
  checkFamilyStacking,
  checkCircularSponsorship,
  createComplianceHold,
  canProcessPayout,
  calculateHoldStatistics,
  getComplianceScore,
  getRequiredDocumentation,
  formatComplianceHoldSummary,
  DEFAULT_COMPLIANCE_CONFIG,
  type ComplianceHold,
  type ComplianceConfig,
} from '@/lib/engines/compliance-engine';
import type { Agent, Commission } from '@/lib/types/database';

describe('Compliance Engine', () => {
  const createMockAgent = (overrides: Partial<Agent> = {}): Agent => ({
    id: 'agent-123',
    user_id: 'user-123',
    sponsor_id: null,
    agent_code: 'TEST001',
    first_name: 'Test',
    last_name: 'Agent',
    email: 'test@example.com',
    phone: '555-1234',
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
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    fast_start_ends_at: '2024-04-01T00:00:00Z',
    is_licensed_agent: false,
    // License compliance fields
    license_status: 'licensed',
    license_number: 'LIC-12345',
    license_state: 'TX',
    license_expiration_date: '2027-12-31',
    ...overrides,
  });

  const createMockCommission = (overrides: Partial<Commission> = {}): Commission => ({
    id: 'comm-123',
    agent_id: 'agent-123',
    carrier: 'columbus_life',
    policy_number: 'POL-123',
    premium_amount: 1000,
    commission_rate: 0.15,
    commission_amount: 150,
    policy_date: '2024-01-01',
    status: 'pending',
    source: 'smart_office',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    ...overrides,
  });

  describe('checkSuspiciousActivity', () => {
    it('should not flag normal activity', () => {
      const agent = createMockAgent({
        created_at: '2023-01-01T00:00:00Z', // Established agent
      });
      const commissions = [
        createMockCommission({ commission_amount: 500 }),
        createMockCommission({ commission_amount: 500 }),
      ];

      const result = checkSuspiciousActivity(agent, commissions, DEFAULT_COMPLIANCE_CONFIG);

      expect(result.isSuspicious).toBe(false);
      expect(result.requiresHold).toBe(false);
    });

    it('should flag high volume threshold', () => {
      const agent = createMockAgent();
      const commissions = [
        createMockCommission({ commission_amount: 15000 }), // Exceeds 10000 threshold
      ];

      const result = checkSuspiciousActivity(agent, commissions, DEFAULT_COMPLIANCE_CONFIG);

      expect(result.isSuspicious).toBe(true);
      expect(result.flags.some((f) => f.type === 'high_volume_threshold')).toBe(true);
    });

    it('should flag new agent with high activity', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10); // 10 days ago

      const agent = createMockAgent({
        created_at: recentDate.toISOString(),
      });
      const commissions = [
        createMockCommission({ commission_amount: 1500 }),
      ];

      const result = checkSuspiciousActivity(agent, commissions, DEFAULT_COMPLIANCE_CONFIG);

      expect(result.isSuspicious).toBe(true);
      expect(result.flags.some((f) => f.type === 'new_agent_review')).toBe(true);
    });

    it('should flag burst pattern of commissions', () => {
      const agent = createMockAgent();
      const now = Date.now();

      // Create 5 commissions within 5 minutes
      const commissions = Array.from({ length: 5 }, (_, i) =>
        createMockCommission({
          id: `comm-${i}`,
          commission_amount: 100,
          created_at: new Date(now + i * 60000).toISOString(), // 1 minute apart
        })
      );

      const result = checkSuspiciousActivity(agent, commissions, DEFAULT_COMPLIANCE_CONFIG);

      expect(result.isSuspicious).toBe(true);
      expect(result.flags.some((f) => f.type === 'suspicious_activity')).toBe(true);
      expect(result.requiresHold).toBe(true);
    });

    it('should determine severity levels correctly', () => {
      const agent = createMockAgent();
      const commissions = [
        createMockCommission({ commission_amount: 25000 }), // 2.5x threshold = high severity
      ];

      const result = checkSuspiciousActivity(agent, commissions, DEFAULT_COMPLIANCE_CONFIG);

      const highVolumeFlag = result.flags.find((f) => f.type === 'high_volume_threshold');
      expect(highVolumeFlag?.severity).toBe('high');
    });
  });

  describe('checkFamilyStacking', () => {
    it('should detect same phone number', () => {
      const agent = createMockAgent({ phone: '555-1234', email: 'agent@gmail.com' });
      const allAgents = [
        agent,
        createMockAgent({ id: 'other-1', phone: '555-1234', email: 'other1@gmail.com', created_at: '2023-01-01T00:00:00Z' }), // Same phone
        createMockAgent({ id: 'other-2', phone: '555-9999', email: 'other2@gmail.com', created_at: '2023-02-01T00:00:00Z' }), // Different phone
      ];

      const result = checkFamilyStacking(agent, allAgents, {
        addresses: [],
        phones: [],
        ipAddresses: [],
      });

      expect(result.isFamilyStacking).toBe(true);
      expect(result.relatedAgents).toContain('other-1');
      expect(result.relatedAgents).not.toContain('other-2');
    });

    it('should detect custom email domain sharing', () => {
      const agent = createMockAgent({ email: 'john@familydomain.com', phone: '555-1111' });
      const allAgents = [
        agent,
        createMockAgent({ id: 'other-1', email: 'jane@familydomain.com', phone: '555-2222', created_at: '2023-01-01T00:00:00Z' }), // Same domain
        createMockAgent({ id: 'other-2', email: 'bob@gmail.com', phone: '555-3333', created_at: '2023-02-01T00:00:00Z' }), // Common provider
      ];

      const result = checkFamilyStacking(agent, allAgents, {
        addresses: [],
        phones: [],
        ipAddresses: [],
      });

      expect(result.isFamilyStacking).toBe(true);
      expect(result.relatedAgents).toContain('other-1');
      expect(result.relatedAgents).not.toContain('other-2');
    });

    it('should detect same-day signup in same line', () => {
      const signupDate = '2024-01-15T10:00:00Z';

      const agent = createMockAgent({
        sponsor_id: 'upline-1',
        created_at: signupDate,
        phone: '555-1111',
        email: 'agent@gmail.com',
      });
      const allAgents = [
        agent,
        createMockAgent({
          id: 'upline-1',
          created_at: signupDate,
          phone: '555-2222', // Different phone
          email: 'upline@gmail.com', // Different email
        }),
      ];

      const result = checkFamilyStacking(agent, allAgents, {
        addresses: [],
        phones: [],
        ipAddresses: [],
      });

      expect(result.isFamilyStacking).toBe(true);
      expect(result.sharedData.some((s) => s.includes('Same-day signup'))).toBe(true);
    });

    it('should not flag legitimate unrelated agents', () => {
      const agent = createMockAgent({
        email: 'agent1@gmail.com',
        phone: '555-1111',
      });
      const allAgents = [
        agent,
        createMockAgent({
          id: 'other-1',
          email: 'agent2@yahoo.com',
          phone: '555-2222',
          created_at: '2024-02-01T00:00:00Z',
        }),
      ];

      const result = checkFamilyStacking(agent, allAgents, {
        addresses: [],
        phones: [],
        ipAddresses: [],
      });

      expect(result.isFamilyStacking).toBe(false);
    });
  });

  describe('checkCircularSponsorship', () => {
    it('should detect circular reference', () => {
      const sponsors: Record<string, string | null> = {
        'agent-1': 'agent-2',
        'agent-2': 'agent-3',
        'agent-3': 'agent-1', // Circular!
      };

      const getUpline = (id: string) => sponsors[id] || null;

      const result = checkCircularSponsorship('agent-1', getUpline);

      expect(result.isCircular).toBe(true);
      expect(result.chain.length).toBeGreaterThan(0);
    });

    it('should not flag valid sponsorship chain', () => {
      const sponsors: Record<string, string | null> = {
        'agent-1': 'agent-2',
        'agent-2': 'agent-3',
        'agent-3': null, // Top of chain
      };

      const getUpline = (id: string) => sponsors[id] || null;

      const result = checkCircularSponsorship('agent-1', getUpline);

      expect(result.isCircular).toBe(false);
      expect(result.chain).toHaveLength(0);
    });

    it('should handle deep chains', () => {
      const sponsors: Record<string, string | null> = {};
      for (let i = 1; i <= 50; i++) {
        sponsors[`agent-${i}`] = i < 50 ? `agent-${i + 1}` : null;
      }

      const getUpline = (id: string) => sponsors[id] || null;

      const result = checkCircularSponsorship('agent-1', getUpline);

      expect(result.isCircular).toBe(false);
    });
  });

  describe('createComplianceHold', () => {
    it('should create hold with required documentation', () => {
      const hold = createComplianceHold(
        'agent-123',
        'high_volume_threshold',
        'Volume exceeds $10,000',
        15000,
        ['comm-1', 'comm-2'],
        []
      );

      expect(hold.agent_id).toBe('agent-123');
      expect(hold.hold_type).toBe('high_volume_threshold');
      expect(hold.status).toBe('pending');
      expect(hold.affected_amount).toBe(15000);
      expect(hold.documentation_required.length).toBeGreaterThan(0);
    });

    it('should include correct documentation for fraud investigation', () => {
      const hold = createComplianceHold(
        'agent-123',
        'fraud_investigation',
        'Suspected fraud',
        5000
      );

      expect(hold.documentation_required).toContain('All transaction records');
      expect(hold.documentation_required).toContain('Customer communications');
    });
  });

  describe('canProcessPayout', () => {
    it('should allow payout when no holds', () => {
      const result = canProcessPayout('agent-123', []);

      expect(result.allowed).toBe(true);
      expect(result.blockedBy).toHaveLength(0);
    });

    it('should block payout when pending hold exists', () => {
      const holds: ComplianceHold[] = [
        {
          id: 'hold-1',
          agent_id: 'agent-123',
          hold_type: 'suspicious_activity',
          status: 'pending',
          reason: 'Under review',
          affected_amount: 1000,
          affected_commissions: [],
          affected_payouts: [],
          documentation_required: [],
          documentation_provided: [],
          assigned_to: null,
          notes: '',
          resolution: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const result = canProcessPayout('agent-123', holds);

      expect(result.allowed).toBe(false);
      expect(result.blockedBy).toHaveLength(1);
    });

    it('should allow payout when holds are approved', () => {
      const holds: ComplianceHold[] = [
        {
          id: 'hold-1',
          agent_id: 'agent-123',
          hold_type: 'new_agent_review',
          status: 'approved',
          reason: 'Initial review',
          affected_amount: 1000,
          affected_commissions: [],
          affected_payouts: [],
          documentation_required: [],
          documentation_provided: [],
          assigned_to: null,
          notes: '',
          resolution: 'Approved after review',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const result = canProcessPayout('agent-123', holds);

      expect(result.allowed).toBe(true);
    });
  });

  describe('calculateHoldStatistics', () => {
    it('should calculate correct statistics', () => {
      const holds: ComplianceHold[] = [
        {
          id: 'hold-1',
          agent_id: 'agent-1',
          hold_type: 'high_volume_threshold',
          status: 'pending',
          reason: 'Review',
          affected_amount: 5000,
          affected_commissions: [],
          affected_payouts: [],
          documentation_required: [],
          documentation_provided: [],
          assigned_to: null,
          notes: '',
          resolution: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'hold-2',
          agent_id: 'agent-2',
          hold_type: 'suspicious_activity',
          status: 'approved',
          reason: 'Cleared',
          affected_amount: 3000,
          affected_commissions: [],
          affected_payouts: [],
          documentation_required: [],
          documentation_provided: [],
          assigned_to: null,
          notes: '',
          resolution: 'Approved',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          resolved_at: '2024-01-05T00:00:00Z',
        },
      ];

      const stats = calculateHoldStatistics(holds);

      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.approved).toBe(1);
      expect(stats.totalAmountHeld).toBe(5000); // Only pending counts
      expect(stats.byType['high_volume_threshold']).toBe(1);
      expect(stats.byType['suspicious_activity']).toBe(1);
    });
  });

  describe('getComplianceScore', () => {
    it('should return 100 for agent with no holds', () => {
      const agent = createMockAgent();

      const result = getComplianceScore(agent, []);

      expect(result.score).toBe(100);
      expect(result.level).toBe('excellent');
    });

    it('should reduce score for active holds', () => {
      const agent = createMockAgent();
      const holds: ComplianceHold[] = [
        {
          id: 'hold-1',
          agent_id: 'agent-123',
          hold_type: 'suspicious_activity',
          status: 'under_review',
          reason: 'Under review',
          affected_amount: 1000,
          affected_commissions: [],
          affected_payouts: [],
          documentation_required: [],
          documentation_provided: [],
          assigned_to: null,
          notes: '',
          resolution: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const result = getComplianceScore(agent, holds);

      expect(result.score).toBeLessThan(100);
      expect(result.factors.some((f) => f.impact < 0)).toBe(true);
    });

    it('should penalize escalated holds more', () => {
      const agent = createMockAgent();
      const normalHolds: ComplianceHold[] = [
        {
          id: 'hold-1',
          agent_id: 'agent-123',
          hold_type: 'high_volume_threshold',
          status: 'pending',
          reason: 'Review',
          affected_amount: 1000,
          affected_commissions: [],
          affected_payouts: [],
          documentation_required: [],
          documentation_provided: [],
          assigned_to: null,
          notes: '',
          resolution: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];
      const escalatedHolds: ComplianceHold[] = [
        {
          id: 'hold-2',
          agent_id: 'agent-123',
          hold_type: 'fraud_investigation',
          status: 'escalated',
          reason: 'Escalated',
          affected_amount: 1000,
          affected_commissions: [],
          affected_payouts: [],
          documentation_required: [],
          documentation_provided: [],
          assigned_to: null,
          notes: '',
          resolution: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const normalScore = getComplianceScore(agent, normalHolds);
      const escalatedScore = getComplianceScore(agent, escalatedHolds);

      expect(escalatedScore.score).toBeLessThan(normalScore.score);
    });

    it('should give bonus for approved holds', () => {
      const agent = createMockAgent();
      const holds: ComplianceHold[] = [
        {
          id: 'hold-1',
          agent_id: 'agent-123',
          hold_type: 'new_agent_review',
          status: 'approved',
          reason: 'Initial review',
          affected_amount: 1000,
          affected_commissions: [],
          affected_payouts: [],
          documentation_required: [],
          documentation_provided: [],
          assigned_to: null,
          notes: '',
          resolution: 'Approved',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const result = getComplianceScore(agent, holds);

      expect(result.score).toBe(100); // No penalty, possible bonus
      expect(result.factors.some((f) => f.impact > 0)).toBe(true);
    });
  });

  describe('getRequiredDocumentation', () => {
    it('should return correct docs for new agent review', () => {
      const docs = getRequiredDocumentation('new_agent_review');

      expect(docs).toContain('Government ID');
      expect(docs).toContain('Proof of address');
    });

    it('should return correct docs for fraud investigation', () => {
      const docs = getRequiredDocumentation('fraud_investigation');

      expect(docs).toContain('All transaction records');
      expect(docs).toContain('Customer communications');
    });
  });

  describe('formatComplianceHoldSummary', () => {
    it('should format hold summary correctly', () => {
      const hold: ComplianceHold = {
        id: 'hold-1',
        agent_id: 'agent-123',
        hold_type: 'suspicious_activity',
        status: 'under_review',
        reason: 'Unusual activity pattern detected',
        affected_amount: 5000,
        affected_commissions: ['comm-1', 'comm-2'],
        affected_payouts: [],
        documentation_required: ['Activity explanation', 'Customer verification'],
        documentation_provided: ['Activity explanation'],
        assigned_to: 'admin-1',
        notes: 'Under investigation',
        resolution: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const summary = formatComplianceHoldSummary(hold);

      expect(summary).toContain('COMPLIANCE HOLD');
      expect(summary).toContain('suspicious_activity');
      expect(summary).toContain('UNDER_REVIEW');
      expect(summary).toContain('$5000.00');
      expect(summary).toContain('✓ Activity explanation'); // Provided
      expect(summary).toContain('○ Customer verification'); // Not provided
    });
  });
});
