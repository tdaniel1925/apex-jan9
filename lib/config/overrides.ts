/**
 * Override Configuration
 * 6-Generation override percentages (carrier-paid)
 */

export const MAX_GENERATIONS = 6;
export const OVERRIDE_LEADERSHIP_POOL_PERCENTAGE = 0.005; // 0.5% of commission overrides

export interface GenerationOverride {
  generation: number;
  percentage: number; // As decimal (0.15 = 15%)
  cumulativePercentage: number;
}

export const GENERATION_OVERRIDES: GenerationOverride[] = [
  { generation: 1, percentage: 0.15, cumulativePercentage: 0.15 },
  { generation: 2, percentage: 0.05, cumulativePercentage: 0.20 },
  { generation: 3, percentage: 0.03, cumulativePercentage: 0.23 },
  { generation: 4, percentage: 0.02, cumulativePercentage: 0.25 },
  { generation: 5, percentage: 0.01, cumulativePercentage: 0.26 },
  { generation: 6, percentage: 0.005, cumulativePercentage: 0.265 },
];

// Total override including leadership pool: 27%
export const TOTAL_OVERRIDE_PERCENTAGE = 0.27;

/**
 * Get override percentage for a specific generation
 */
export function getOverridePercentage(generation: number): number {
  if (generation < 1 || generation > MAX_GENERATIONS) {
    return 0;
  }
  return GENERATION_OVERRIDES[generation - 1].percentage;
}

/**
 * Calculate override amount for a generation
 */
export function calculateOverrideAmount(
  commissionAmount: number,
  generation: number
): number {
  const percentage = getOverridePercentage(generation);
  return commissionAmount * percentage;
}

/**
 * Calculate all 6 generation overrides for a commission
 */
export function calculateAllOverrides(commissionAmount: number): {
  generation: number;
  amount: number;
  percentage: number;
}[] {
  return GENERATION_OVERRIDES.map((gen) => ({
    generation: gen.generation,
    amount: commissionAmount * gen.percentage,
    percentage: gen.percentage,
  }));
}
