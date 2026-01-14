/**
 * Compression Engine
 * Handles "compression" logic for MLM override calculations
 *
 * When an agent in the upline is inactive/unqualified:
 * - They are "compressed" (skipped) in override calculations
 * - The next qualified upline receives that generation's override
 * - This prevents commission "leakage" to inactive accounts
 *
 * Example:
 * Original: Agent A (Gen 1) -> Agent B (Gen 2, INACTIVE) -> Agent C (Gen 3)
 * Compressed: Agent A (Gen 1) -> Agent C (Gen 2) - B is skipped
 */

import { Agent, MatrixPosition } from '../types/database';
import { MAX_GENERATIONS, getOverridePercentage } from '../config/overrides';
import { isRankExemptFromQualification } from './qualification-engine';

export type CompressionReason =
  | 'inactive'
  | 'unqualified'
  | 'terminated'
  | 'compliance_hold'
  | 'below_minimum_volume';

export interface AgentQualificationStatus {
  agentId: string;
  isQualified: boolean;
  reason?: CompressionReason;
}

export interface CompressedUplineResult {
  originalUpline: { id: string; generation: number }[];
  compressedUpline: { id: string; generation: number; originalGeneration: number }[];
  skippedAgents: { id: string; reason: CompressionReason; generation: number }[];
  compressionApplied: boolean;
}

export interface CompressionConfig {
  // Minimum PBV required to be qualified for overrides
  minPersonalVolume: number;
  // Days of inactivity before compression
  inactivityDays: number;
  // Whether to compress agents on compliance hold
  compressOnComplianceHold: boolean;
  // Whether to compress terminated agents
  compressOnTerminated: boolean;
}

// Default compression configuration
export const DEFAULT_COMPRESSION_CONFIG: CompressionConfig = {
  minPersonalVolume: 0, // Set to 0 to disable volume requirement
  inactivityDays: 90,
  compressOnComplianceHold: true,
  compressOnTerminated: true,
};

/**
 * Check if an agent is qualified to receive overrides
 */
export function isAgentQualifiedForOverrides(
  agent: Agent,
  config: CompressionConfig = DEFAULT_COMPRESSION_CONFIG
): AgentQualificationStatus {
  // Founders are always qualified for overrides - exempt from all requirements
  if (isRankExemptFromQualification(agent.rank)) {
    return {
      agentId: agent.id,
      isQualified: true,
    };
  }

  // Terminated agents are never qualified
  if (agent.status === 'terminated') {
    return {
      agentId: agent.id,
      isQualified: false,
      reason: 'terminated',
    };
  }

  // Inactive agents are not qualified
  if (agent.status === 'inactive') {
    return {
      agentId: agent.id,
      isQualified: false,
      reason: 'inactive',
    };
  }

  // Check minimum personal volume (if configured)
  if (config.minPersonalVolume > 0) {
    if (agent.pbv_90_days < config.minPersonalVolume) {
      return {
        agentId: agent.id,
        isQualified: false,
        reason: 'below_minimum_volume',
      };
    }
  }

  // Agent is qualified
  return {
    agentId: agent.id,
    isQualified: true,
  };
}

/**
 * Get compressed upline for override calculations
 * Skips unqualified agents and reassigns generation numbers
 */
export function getCompressedUpline(
  originalUpline: { id: string; generation: number }[],
  agentQualifications: Map<string, AgentQualificationStatus>,
  maxGenerations: number = MAX_GENERATIONS
): CompressedUplineResult {
  const compressedUpline: { id: string; generation: number; originalGeneration: number }[] = [];
  const skippedAgents: { id: string; reason: CompressionReason; generation: number }[] = [];
  let compressedGen = 1;

  for (const uplineEntry of originalUpline) {
    const qualification = agentQualifications.get(uplineEntry.id);

    // If no qualification data, assume qualified (fail-safe)
    if (!qualification) {
      if (compressedGen <= maxGenerations) {
        compressedUpline.push({
          id: uplineEntry.id,
          generation: compressedGen,
          originalGeneration: uplineEntry.generation,
        });
        compressedGen++;
      }
      continue;
    }

    if (qualification.isQualified) {
      // Qualified agent gets next available generation
      if (compressedGen <= maxGenerations) {
        compressedUpline.push({
          id: uplineEntry.id,
          generation: compressedGen,
          originalGeneration: uplineEntry.generation,
        });
        compressedGen++;
      }
    } else {
      // Unqualified agent is skipped
      skippedAgents.push({
        id: uplineEntry.id,
        reason: qualification.reason!,
        generation: uplineEntry.generation,
      });
    }
  }

  return {
    originalUpline,
    compressedUpline,
    skippedAgents,
    compressionApplied: skippedAgents.length > 0,
  };
}

/**
 * Calculate override amounts with compression
 */
export function calculateCompressedOverrides(
  commissionAmount: number,
  compressedUpline: CompressedUplineResult
): {
  agentId: string;
  generation: number;
  originalGeneration: number;
  overrideRate: number;
  overrideAmount: number;
}[] {
  return compressedUpline.compressedUpline.map((entry) => {
    // Use compressed generation for rate calculation
    const overrideRate = getOverridePercentage(entry.generation);
    const overrideAmount = commissionAmount * overrideRate;

    return {
      agentId: entry.id,
      generation: entry.generation,
      originalGeneration: entry.originalGeneration,
      overrideRate,
      overrideAmount,
    };
  });
}

/**
 * Build qualification map from agent list
 */
export function buildQualificationMap(
  agents: Agent[],
  config: CompressionConfig = DEFAULT_COMPRESSION_CONFIG
): Map<string, AgentQualificationStatus> {
  const map = new Map<string, AgentQualificationStatus>();

  for (const agent of agents) {
    map.set(agent.id, isAgentQualifiedForOverrides(agent, config));
  }

  return map;
}

/**
 * Get upline from materialized path with generation numbers
 */
export function getUplineWithGenerations(
  agentPath: string,
  allPositions: MatrixPosition[]
): { id: string; generation: number }[] {
  const pathParts = agentPath.split('.').filter(Boolean);
  const upline: { id: string; generation: number }[] = [];

  // Walk up the path from immediate parent
  for (let i = pathParts.length - 2; i >= 0; i--) {
    const ancestorPath = pathParts.slice(0, i + 1).join('.');
    const generation = pathParts.length - i - 1;

    // Find agent at this position
    const position = allPositions.find((p) => p.path === ancestorPath);
    if (position) {
      upline.push({
        id: position.agent_id,
        generation,
      });
    }

    // Stop at max generations
    if (generation >= MAX_GENERATIONS) {
      break;
    }
  }

  return upline;
}

/**
 * Calculate compression statistics for reporting
 */
export function calculateCompressionStats(
  results: CompressedUplineResult[]
): {
  totalTransactions: number;
  transactionsWithCompression: number;
  compressionRate: number;
  totalSkippedAgents: number;
  skipReasons: Record<CompressionReason, number>;
  averageCompressedGenerations: number;
} {
  const totalTransactions = results.length;
  const transactionsWithCompression = results.filter(
    (r) => r.compressionApplied
  ).length;

  const skipReasons: Record<CompressionReason, number> = {
    inactive: 0,
    unqualified: 0,
    terminated: 0,
    compliance_hold: 0,
    below_minimum_volume: 0,
  };

  let totalSkipped = 0;
  let totalCompressedGens = 0;

  for (const result of results) {
    for (const skipped of result.skippedAgents) {
      skipReasons[skipped.reason]++;
      totalSkipped++;
    }
    totalCompressedGens += result.compressedUpline.length;
  }

  return {
    totalTransactions,
    transactionsWithCompression,
    compressionRate:
      totalTransactions > 0
        ? transactionsWithCompression / totalTransactions
        : 0,
    totalSkippedAgents: totalSkipped,
    skipReasons,
    averageCompressedGenerations:
      totalTransactions > 0 ? totalCompressedGens / totalTransactions : 0,
  };
}

/**
 * Determine if compression should be applied
 * Based on company policy settings
 */
export function shouldApplyCompression(
  companySettings: { compressionEnabled: boolean; compressionMode: 'full' | 'partial' | 'none' }
): boolean {
  if (!companySettings.compressionEnabled) {
    return false;
  }

  return companySettings.compressionMode !== 'none';
}

/**
 * Format compression report for display
 */
export function formatCompressionReport(
  result: CompressedUplineResult,
  commissionAmount: number
): string {
  const lines: string[] = [
    'COMPRESSION REPORT',
    '==================',
    '',
  ];

  if (!result.compressionApplied) {
    lines.push('No compression applied - all upline agents qualified');
    return lines.join('\n');
  }

  lines.push(`Skipped ${result.skippedAgents.length} unqualified agent(s):`);
  for (const skipped of result.skippedAgents) {
    lines.push(`  - Gen ${skipped.generation}: ${skipped.reason}`);
  }

  lines.push('');
  lines.push('Compressed Override Distribution:');

  const overrides = calculateCompressedOverrides(commissionAmount, result);
  for (const override of overrides) {
    lines.push(
      `  Gen ${override.generation} (was Gen ${override.originalGeneration}): ` +
      `${(override.overrideRate * 100).toFixed(1)}% = $${override.overrideAmount.toFixed(2)}`
    );
  }

  return lines.join('\n');
}
