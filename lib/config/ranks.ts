/**
 * Rank Configuration
 * Single source of truth for all rank-related data
 */

export const RANKS = [
  'founder',
  'pre_associate',
  'associate',
  'sr_associate',
  'agent',
  'sr_agent',
  'mga',
  'associate_mga',
  'senior_mga',
  'regional_mga',
  'national_mga',
  'executive_mga',
  'premier_mga',
] as const;

export type Rank = (typeof RANKS)[number];

export interface RankConfig {
  id: Rank;
  name: string;
  shortName: string;
  order: number;
  requirements: {
    premium90Days: number;
    activeAgents: number;
    personalRecruits: number;
    mgasInDownline?: number; // For MGA tiers
  };
  persistencyRequired: number; // Percentage
  placementRequired: number; // Percentage
}

export const RANK_CONFIG: Record<Rank, RankConfig> = {
  founder: {
    id: 'founder',
    name: "Founder's Rank",
    shortName: 'Founder',
    order: 0,
    requirements: {
      premium90Days: 0,
      activeAgents: 0,
      personalRecruits: 0,
    },
    persistencyRequired: 0,
    placementRequired: 0,
  },
  pre_associate: {
    id: 'pre_associate',
    name: 'Pre-Associate',
    shortName: 'Pre-Assoc',
    order: 1,
    requirements: {
      premium90Days: 0,
      activeAgents: 0,
      personalRecruits: 0,
    },
    persistencyRequired: 0,
    placementRequired: 0,
  },
  associate: {
    id: 'associate',
    name: 'Associate',
    shortName: 'Assoc',
    order: 2,
    requirements: {
      premium90Days: 10000,
      activeAgents: 0,
      personalRecruits: 0,
    },
    persistencyRequired: 60,
    placementRequired: 80,
  },
  sr_associate: {
    id: 'sr_associate',
    name: 'Sr. Associate',
    shortName: 'Sr. Assoc',
    order: 3,
    requirements: {
      premium90Days: 25000,
      activeAgents: 0,
      personalRecruits: 0,
    },
    persistencyRequired: 60,
    placementRequired: 80,
  },
  agent: {
    id: 'agent',
    name: 'Agent',
    shortName: 'Agent',
    order: 4,
    requirements: {
      premium90Days: 45000,
      activeAgents: 0,
      personalRecruits: 0,
    },
    persistencyRequired: 60,
    placementRequired: 80,
  },
  sr_agent: {
    id: 'sr_agent',
    name: 'Sr. Agent',
    shortName: 'Sr. Agent',
    order: 5,
    requirements: {
      premium90Days: 75000,
      activeAgents: 5,
      personalRecruits: 1,
    },
    persistencyRequired: 60,
    placementRequired: 80,
  },
  mga: {
    id: 'mga',
    name: 'MGA',
    shortName: 'MGA',
    order: 6,
    requirements: {
      premium90Days: 150000,
      activeAgents: 10,
      personalRecruits: 3,
    },
    persistencyRequired: 60,
    placementRequired: 80,
  },
  associate_mga: {
    id: 'associate_mga',
    name: 'Associate MGA',
    shortName: 'Assoc MGA',
    order: 7,
    requirements: {
      premium90Days: 150000,
      activeAgents: 10,
      personalRecruits: 3,
      mgasInDownline: 2,
    },
    persistencyRequired: 60,
    placementRequired: 80,
  },
  senior_mga: {
    id: 'senior_mga',
    name: 'Senior MGA',
    shortName: 'Sr. MGA',
    order: 8,
    requirements: {
      premium90Days: 150000,
      activeAgents: 10,
      personalRecruits: 3,
      mgasInDownline: 4,
    },
    persistencyRequired: 60,
    placementRequired: 80,
  },
  regional_mga: {
    id: 'regional_mga',
    name: 'Regional MGA',
    shortName: 'Reg MGA',
    order: 9,
    requirements: {
      premium90Days: 150000,
      activeAgents: 10,
      personalRecruits: 3,
      mgasInDownline: 6,
    },
    persistencyRequired: 60,
    placementRequired: 80,
  },
  national_mga: {
    id: 'national_mga',
    name: 'National MGA',
    shortName: 'Nat MGA',
    order: 10,
    requirements: {
      premium90Days: 150000,
      activeAgents: 10,
      personalRecruits: 3,
      mgasInDownline: 8,
    },
    persistencyRequired: 60,
    placementRequired: 80,
  },
  executive_mga: {
    id: 'executive_mga',
    name: 'Executive MGA',
    shortName: 'Exec MGA',
    order: 11,
    requirements: {
      premium90Days: 150000,
      activeAgents: 10,
      personalRecruits: 3,
      mgasInDownline: 10,
    },
    persistencyRequired: 60,
    placementRequired: 80,
  },
  premier_mga: {
    id: 'premier_mga',
    name: 'Premier MGA',
    shortName: 'Prem MGA',
    order: 12,
    requirements: {
      premium90Days: 150000,
      activeAgents: 10,
      personalRecruits: 3,
      mgasInDownline: 12,
    },
    persistencyRequired: 60,
    placementRequired: 80,
  },
};

// Helper functions
export function getRankByOrder(order: number): Rank | undefined {
  return RANKS.find((r) => RANK_CONFIG[r].order === order);
}

export function getNextRank(currentRank: Rank): Rank | undefined {
  const currentOrder = RANK_CONFIG[currentRank].order;
  return getRankByOrder(currentOrder + 1);
}

export function getPreviousRank(currentRank: Rank): Rank | undefined {
  const currentOrder = RANK_CONFIG[currentRank].order;
  return getRankByOrder(currentOrder - 1);
}

export function isRankHigherOrEqual(rank1: Rank, rank2: Rank): boolean {
  return RANK_CONFIG[rank1].order >= RANK_CONFIG[rank2].order;
}

export function isMGATier(rank: Rank): boolean {
  return RANK_CONFIG[rank].order >= RANK_CONFIG.mga.order;
}
