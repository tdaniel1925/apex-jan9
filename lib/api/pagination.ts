/**
 * Pagination Utilities
 * Phase 2 - Issue #24: Standardized pagination helpers
 *
 * Provides cursor-based and offset-based pagination utilities
 * to prevent performance issues on large datasets
 */

import { z } from 'zod';

/**
 * Standard pagination schema for offset-based pagination
 * Usage: const params = paginationSchema.parse(searchParams)
 */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Extended pagination schema with search and filters
 */
export const searchPaginationSchema = paginationSchema.extend({
  search: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Pagination response metadata
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  page: number;
  totalPages: number;
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  total: number,
  limit: number,
  offset: number
): PaginationMeta {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const hasMore = offset + limit < total;

  return {
    total,
    limit,
    offset,
    hasMore,
    page,
    totalPages,
  };
}

/**
 * Standard paginated response format
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: calculatePaginationMeta(total, limit, offset),
  };
}

/**
 * Cursor-based pagination (for real-time feeds)
 * More efficient for infinite scroll and real-time data
 */
export const cursorPaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(), // Last item ID
  direction: z.enum(['forward', 'backward']).default('forward'),
});

export interface CursorPaginationMeta {
  limit: number;
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

/**
 * Create cursor pagination metadata
 */
export function createCursorPaginationMeta<T extends { id: string }>(
  data: T[],
  limit: number
): CursorPaginationMeta {
  const hasMore = data.length === limit;
  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : null;
  const prevCursor = data.length > 0 ? data[0].id : null;

  return {
    limit,
    nextCursor,
    prevCursor,
    hasMore,
  };
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: CursorPaginationMeta;
}

/**
 * Create a cursor-paginated response
 */
export function createCursorPaginatedResponse<T extends { id: string }>(
  data: T[],
  limit: number
): CursorPaginatedResponse<T> {
  return {
    data,
    pagination: createCursorPaginationMeta(data, limit),
  };
}

/**
 * Default pagination limits by endpoint type
 */
export const DEFAULT_LIMITS = {
  LIST: 50,           // Standard list views
  ADMIN: 100,         // Admin dashboards
  SEARCH: 25,         // Search results
  FEED: 20,           // Activity feeds
  COMPACT: 10,        // Compact widgets
} as const;

/**
 * Maximum allowed limits (security)
 */
export const MAX_LIMITS = {
  LIST: 100,
  ADMIN: 500,
  SEARCH: 100,
  FEED: 100,
  COMPACT: 50,
} as const;
