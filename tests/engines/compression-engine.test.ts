/**
 * Compression Engine Tests
 * Tests for skipping inactive distributors in override calculations
 */

import { describe, it, expect } from 'vitest';
import {
  isAgentQualifiedForOverrides,
  getCompressedUpline,
  calculateCompressedOverrides,
  buildQualificationMap,
  type AgentQualificationStatus,
  type CompressionConfig,
  type CompressedUplineResult,
  DEFAULT_COMPRESSION_CONFIG,
} from '@/lib/engines/compression-engine';
import type { Agent } from '@/lib/types/database';

describe('Compression Engine', () => {
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
    ...overrides,
  });

  describe('isAgentQualifiedForOverrides', () => {
    it('should return qualified for active agents with sufficient volume', () => {
      const agent = createMockAgent({ status: 'active', pbv_90_days: 1000 });
      const result = isAgentQualifiedForOverrides(agent);

      expect(result.isQualified).toBe(true);
      expect(result.agentId).toBe(agent.id);
      expect(result.reason).toBeUndefined();
    });

    it('should return unqualified for inactive agents', () => {
      const agent = createMockAgent({ status: 'inactive' });
      const result = isAgentQualifiedForOverrides(agent);

      expect(result.isQualified).toBe(false);
      expect(result.reason).toBe('inactive');
    });

    it('should return unqualified for terminated agents', () => {
      const agent = createMockAgent({ status: 'terminated' });
      const result = isAgentQualifiedForOverrides(agent);

      expect(result.isQualified).toBe(false);
      expect(result.reason).toBe('terminated');
    });

    it('should return unqualified for agents below minimum volume', () => {
      const agent = createMockAgent({ status: 'active', pbv_90_days: 500 });
      const config: CompressionConfig = {
        ...DEFAULT_COMPRESSION_CONFIG,
        minPersonalVolume: 1000,
      };
      const result = isAgentQualifiedForOverrides(agent, config);

      expect(result.isQualified).toBe(false);
      expect(result.reason).toBe('below_minimum_volume');
    });

    it('should respect volume requirement when configured', () => {
      const agent = createMockAgent({ status: 'active', pbv_90_days: 1500 });
      const config: CompressionConfig = {
        ...DEFAULT_COMPRESSION_CONFIG,
        minPersonalVolume: 1000,
      };
      const result = isAgentQualifiedForOverrides(agent, config);

      expect(result.isQualified).toBe(true);
    });
  });

  describe('getCompressedUpline', () => {
    it('should return compressed upline when agents are qualified', () => {
      const upline = [
        { id: 'agent-1', generation: 1 },
        { id: 'agent-2', generation: 2 },
        { id: 'agent-3', generation: 3 },
      ];

      const qualifications = new Map<string, AgentQualificationStatus>([
        ['agent-1', { agentId: 'agent-1', isQualified: true }],
        ['agent-2', { agentId: 'agent-2', isQualified: true }],
        ['agent-3', { agentId: 'agent-3', isQualified: true }],
      ]);

      const result = getCompressedUpline(upline, qualifications);

      expect(result.compressedUpline.length).toBe(3);
      expect(result.skippedAgents.length).toBe(0);
      expect(result.compressionApplied).toBe(false);
      expect(result.compressedUpline[0].id).toBe('agent-1');
      expect(result.compressedUpline[0].generation).toBe(1);
    });

    it('should skip inactive agents and compress generations', () => {
      const upline = [
        { id: 'agent-1', generation: 1 },
        { id: 'agent-2', generation: 2 }, // INACTIVE - will be skipped
        { id: 'agent-3', generation: 3 },
      ];

      const qualifications = new Map<string, AgentQualificationStatus>([
        ['agent-1', { agentId: 'agent-1', isQualified: true }],
        ['agent-2', { agentId: 'agent-2', isQualified: false, reason: 'inactive' }],
        ['agent-3', { agentId: 'agent-3', isQualified: true }],
      ]);

      const result = getCompressedUpline(upline, qualifications);

      expect(result.compressedUpline.length).toBe(2);
      expect(result.skippedAgents.length).toBe(1);
      expect(result.compressionApplied).toBe(true);

      // Agent-1 stays at gen 1
      expect(result.compressedUpline[0].id).toBe('agent-1');
      expect(result.compressedUpline[0].generation).toBe(1);

      // Agent-3 moves from gen 3 to gen 2
      expect(result.compressedUpline[1].id).toBe('agent-3');
      expect(result.compressedUpline[1].generation).toBe(2);
      expect(result.compressedUpline[1].originalGeneration).toBe(3);

      // Agent-2 is skipped
      expect(result.skippedAgents[0].id).toBe('agent-2');
      expect(result.skippedAgents[0].reason).toBe('inactive');
    });

    it('should respect max generations limit', () => {
      const upline = [
        { id: 'agent-1', generation: 1 },
        { id: 'agent-2', generation: 2 },
        { id: 'agent-3', generation: 3 },
        { id: 'agent-4', generation: 4 },
        { id: 'agent-5', generation: 5 },
        { id: 'agent-6', generation: 6 },
        { id: 'agent-7', generation: 7 }, // Beyond max (default 6)
      ];

      const qualifications = new Map<string, AgentQualificationStatus>();
      upline.forEach((u) => qualifications.set(u.id, { agentId: u.id, isQualified: true }));

      const result = getCompressedUpline(upline, qualifications, 6);

      // Should only include up to 6 generations
      expect(result.compressedUpline.length).toBeLessThanOrEqual(6);
    });

    it('should handle multiple skipped agents', () => {
      const upline = [
        { id: 'agent-1', generation: 1 }, // INACTIVE
        { id: 'agent-2', generation: 2 }, // INACTIVE
        { id: 'agent-3', generation: 3 },
        { id: 'agent-4', generation: 4 },
      ];

      const qualifications = new Map<string, AgentQualificationStatus>([
        ['agent-1', { agentId: 'agent-1', isQualified: false, reason: 'inactive' }],
        ['agent-2', { agentId: 'agent-2', isQualified: false, reason: 'terminated' }],
        ['agent-3', { agentId: 'agent-3', isQualified: true }],
        ['agent-4', { agentId: 'agent-4', isQualified: true }],
      ]);

      const result = getCompressedUpline(upline, qualifications);

      expect(result.compressedUpline.length).toBe(2);
      expect(result.skippedAgents.length).toBe(2);

      // Agent-3 should now be at gen 1
      expect(result.compressedUpline[0].id).toBe('agent-3');
      expect(result.compressedUpline[0].generation).toBe(1);
      expect(result.compressedUpline[0].originalGeneration).toBe(3);

      // Agent-4 should now be at gen 2
      expect(result.compressedUpline[1].id).toBe('agent-4');
      expect(result.compressedUpline[1].generation).toBe(2);
      expect(result.compressedUpline[1].originalGeneration).toBe(4);
    });
  });

  describe('calculateCompressedOverrides', () => {
    it('should calculate override amounts for compressed upline', () => {
      const compressedResult: CompressedUplineResult = {
        originalUpline: [
          { id: 'agent-1', generation: 1 },
          { id: 'agent-2', generation: 2 },
        ],
        compressedUpline: [
          { id: 'agent-1', generation: 1, originalGeneration: 1 },
          { id: 'agent-2', generation: 2, originalGeneration: 2 },
        ],
        skippedAgents: [],
        compressionApplied: false,
      };

      const overrides = calculateCompressedOverrides(1000, compressedResult);

      expect(overrides.length).toBe(2);
      expect(overrides[0].agentId).toBe('agent-1');
      expect(overrides[0].generation).toBe(1);
      expect(overrides[0].overrideAmount).toBeGreaterThan(0);
      expect(overrides[1].agentId).toBe('agent-2');
      expect(overrides[1].generation).toBe(2);
    });

    it('should use compressed generation for rate calculation', () => {
      // Agent-3 was originally gen 3 but compressed to gen 2
      const compressedResult: CompressedUplineResult = {
        originalUpline: [
          { id: 'agent-1', generation: 1 },
          { id: 'agent-3', generation: 3 },
        ],
        compressedUpline: [
          { id: 'agent-1', generation: 1, originalGeneration: 1 },
          { id: 'agent-3', generation: 2, originalGeneration: 3 }, // Compressed from gen 3 to gen 2
        ],
        skippedAgents: [{ id: 'agent-2', reason: 'inactive', generation: 2 }],
        compressionApplied: true,
      };

      const overrides = calculateCompressedOverrides(1000, compressedResult);

      // Agent-3 should get gen 2 rate, not gen 3 rate
      expect(overrides[1].generation).toBe(2); // Uses compressed generation
      expect(overrides[1].originalGeneration).toBe(3); // But tracks original
    });

    it('should handle empty compressed upline', () => {
      const compressedResult: CompressedUplineResult = {
        originalUpline: [{ id: 'agent-1', generation: 1 }],
        compressedUpline: [],
        skippedAgents: [{ id: 'agent-1', reason: 'inactive', generation: 1 }],
        compressionApplied: true,
      };

      const overrides = calculateCompressedOverrides(1000, compressedResult);
      expect(overrides.length).toBe(0);
    });
  });

  describe('buildQualificationMap', () => {
    it('should build qualification map from agent list', () => {
      const agents = [
        createMockAgent({ id: 'agent-1', status: 'active' }),
        createMockAgent({ id: 'agent-2', status: 'inactive' }),
        createMockAgent({ id: 'agent-3', status: 'active' }),
      ];

      const map = buildQualificationMap(agents);

      expect(map.size).toBe(3);
      expect(map.get('agent-1')?.isQualified).toBe(true);
      expect(map.get('agent-2')?.isQualified).toBe(false);
      expect(map.get('agent-3')?.isQualified).toBe(true);
    });

    it('should apply custom config to all agents', () => {
      const agents = [
        createMockAgent({ id: 'agent-1', status: 'active', pbv_90_days: 500 }),
        createMockAgent({ id: 'agent-2', status: 'active', pbv_90_days: 1500 }),
      ];

      const config: CompressionConfig = {
        ...DEFAULT_COMPRESSION_CONFIG,
        minPersonalVolume: 1000,
      };

      const map = buildQualificationMap(agents, config);

      expect(map.get('agent-1')?.isQualified).toBe(false);
      expect(map.get('agent-1')?.reason).toBe('below_minimum_volume');
      expect(map.get('agent-2')?.isQualified).toBe(true);
    });
  });
});
