// SPEC: SPEC-DATA-MODEL > matrix_positions (placement algorithm)
// SPEC: WF-1 > Matrix placement (step 10)
// DEP-MAP: FEATURE 3 > Sign-Up Flow > SERVER > Matrix placement

import { eq, sql, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  matrixPositions,
  distributors,
  type MatrixPosition,
  type NewMatrixPosition,
} from "@/lib/db/schema";

const MAX_CHILDREN = 5; // 5×7 matrix: max 5 children per position
const MAX_DEPTH = 7; // Max 7 levels deep

/**
 * Result of finding a placement position
 */
export interface PlacementResult {
  /**
   * The parent position where the new member will be placed
   */
  parentPosition: MatrixPosition;

  /**
   * The index (0-4) under the parent
   */
  positionIndex: number;

  /**
   * Whether this is a spillover placement (parent's distributor != enroller)
   */
  isSpillover: boolean;

  /**
   * The new depth (parent.depth + 1)
   */
  depth: number;
}

/**
 * Find the next open position in the matrix for a new enrollee
 *
 * Uses BFS (breadth-first search) to find the shallowest position
 * with available slots, starting from the enroller's position.
 *
 * @param enrollerId - The distributor ID of the person enrolling the new member
 * @returns Placement information, or null if matrix is full
 */
export async function findNextOpenPosition(
  enrollerId: string
): Promise<PlacementResult | null> {
  // Get enroller's matrix position
  const [enrollerPosition] = await db
    .select()
    .from(matrixPositions)
    .where(eq(matrixPositions.distributorId, enrollerId))
    .limit(1);

  if (!enrollerPosition) {
    throw new Error(
      `Enroller ${enrollerId} does not have a matrix position`
    );
  }

  // Check if max depth would be exceeded
  if (enrollerPosition.depth >= MAX_DEPTH) {
    return null; // Matrix is full at this path
  }

  // Try direct placement under enroller first
  const enrollerChildren = await getChildrenCount(enrollerPosition.id);

  if (enrollerChildren < MAX_CHILDREN) {
    // Direct placement available
    return {
      parentPosition: enrollerPosition,
      positionIndex: enrollerChildren,
      isSpillover: false,
      depth: enrollerPosition.depth + 1,
    };
  }

  // Enroller is full, use BFS to find next available position in subtree
  const spilloverPosition = await findSpilloverPosition(enrollerPosition);

  if (!spilloverPosition) {
    return null; // Entire subtree is full
  }

  return spilloverPosition;
}

/**
 * Get count of children for a position
 */
async function getChildrenCount(positionId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(matrixPositions)
    .where(eq(matrixPositions.parentId, positionId));

  return Number(result[0]?.count || 0);
}

/**
 * Get all children of a position
 */
async function getChildren(positionId: string): Promise<MatrixPosition[]> {
  return db
    .select()
    .from(matrixPositions)
    .where(eq(matrixPositions.parentId, positionId))
    .orderBy(matrixPositions.positionIndex);
}

/**
 * Find spillover position using BFS
 */
async function findSpilloverPosition(
  enrollerPosition: MatrixPosition
): Promise<PlacementResult | null> {
  // BFS queue: positions to check
  const queue: MatrixPosition[] = [enrollerPosition];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    // Check if this position has space
    const childrenCount = await getChildrenCount(current.id);

    // Check depth limit
    if (current.depth + 1 > MAX_DEPTH) {
      continue; // Can't go deeper
    }

    if (childrenCount < MAX_CHILDREN) {
      // Found an open slot!
      return {
        parentPosition: current,
        positionIndex: childrenCount,
        isSpillover: true, // This is spillover since it's not directly under enroller
        depth: current.depth + 1,
      };
    }

    // This position is full, add its children to queue
    const children = await getChildren(current.id);
    queue.push(...children);
  }

  return null; // No available positions found
}

/**
 * Calculate materialized path for a position
 */
function calculatePath(
  parentPath: string,
  parentId: string,
  positionIndex: number
): string {
  return `${parentPath}.${parentId}:${positionIndex}`;
}

/**
 * Create initial root position for company root distributor
 */
export async function createRootPosition(
  distributorId: string
): Promise<MatrixPosition> {
  const [position] = await db
    .insert(matrixPositions)
    .values({
      distributorId,
      parentId: null,
      positionIndex: 0,
      depth: 0,
      path: "root",
      leftBoundary: 1,
      rightBoundary: 2,
      isSpillover: false,
    })
    .returning();

  return position;
}

/**
 * Place a new distributor in the matrix
 *
 * This function MUST be called within a database transaction
 * to prevent race conditions during concurrent sign-ups.
 *
 * @param distributorId - The ID of the new distributor to place
 * @param enrollerId - The ID of the distributor who enrolled them
 * @returns The created matrix position
 */
export async function placeDistributorInMatrix(
  distributorId: string,
  enrollerId: string
): Promise<MatrixPosition> {
  return await db.transaction(async (tx) => {
    // Find placement position
    const placement = await findNextOpenPosition(enrollerId);

    if (!placement) {
      throw new Error(
        "Matrix is full - no available positions in organization"
      );
    }

    const { parentPosition, positionIndex, isSpillover, depth } = placement;

    // Lock the parent row to prevent concurrent placements
    // This ensures two sign-ups at the same time don't get the same position
    await tx.execute(
      sql`SELECT * FROM ${matrixPositions} WHERE ${matrixPositions.id} = ${parentPosition.id} FOR UPDATE`
    );

    // Re-check children count after acquiring lock
    const [childCountResult] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(matrixPositions)
      .where(eq(matrixPositions.parentId, parentPosition.id));

    const actualChildCount = Number(childCountResult?.count || 0);

    if (actualChildCount >= MAX_CHILDREN) {
      // Someone else filled this spot, need to find another position
      // This is a rare race condition - throw error to retry
      throw new Error(
        "Position was filled by another concurrent sign-up - please retry"
      );
    }

    // Calculate path
    const path = calculatePath(
      parentPosition.path,
      parentPosition.id,
      actualChildCount
    );

    // For nested set: simple implementation
    // In production, you'd want to properly update all affected boundaries
    // For now, we'll use a simplified approach
    const leftBoundary = parentPosition.rightBoundary;
    const rightBoundary = leftBoundary + 1;

    // Update parent's right boundary to make room
    await tx
      .update(matrixPositions)
      .set({ rightBoundary: parentPosition.rightBoundary + 2 })
      .where(eq(matrixPositions.id, parentPosition.id));

    // Create the new position
    const [newPosition] = await tx
      .insert(matrixPositions)
      .values({
        distributorId,
        parentId: parentPosition.id,
        positionIndex: actualChildCount,
        depth,
        path,
        leftBoundary,
        rightBoundary,
        isSpillover,
      })
      .returning();

    return newPosition;
  });
}

/**
 * Get distributor's full organization tree (for visualization)
 */
export async function getOrganizationTree(
  distributorId: string,
  maxDepth: number = 3
): Promise<MatrixPosition[]> {
  // Get the distributor's position
  const [position] = await db
    .select()
    .from(matrixPositions)
    .where(eq(matrixPositions.distributorId, distributorId))
    .limit(1);

  if (!position) {
    return [];
  }

  // Get all positions in subtree using path prefix match
  // Limited by depth to avoid loading huge trees
  const positions = await db
    .select()
    .from(matrixPositions)
    .where(
      and(
        sql`${matrixPositions.path} LIKE ${position.path + "%"}`,
        sql`${matrixPositions.depth} <= ${position.depth + maxDepth}`
      )
    )
    .orderBy(matrixPositions.depth, matrixPositions.path);

  return positions;
}

/**
 * Count total organization size for a distributor
 */
export async function getOrganizationSize(
  distributorId: string
): Promise<number> {
  const [position] = await db
    .select()
    .from(matrixPositions)
    .where(eq(matrixPositions.distributorId, distributorId))
    .limit(1);

  if (!position) {
    return 0;
  }

  // Count using nested set boundaries
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(matrixPositions)
    .where(
      and(
        sql`${matrixPositions.leftBoundary} > ${position.leftBoundary}`,
        sql`${matrixPositions.rightBoundary} < ${position.rightBoundary}`
      )
    );

  return Number(result[0]?.count || 0);
}

/**
 * Get direct enrollees count (not spillover)
 */
export async function getDirectEnrolleesCount(
  distributorId: string
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(distributors)
    .where(eq(distributors.enrollerId, distributorId));

  return Number(result[0]?.count || 0);
}
