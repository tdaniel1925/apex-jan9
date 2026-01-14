/**
 * Carrier Configuration
 * Single source of truth for carrier commission rates by rank
 */

import { Rank } from './ranks';

export const CARRIERS = [
  'columbus_life',
  'aig',
  'fg',
  'moo',
  'nlg',
  'symetra',
  'na',
  'retail',
] as const;

export type Carrier = (typeof CARRIERS)[number];

export interface CarrierConfig {
  id: Carrier;
  name: string;
  shortName: string;
  commissionRates: Record<Rank, number>; // Percentage as decimal (0.50 = 50%)
}

export const CARRIER_CONFIG: Record<Carrier, CarrierConfig> = {
  columbus_life: {
    id: 'columbus_life',
    name: 'Columbus Life',
    shortName: 'Columbus',
    commissionRates: {
      founder: 0, // Founders only earn overrides, not direct commissions
      pre_associate: 0.50,
      associate: 0.55,
      sr_associate: 0.60,
      agent: 0.70,
      sr_agent: 0.80,
      mga: 0.90,
      associate_mga: 0.90,
      senior_mga: 0.90,
      regional_mga: 0.90,
      national_mga: 0.90,
      executive_mga: 0.90,
      premier_mga: 0.90,
    },
  },
  aig: {
    id: 'aig',
    name: 'AIG',
    shortName: 'AIG',
    commissionRates: {
      founder: 0, // Founders only earn overrides, not direct commissions
      pre_associate: 0.40,
      associate: 0.45,
      sr_associate: 0.50,
      agent: 0.60,
      sr_agent: 0.70,
      mga: 0.80,
      associate_mga: 0.80,
      senior_mga: 0.80,
      regional_mga: 0.80,
      national_mga: 0.80,
      executive_mga: 0.80,
      premier_mga: 0.80,
    },
  },
  fg: {
    id: 'fg',
    name: 'F+G',
    shortName: 'F+G',
    commissionRates: {
      founder: 0, // Founders only earn overrides, not direct commissions
      pre_associate: 0.50,
      associate: 0.55,
      sr_associate: 0.60,
      agent: 0.70,
      sr_agent: 0.80,
      mga: 0.90,
      associate_mga: 0.90,
      senior_mga: 0.90,
      regional_mga: 0.90,
      national_mga: 0.90,
      executive_mga: 0.90,
      premier_mga: 0.90,
    },
  },
  moo: {
    id: 'moo',
    name: 'MOO',
    shortName: 'MOO',
    commissionRates: {
      founder: 0, // Founders only earn overrides, not direct commissions
      pre_associate: 0.60,
      associate: 0.65,
      sr_associate: 0.70,
      agent: 0.80,
      sr_agent: 0.90,
      mga: 1.00,
      associate_mga: 1.00,
      senior_mga: 1.00,
      regional_mga: 1.00,
      national_mga: 1.00,
      executive_mga: 1.00,
      premier_mga: 1.00,
    },
  },
  nlg: {
    id: 'nlg',
    name: 'NLG',
    shortName: 'NLG',
    commissionRates: {
      founder: 0, // Founders only earn overrides, not direct commissions
      pre_associate: 0.40,
      associate: 0.45,
      sr_associate: 0.50,
      agent: 0.60,
      sr_agent: 0.70,
      mga: 0.80,
      associate_mga: 0.80,
      senior_mga: 0.80,
      regional_mga: 0.80,
      national_mga: 0.80,
      executive_mga: 0.80,
      premier_mga: 0.80,
    },
  },
  symetra: {
    id: 'symetra',
    name: 'Symetra',
    shortName: 'Symetra',
    commissionRates: {
      founder: 0, // Founders only earn overrides, not direct commissions
      pre_associate: 0.40,
      associate: 0.45,
      sr_associate: 0.50,
      agent: 0.60,
      sr_agent: 0.70,
      mga: 0.80,
      associate_mga: 0.80,
      senior_mga: 0.80,
      regional_mga: 0.80,
      national_mga: 0.80,
      executive_mga: 0.80,
      premier_mga: 0.80,
    },
  },
  na: {
    id: 'na',
    name: 'North American',
    shortName: 'NA',
    commissionRates: {
      founder: 0, // Founders only earn overrides, not direct commissions
      pre_associate: 0.45,
      associate: 0.50,
      sr_associate: 0.55,
      agent: 0.65,
      sr_agent: 0.75,
      mga: 0.85,
      associate_mga: 0.85,
      senior_mga: 0.85,
      regional_mga: 0.85,
      national_mga: 0.85,
      executive_mga: 0.85,
      premier_mga: 0.85,
    },
  },
  retail: {
    id: 'retail',
    name: 'Retail Products',
    shortName: 'Retail',
    // Note: Retail commissions use retail-commission-engine rates, not these
    commissionRates: {
      founder: 0, // Founders only earn overrides, not direct commissions
      pre_associate: 0.10,
      associate: 0.12,
      sr_associate: 0.13,
      agent: 0.15,
      sr_agent: 0.17,
      mga: 0.20,
      associate_mga: 0.22,
      senior_mga: 0.25,
      regional_mga: 0.27,
      national_mga: 0.30,
      executive_mga: 0.32,
      premier_mga: 0.35,
    },
  },
};

// Helper function to get commission rate
export function getCommissionRate(carrier: Carrier, rank: Rank): number {
  return CARRIER_CONFIG[carrier].commissionRates[rank];
}

// Calculate commission amount
export function calculateCommission(
  carrier: Carrier,
  rank: Rank,
  premium: number
): number {
  const rate = getCommissionRate(carrier, rank);
  return premium * rate;
}
