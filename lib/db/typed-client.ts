/**
 * Typed Supabase Client Helpers
 * Provides properly typed wrappers for Supabase queries
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Type alias for cleaner code
type Tables = Database['public']['Tables'];

// Table names type
export type TableName = keyof Tables;

// Row type for a given table
export type Row<T extends TableName> = Tables[T]['Row'];

// Insert type for a given table
export type Insert<T extends TableName> = Tables[T]['Insert'];

// Update type for a given table
export type Update<T extends TableName> = Tables[T]['Update'];

/**
 * Type-safe query builder wrapper
 * Use this when TypeScript isn't inferring types correctly
 */
export function typedFrom<T extends TableName>(
  supabase: SupabaseClient<Database>,
  table: T
) {
  return supabase.from(table);
}

/**
 * Type assertion helper for query results
 */
export function assertRow<T extends TableName>(
  data: unknown
): Row<T> | null {
  return data as Row<T> | null;
}

/**
 * Type assertion helper for array results
 */
export function assertRows<T extends TableName>(
  data: unknown
): Row<T>[] {
  return (data as Row<T>[]) || [];
}
