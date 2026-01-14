/**
 * Matrix Engine
 * Single source of truth for 5x7 forced matrix operations
 *
 * Matrix Structure with Founders Club:
 * - Level 0: FC Inc. (root) at position 0, path '0'
 * - Level 1: Positions 1-5 directly under FC Inc., paths '0.1' through '0.5'
 * - Level 2+: Regular agents with spillover placement
 */

import { MatrixPosition, Agent } from '../types/database';

// Matrix configuration
export const MATRIX_WIDTH = 5;
export const MATRIX_DEPTH = 7;
export const MAX_POSITIONS = Math.pow(MATRIX_WIDTH, MATRIX_DEPTH + 1) - 1; // 97,656 positions

// Root configuration
export const ROOT_PATH = '0';
export const FC_INC_AGENT_CODE = 'FC-INC-001';

export interface MatrixNode {
  position: MatrixPosition;
  agent: Agent | null;
  children: MatrixNode[];
}

export interface PlacementResult {
  success: boolean;
  position: Omit<MatrixPosition, 'id' | 'created_at'> | null;
  error?: string;
}

export interface SpilloverCandidate {
  parentId: string;
  position: number;
  level: number;
  path: string;
}

/**
 * Find the next available position using spillover logic
 * Spillover fills left to right, top to bottom
 */
export function findNextAvailablePosition(
  existingPositions: MatrixPosition[],
  sponsorId: string
): SpilloverCandidate | null {
  // Build a set of occupied positions for quick lookup
  const occupiedPaths = new Set(existingPositions.map((p) => p.path));

  // Find the sponsor's position
  const sponsorPosition = existingPositions.find(
    (p) => p.agent_id === sponsorId
  );

  if (!sponsorPosition) {
    // Sponsor has no matrix position - this shouldn't happen for valid sponsors
    return null;
  }

  // BFS to find first available position under sponsor
  const queue: SpilloverCandidate[] = [];

  // Start with sponsor's direct children
  for (let pos = 1; pos <= MATRIX_WIDTH; pos++) {
    const childPath = `${sponsorPosition.path}.${pos}`;
    const childLevel = sponsorPosition.level + 1;

    if (childLevel <= MATRIX_DEPTH && !occupiedPaths.has(childPath)) {
      return {
        parentId: sponsorPosition.id,
        position: pos,
        level: childLevel,
        path: childPath,
      };
    }

    if (childLevel < MATRIX_DEPTH) {
      queue.push({
        parentId: sponsorPosition.id,
        position: pos,
        level: childLevel,
        path: childPath,
      });
    }
  }

  // BFS through the tree
  while (queue.length > 0) {
    const current = queue.shift()!;

    // Find the actual position record for this path
    const currentPosition = existingPositions.find(
      (p) => p.path === current.path
    );

    if (!currentPosition) {
      // This position is available!
      // But we need to find its parent
      const parentPath = current.path.split('.').slice(0, -1).join('.');
      const parentPosition = existingPositions.find(
        (p) => p.path === parentPath
      );

      if (parentPosition) {
        return {
          parentId: parentPosition.id,
          position: current.position,
          level: current.level,
          path: current.path,
        };
      }
      continue;
    }

    // Position is occupied, add its children to queue
    if (current.level < MATRIX_DEPTH) {
      for (let pos = 1; pos <= MATRIX_WIDTH; pos++) {
        const childPath = `${current.path}.${pos}`;
        const childLevel = current.level + 1;

        if (!occupiedPaths.has(childPath)) {
          return {
            parentId: currentPosition.id,
            position: pos,
            level: childLevel,
            path: childPath,
          };
        }

        if (childLevel < MATRIX_DEPTH) {
          queue.push({
            parentId: currentPosition.id,
            position: pos,
            level: childLevel,
            path: childPath,
          });
        }
      }
    }
  }

  // No available position found (matrix is full under this sponsor)
  return null;
}

/**
 * Create a new matrix position record
 */
export function createMatrixPosition(
  agentId: string,
  placement: SpilloverCandidate
): Omit<MatrixPosition, 'id' | 'created_at'> {
  return {
    agent_id: agentId,
    parent_id: placement.parentId,
    position: placement.position,
    level: placement.level,
    path: placement.path,
  };
}

/**
 * Get all upline agents (for override calculations)
 * Returns agents from immediate sponsor up to 6 generations
 */
export function getUplineFromPath(
  path: string,
  positions: MatrixPosition[],
  maxGenerations: number = 6
): string[] {
  const pathParts = path.split('.');
  const uplineIds: string[] = [];

  // Remove the agent's own position from path
  pathParts.pop();

  // Walk up the tree, collecting agent IDs
  while (pathParts.length > 0 && uplineIds.length < maxGenerations) {
    const ancestorPath = pathParts.join('.');
    const ancestor = positions.find((p) => p.path === ancestorPath);

    if (ancestor) {
      uplineIds.push(ancestor.agent_id);
    }

    pathParts.pop();
  }

  return uplineIds;
}

/**
 * Get all downline positions (for team counts)
 */
export function getDownlineFromPath(
  path: string,
  positions: MatrixPosition[]
): MatrixPosition[] {
  return positions.filter(
    (p) => p.path.startsWith(path + '.') && p.path !== path
  );
}

/**
 * Get direct children positions
 */
export function getDirectChildren(
  parentPath: string,
  positions: MatrixPosition[]
): MatrixPosition[] {
  const parentLevel = parentPath.split('.').length;
  return positions.filter((p) => {
    const pathParts = p.path.split('.');
    return (
      pathParts.length === parentLevel + 1 &&
      p.path.startsWith(parentPath + '.')
    );
  });
}

/**
 * Count positions at each level under an agent
 */
export function countByLevel(
  path: string,
  positions: MatrixPosition[]
): Record<number, number> {
  const downline = getDownlineFromPath(path, positions);
  const baseLevel = path.split('.').length;
  const counts: Record<number, number> = {};

  for (const pos of downline) {
    const level = pos.level - baseLevel;
    counts[level] = (counts[level] || 0) + 1;
  }

  return counts;
}

/**
 * Build a tree structure for visualization
 */
export function buildMatrixTree(
  rootPath: string,
  positions: MatrixPosition[],
  agents: Map<string, Agent>,
  maxDepth: number = MATRIX_DEPTH
): MatrixNode | null {
  const rootPosition = positions.find((p) => p.path === rootPath);
  if (!rootPosition) return null;

  function buildNode(position: MatrixPosition, depth: number): MatrixNode {
    const children: MatrixNode[] = [];

    if (depth < maxDepth) {
      const directChildren = getDirectChildren(position.path, positions);
      for (const child of directChildren) {
        children.push(buildNode(child, depth + 1));
      }
    }

    return {
      position,
      agent: agents.get(position.agent_id) || null,
      children,
    };
  }

  return buildNode(rootPosition, 0);
}

/**
 * Calculate matrix statistics for an agent
 */
export interface MatrixStats {
  totalDownline: number;
  byLevel: Record<number, number>;
  directCount: number;
  fillPercentage: number;
  maxPossibleDownline: number;
}

export function calculateMatrixStats(
  agentPath: string,
  positions: MatrixPosition[]
): MatrixStats {
  const downline = getDownlineFromPath(agentPath, positions);
  const direct = getDirectChildren(agentPath, positions);
  const byLevel = countByLevel(agentPath, positions);

  const agentLevel = agentPath.split('.').length - 1;
  const remainingDepth = MATRIX_DEPTH - agentLevel;

  // Calculate max possible downline
  let maxPossible = 0;
  for (let i = 1; i <= remainingDepth; i++) {
    maxPossible += Math.pow(MATRIX_WIDTH, i);
  }

  const fillPercentage =
    maxPossible > 0 ? (downline.length / maxPossible) * 100 : 0;

  return {
    totalDownline: downline.length,
    byLevel,
    directCount: direct.length,
    fillPercentage,
    maxPossibleDownline: maxPossible,
  };
}
