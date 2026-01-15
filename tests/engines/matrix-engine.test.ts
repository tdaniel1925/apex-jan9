/**
 * Matrix Engine Tests
 * Tests for 5x7 forced matrix operations
 */

import { describe, it, expect } from 'vitest';
import {
  findNextAvailablePosition,
  createMatrixPosition,
  getUplineFromPath,
  getDownlineFromPath,
  getDirectChildren,
  countByLevel,
  buildMatrixTree,
  calculateMatrixStats,
  MATRIX_WIDTH,
  MATRIX_DEPTH,
  MAX_POSITIONS,
  ROOT_PATH,
} from '@/lib/engines/matrix-engine';
import type { MatrixPosition } from '@/lib/types/database';
import { createMockAgent } from '../helpers/mocks';

// Helper to create mock matrix positions
function createMockPosition(
  overrides: Partial<MatrixPosition> = {}
): MatrixPosition {
  return {
    id: `pos-${Math.random().toString(36).substr(2, 9)}`,
    agent_id: 'agent-123',
    parent_id: null,
    position: 1,
    level: 0,
    path: '0',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('Matrix Engine', () => {
  describe('Constants', () => {
    it('should have matrix width of 5', () => {
      expect(MATRIX_WIDTH).toBe(5);
    });

    it('should have matrix depth of 7', () => {
      expect(MATRIX_DEPTH).toBe(7);
    });

    it('should have correct max positions calculation', () => {
      // 5^1 + 5^2 + 5^3 + 5^4 + 5^5 + 5^6 + 5^7 + 5^8 - 1 (excluding root position 0)
      // Actually: (5^8 - 1) / (5 - 1) = 97656
      expect(MAX_POSITIONS).toBe(Math.pow(MATRIX_WIDTH, MATRIX_DEPTH + 1) - 1);
    });

    it('should have root path as 0', () => {
      expect(ROOT_PATH).toBe('0');
    });
  });

  describe('findNextAvailablePosition', () => {
    it('should find first child position when sponsor has no children', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          id: 'pos-sponsor',
          agent_id: 'sponsor-123',
          path: '0.1',
          level: 1,
        }),
      ];

      const result = findNextAvailablePosition(positions, 'sponsor-123');

      expect(result).not.toBeNull();
      expect(result?.path).toBe('0.1.1');
      expect(result?.level).toBe(2);
      expect(result?.position).toBe(1);
      expect(result?.parentId).toBe('pos-sponsor');
    });

    it('should find second child when first is occupied', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          id: 'pos-sponsor',
          agent_id: 'sponsor-123',
          path: '0.1',
          level: 1,
        }),
        createMockPosition({
          id: 'pos-child-1',
          agent_id: 'agent-001',
          path: '0.1.1',
          level: 2,
          parent_id: 'pos-sponsor',
        }),
      ];

      const result = findNextAvailablePosition(positions, 'sponsor-123');

      expect(result).not.toBeNull();
      expect(result?.path).toBe('0.1.2');
      expect(result?.position).toBe(2);
    });

    it('should find third child when first two are occupied', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          id: 'pos-sponsor',
          agent_id: 'sponsor-123',
          path: '0.1',
          level: 1,
        }),
        createMockPosition({
          id: 'pos-child-1',
          agent_id: 'agent-001',
          path: '0.1.1',
          level: 2,
        }),
        createMockPosition({
          id: 'pos-child-2',
          agent_id: 'agent-002',
          path: '0.1.2',
          level: 2,
        }),
      ];

      const result = findNextAvailablePosition(positions, 'sponsor-123');

      expect(result).not.toBeNull();
      expect(result?.path).toBe('0.1.3');
      expect(result?.position).toBe(3);
    });

    it('should spillover to grandchild when all 5 children are full', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          id: 'pos-sponsor',
          agent_id: 'sponsor-123',
          path: '0.1',
          level: 1,
        }),
        // 5 direct children
        ...Array(5).fill(null).map((_, i) =>
          createMockPosition({
            id: `pos-child-${i + 1}`,
            agent_id: `agent-00${i + 1}`,
            path: `0.1.${i + 1}`,
            level: 2,
            parent_id: 'pos-sponsor',
          })
        ),
      ];

      const result = findNextAvailablePosition(positions, 'sponsor-123');

      expect(result).not.toBeNull();
      expect(result?.path).toBe('0.1.1.1');
      expect(result?.level).toBe(3);
      expect(result?.position).toBe(1);
    });

    it('should return null when sponsor is not in matrix', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          id: 'pos-other',
          agent_id: 'other-agent',
          path: '0.1',
          level: 1,
        }),
      ];

      const result = findNextAvailablePosition(positions, 'non-existent');

      expect(result).toBeNull();
    });

    it('should not exceed matrix depth', () => {
      // Create a position at max depth
      const positions: MatrixPosition[] = [
        createMockPosition({
          id: 'pos-deep',
          agent_id: 'sponsor-123',
          path: '0.1.1.1.1.1.1.1', // Level 7 (max depth)
          level: 7,
        }),
      ];

      const result = findNextAvailablePosition(positions, 'sponsor-123');

      // Should return null because we're at max depth
      expect(result).toBeNull();
    });
  });

  describe('createMatrixPosition', () => {
    it('should create position record from placement candidate', () => {
      const placement = {
        parentId: 'parent-123',
        position: 3,
        level: 2,
        path: '0.1.3',
      };

      const result = createMatrixPosition('new-agent-123', placement);

      expect(result.agent_id).toBe('new-agent-123');
      expect(result.parent_id).toBe('parent-123');
      expect(result.position).toBe(3);
      expect(result.level).toBe(2);
      expect(result.path).toBe('0.1.3');
    });
  });

  describe('getUplineFromPath', () => {
    it('should get immediate upline', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          agent_id: 'sponsor-1',
          path: '0.1',
          level: 1,
        }),
        createMockPosition({
          agent_id: 'agent-1',
          path: '0.1.2',
          level: 2,
        }),
      ];

      const upline = getUplineFromPath('0.1.2', positions);

      expect(upline.length).toBe(1);
      expect(upline[0]).toBe('sponsor-1');
    });

    it('should get multiple generations of upline', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          agent_id: 'founder',
          path: '0',
          level: 0,
        }),
        createMockPosition({
          agent_id: 'gen-1',
          path: '0.1',
          level: 1,
        }),
        createMockPosition({
          agent_id: 'gen-2',
          path: '0.1.2',
          level: 2,
        }),
        createMockPosition({
          agent_id: 'gen-3',
          path: '0.1.2.3',
          level: 3,
        }),
      ];

      const upline = getUplineFromPath('0.1.2.3', positions);

      expect(upline.length).toBe(3);
      expect(upline[0]).toBe('gen-2'); // Direct sponsor
      expect(upline[1]).toBe('gen-1'); // 2nd gen
      expect(upline[2]).toBe('founder'); // 3rd gen
    });

    it('should limit to maxGenerations', () => {
      const positions: MatrixPosition[] = Array(8).fill(null).map((_, i) =>
        createMockPosition({
          agent_id: `agent-${i}`,
          path: Array(i + 1).fill('0').map((_, idx) => idx).join('.').replace(/^0\./, '0.'),
          level: i,
        })
      );

      // Manually fix paths
      positions[0].path = '0';
      positions[1].path = '0.1';
      positions[2].path = '0.1.1';
      positions[3].path = '0.1.1.1';
      positions[4].path = '0.1.1.1.1';
      positions[5].path = '0.1.1.1.1.1';
      positions[6].path = '0.1.1.1.1.1.1';
      positions[7].path = '0.1.1.1.1.1.1.1';

      const upline = getUplineFromPath('0.1.1.1.1.1.1.1', positions, 4);

      expect(upline.length).toBe(4);
    });

    it('should return empty array for root position', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          agent_id: 'founder',
          path: '0',
          level: 0,
        }),
      ];

      const upline = getUplineFromPath('0', positions);

      expect(upline.length).toBe(0);
    });
  });

  describe('getDownlineFromPath', () => {
    it('should get all downline positions', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          agent_id: 'root',
          path: '0.1',
          level: 1,
        }),
        createMockPosition({
          agent_id: 'child-1',
          path: '0.1.1',
          level: 2,
        }),
        createMockPosition({
          agent_id: 'child-2',
          path: '0.1.2',
          level: 2,
        }),
        createMockPosition({
          agent_id: 'grandchild',
          path: '0.1.1.1',
          level: 3,
        }),
        createMockPosition({
          agent_id: 'other',
          path: '0.2.1', // Not in downline of 0.1
          level: 2,
        }),
      ];

      const downline = getDownlineFromPath('0.1', positions);

      expect(downline.length).toBe(3);
      expect(downline.map(p => p.agent_id)).toContain('child-1');
      expect(downline.map(p => p.agent_id)).toContain('child-2');
      expect(downline.map(p => p.agent_id)).toContain('grandchild');
      expect(downline.map(p => p.agent_id)).not.toContain('other');
    });

    it('should return empty array when no downline exists', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          agent_id: 'leaf',
          path: '0.1.2.3',
          level: 3,
        }),
      ];

      const downline = getDownlineFromPath('0.1.2.3', positions);

      expect(downline.length).toBe(0);
    });

    it('should not include the root position itself', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          agent_id: 'root',
          path: '0.1',
          level: 1,
        }),
      ];

      const downline = getDownlineFromPath('0.1', positions);

      expect(downline.length).toBe(0);
    });
  });

  describe('getDirectChildren', () => {
    it('should get only direct children', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          agent_id: 'child-1',
          path: '0.1.1',
          level: 2,
        }),
        createMockPosition({
          agent_id: 'child-2',
          path: '0.1.2',
          level: 2,
        }),
        createMockPosition({
          agent_id: 'grandchild',
          path: '0.1.1.1',
          level: 3,
        }),
      ];

      const children = getDirectChildren('0.1', positions);

      expect(children.length).toBe(2);
      expect(children.map(p => p.agent_id)).toContain('child-1');
      expect(children.map(p => p.agent_id)).toContain('child-2');
      expect(children.map(p => p.agent_id)).not.toContain('grandchild');
    });

    it('should return empty array when no children exist', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          agent_id: 'leaf',
          path: '0.1.2.3',
          level: 3,
        }),
      ];

      const children = getDirectChildren('0.1.2.3', positions);

      expect(children.length).toBe(0);
    });

    it('should return all 5 children when full', () => {
      const positions: MatrixPosition[] = Array(5).fill(null).map((_, i) =>
        createMockPosition({
          agent_id: `child-${i + 1}`,
          path: `0.1.${i + 1}`,
          level: 2,
        })
      );

      const children = getDirectChildren('0.1', positions);

      expect(children.length).toBe(5);
    });
  });

  describe('countByLevel', () => {
    it('should count positions by level', () => {
      const positions: MatrixPosition[] = [
        // Level 0 relative to 0.1 (direct children)
        createMockPosition({ path: '0.1.1', level: 2 }),
        createMockPosition({ path: '0.1.2', level: 2 }),
        createMockPosition({ path: '0.1.3', level: 2 }),
        // Level 1 relative to 0.1 (grandchildren)
        createMockPosition({ path: '0.1.1.1', level: 3 }),
        createMockPosition({ path: '0.1.1.2', level: 3 }),
        // Level 2 relative to 0.1 (great-grandchildren)
        createMockPosition({ path: '0.1.1.1.1', level: 4 }),
      ];

      const counts = countByLevel('0.1', positions);

      // Relative levels: pos.level - baseLevel where baseLevel = path.split('.').length
      // '0.1'.split('.').length = 2
      // So positions at level 2 -> relative 0, level 3 -> relative 1, level 4 -> relative 2
      expect(counts[0]).toBe(3); // 3 direct children
      expect(counts[1]).toBe(2); // 2 grandchildren
      expect(counts[2]).toBe(1); // 1 great-grandchild
    });

    it('should return empty object when no downline', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({ path: '0.1', level: 1 }),
      ];

      const counts = countByLevel('0.1', positions);

      expect(Object.keys(counts).length).toBe(0);
    });
  });

  describe('buildMatrixTree', () => {
    it('should build tree structure', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          id: 'pos-root',
          agent_id: 'root-agent',
          path: '0.1',
          level: 1,
        }),
        createMockPosition({
          id: 'pos-child-1',
          agent_id: 'child-1',
          path: '0.1.1',
          level: 2,
        }),
        createMockPosition({
          id: 'pos-child-2',
          agent_id: 'child-2',
          path: '0.1.2',
          level: 2,
        }),
      ];

      const agents = new Map([
        ['root-agent', createMockAgent({ id: 'root-agent', first_name: 'Root' })],
        ['child-1', createMockAgent({ id: 'child-1', first_name: 'Child1' })],
        ['child-2', createMockAgent({ id: 'child-2', first_name: 'Child2' })],
      ]);

      const tree = buildMatrixTree('0.1', positions, agents);

      expect(tree).not.toBeNull();
      expect(tree?.agent?.id).toBe('root-agent');
      expect(tree?.children.length).toBe(2);
      expect(tree?.children[0].agent?.first_name).toBe('Child1');
      expect(tree?.children[1].agent?.first_name).toBe('Child2');
    });

    it('should return null when root not found', () => {
      const positions: MatrixPosition[] = [];
      const agents = new Map();

      const tree = buildMatrixTree('0.1', positions, agents);

      expect(tree).toBeNull();
    });

    it('should respect maxDepth', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({ agent_id: 'root', path: '0.1', level: 1 }),
        createMockPosition({ agent_id: 'l2', path: '0.1.1', level: 2 }),
        createMockPosition({ agent_id: 'l3', path: '0.1.1.1', level: 3 }),
        createMockPosition({ agent_id: 'l4', path: '0.1.1.1.1', level: 4 }),
      ];

      const agents = new Map([
        ['root', createMockAgent({ id: 'root' })],
        ['l2', createMockAgent({ id: 'l2' })],
        ['l3', createMockAgent({ id: 'l3' })],
        ['l4', createMockAgent({ id: 'l4' })],
      ]);

      const tree = buildMatrixTree('0.1', positions, agents, 2);

      expect(tree?.children.length).toBe(1); // Level 2
      expect(tree?.children[0].children.length).toBe(1); // Level 3 (at maxDepth=2)
      // Level 4 should not be included due to maxDepth
      expect(tree?.children[0].children[0].children.length).toBe(0);
    });

    it('should handle missing agents gracefully', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          agent_id: 'existing',
          path: '0.1',
          level: 1,
        }),
        createMockPosition({
          agent_id: 'missing',
          path: '0.1.1',
          level: 2,
        }),
      ];

      const agents = new Map([
        ['existing', createMockAgent({ id: 'existing' })],
        // 'missing' agent is not in the map
      ]);

      const tree = buildMatrixTree('0.1', positions, agents);

      expect(tree?.agent).not.toBeNull();
      expect(tree?.children[0].agent).toBeNull();
    });
  });

  describe('calculateMatrixStats', () => {
    it('should calculate correct stats for populated matrix', () => {
      const positions: MatrixPosition[] = [
        // Level 0 relative (5 direct children)
        ...Array(5).fill(null).map((_, i) =>
          createMockPosition({ path: `0.1.${i + 1}`, level: 2 })
        ),
        // Level 1 relative (10 grandchildren - 2 per child)
        ...Array(10).fill(null).map((_, i) =>
          createMockPosition({
            path: `0.1.${Math.floor(i / 2) + 1}.${(i % 2) + 1}`,
            level: 3
          })
        ),
      ];

      const stats = calculateMatrixStats('0.1', positions);

      expect(stats.totalDownline).toBe(15);
      expect(stats.directCount).toBe(5);
      // byLevel uses relative levels (pos.level - baseLevel where baseLevel = path.split('.').length)
      // '0.1'.split('.').length = 2, so level 2 positions -> relative 0, level 3 -> relative 1
      expect(stats.byLevel[0]).toBe(5);  // direct children
      expect(stats.byLevel[1]).toBe(10); // grandchildren
    });

    it('should calculate fill percentage correctly', () => {
      const positions: MatrixPosition[] = [
        // 5 direct children - full first level
        ...Array(5).fill(null).map((_, i) =>
          createMockPosition({ path: `0.1.${i + 1}`, level: 2 })
        ),
      ];

      const stats = calculateMatrixStats('0.1', positions);

      // First level is 5 positions, so fill percentage should be low
      // Max possible = 5^1 + 5^2 + ... + 5^6 = 19530 for 6 remaining levels
      expect(stats.directCount).toBe(5);
      expect(stats.fillPercentage).toBeGreaterThan(0);
    });

    it('should return zero stats for empty downline', () => {
      const positions: MatrixPosition[] = [];

      const stats = calculateMatrixStats('0.1', positions);

      expect(stats.totalDownline).toBe(0);
      expect(stats.directCount).toBe(0);
      expect(stats.fillPercentage).toBe(0);
    });

    it('should calculate max possible downline based on agent level', () => {
      // Agent at level 1 (path: 0.1)
      const positions1: MatrixPosition[] = [];
      const stats1 = calculateMatrixStats('0.1', positions1);

      // Agent at level 3 (path: 0.1.2.3)
      const positions3: MatrixPosition[] = [];
      const stats3 = calculateMatrixStats('0.1.2.3', positions3);

      // Level 1 agent has more remaining depth than level 3 agent
      expect(stats1.maxPossibleDownline).toBeGreaterThan(stats3.maxPossibleDownline);
    });
  });

  describe('Spillover placement scenarios', () => {
    it('should fill left to right across first level', () => {
      // Progressively add agents and verify spillover
      const sponsor = createMockPosition({
        id: 'pos-sponsor',
        agent_id: 'sponsor-123',
        path: '0.1',
        level: 1,
      });

      let positions = [sponsor];

      for (let i = 1; i <= 5; i++) {
        const result = findNextAvailablePosition(positions, 'sponsor-123');
        expect(result?.position).toBe(i);
        expect(result?.path).toBe(`0.1.${i}`);

        // Add this position for next iteration
        positions.push(
          createMockPosition({
            id: `pos-${i}`,
            agent_id: `agent-${i}`,
            path: result!.path,
            level: result!.level,
            parent_id: 'pos-sponsor',
          })
        );
      }
    });

    it('should spillover to second level when first is full', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          id: 'pos-sponsor',
          agent_id: 'sponsor-123',
          path: '0.1',
          level: 1,
        }),
        // Full first level
        ...Array(5).fill(null).map((_, i) =>
          createMockPosition({
            id: `pos-${i + 1}`,
            agent_id: `agent-${i + 1}`,
            path: `0.1.${i + 1}`,
            level: 2,
            parent_id: 'pos-sponsor',
          })
        ),
      ];

      // Next position should be 0.1.1.1 (first child of first child)
      const result = findNextAvailablePosition(positions, 'sponsor-123');

      expect(result?.path).toBe('0.1.1.1');
      expect(result?.level).toBe(3);
    });

    it('should fill left to right on second level', () => {
      const positions: MatrixPosition[] = [
        createMockPosition({
          id: 'pos-sponsor',
          agent_id: 'sponsor-123',
          path: '0.1',
          level: 1,
        }),
        createMockPosition({
          id: 'pos-child-1',
          agent_id: 'child-1',
          path: '0.1.1',
          level: 2,
        }),
        // First grandchild already placed
        createMockPosition({
          id: 'pos-gc-1',
          agent_id: 'gc-1',
          path: '0.1.1.1',
          level: 3,
        }),
      ];

      // With child spots 2-5 still empty, should place there first
      const result = findNextAvailablePosition(positions, 'sponsor-123');

      expect(result?.path).toBe('0.1.2');
      expect(result?.level).toBe(2);
    });
  });

  describe('Path manipulation', () => {
    it('should correctly determine level from path', () => {
      expect('0'.split('.').length - 1).toBe(0);
      expect('0.1'.split('.').length - 1).toBe(1);
      expect('0.1.2'.split('.').length - 1).toBe(2);
      expect('0.1.2.3.4.5.6.7'.split('.').length - 1).toBe(7);
    });

    it('should correctly identify parent path from child path', () => {
      const childPath = '0.1.2.3';
      const parentPath = childPath.split('.').slice(0, -1).join('.');

      expect(parentPath).toBe('0.1.2');
    });

    it('should correctly identify child paths', () => {
      const parentPath = '0.1.2';

      for (let i = 1; i <= 5; i++) {
        const childPath = `${parentPath}.${i}`;
        expect(childPath.startsWith(parentPath + '.')).toBe(true);
      }
    });
  });
});
