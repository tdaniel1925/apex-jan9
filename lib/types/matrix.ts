// SPEC: SPEC-DATA-MODEL > matrix_positions table
// TypeScript types for Matrix domain

import type { MatrixPosition as DbMatrixPosition } from "@/lib/db/schema";

export type MatrixPosition = DbMatrixPosition;

export type NewMatrixPosition = {
  distributorId: string;
  parentId?: string;
  positionIndex: number;
  depth: number;
  path: string;
  leftBoundary: number;
  rightBoundary: number;
  isSpillover: boolean;
};

export type TreeNode = {
  id: string;
  distributorId: string;
  distributorName: string;
  distributorPhoto?: string;
  distributorUsername: string;
  positionIndex: number;
  depth: number;
  isDirect: boolean;
  isSpillover: boolean;
  dateJoined: Date;
  children: TreeNode[];
  childCount: number;
};

export type PlacementResult = {
  success: boolean;
  position?: MatrixPosition;
  error?: string;
  parentId?: string;
  positionIndex?: number;
  depth?: number;
  isSpillover?: boolean;
};

export type MatrixStats = {
  totalInOrg: number;
  directEnrollees: number;
  spilloverPlacements: number;
  levelsDeep: number;
  openPositions: number;
};
