/**
 * Database Transaction Utility
 * Provides transaction wrapping for multi-step operations
 *
 * Phase 2 Data Integrity Enhancement
 *
 * NOTE: Supabase doesn't natively support transactions in client libraries.
 * This utility provides two approaches:
 * 1. PostgreSQL function approach (recommended for critical operations)
 * 2. Manual rollback on error (best effort)
 */

import { createAdminClient } from './supabase-server';

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rollbackApplied?: boolean;
}

/**
 * Execute operations within a PostgreSQL transaction
 * This is the RECOMMENDED approach for critical financial operations
 *
 * Usage:
 * const result = await executeInTransaction('create_commission_with_overrides', {
 *   commission_data: {...},
 *   upline_ids: [...]
 * });
 */
export async function executeInTransaction<T = any>(
  functionName: string,
  params: Record<string, any>
): Promise<TransactionResult<T>> {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase.rpc(functionName, params as never);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

/**
 * Manual transaction simulation with rollback on error
 * This is a BEST-EFFORT approach when PostgreSQL functions aren't available
 *
 * WARNING: This doesn't provide true ACID guarantees but is better than nothing
 *
 * Usage:
 * const result = await withManualTransaction(async (ops) => {
 *   const commission = await ops.insert('commissions', {...});
 *   const overrides = await ops.insertMany('overrides', [...]);
 *   return { commission, overrides };
 * });
 */
export async function withManualTransaction<T>(
  operation: (ops: TransactionOperations) => Promise<T>
): Promise<TransactionResult<T>> {
  const supabase = createAdminClient();
  const recordedChanges: RollbackRecord[] = [];

  const ops: TransactionOperations = {
    async insert(table: string, data: any) {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data as never)
        .select()
        .single();

      if (error) throw new Error(`Insert failed on ${table}: ${error.message}`);

      // Record for potential rollback
      const typedResult = result as any;
      recordedChanges.push({
        operation: 'insert',
        table,
        id: typedResult.id,
        data: result,
      });

      return result;
    },

    async insertMany(table: string, data: any[]) {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data as never)
        .select();

      if (error) throw new Error(`Insert many failed on ${table}: ${error.message}`);

      // Record for potential rollback
      for (const record of result || []) {
        const typedRecord = record as any;
        recordedChanges.push({
          operation: 'insert',
          table,
          id: typedRecord.id,
          data: record,
        });
      }

      return result || [];
    },

    async update(table: string, id: string, data: any) {
      // Get current data for rollback
      const { data: current } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      const { data: result, error } = await supabase
        .from(table)
        .update(data as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Update failed on ${table}: ${error.message}`);

      // Record for potential rollback
      recordedChanges.push({
        operation: 'update',
        table,
        id,
        data: result,
        previousData: current,
      });

      return result;
    },

    async delete(table: string, id: string) {
      // Get current data for rollback
      const { data: current } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Delete failed on ${table}: ${error.message}`);

      // Record for potential rollback
      recordedChanges.push({
        operation: 'delete',
        table,
        id,
        previousData: current,
      });

      return true;
    },

    async rpc(functionName: string, params: any) {
      const { data, error } = await supabase.rpc(functionName, params as never);
      if (error) throw new Error(`RPC ${functionName} failed: ${error.message}`);
      return data;
    },
  };

  try {
    const result = await operation(ops);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    // Attempt rollback
    console.error('Transaction failed, attempting rollback:', error);
    const rollbackSuccess = await rollbackChanges(recordedChanges);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
      rollbackApplied: rollbackSuccess,
    };
  }
}

interface RollbackRecord {
  operation: 'insert' | 'update' | 'delete';
  table: string;
  id: string;
  data?: any;
  previousData?: any;
}

async function rollbackChanges(changes: RollbackRecord[]): Promise<boolean> {
  const supabase = createAdminClient();
  let allSuccess = true;

  // Rollback in reverse order
  for (let i = changes.length - 1; i >= 0; i--) {
    const change = changes[i];

    try {
      switch (change.operation) {
        case 'insert':
          // Delete the inserted record
          await supabase.from(change.table).delete().eq('id', change.id);
          break;

        case 'update':
          // Restore previous data
          if (change.previousData) {
            await supabase
              .from(change.table)
              .update(change.previousData as never)
              .eq('id', change.id);
          }
          break;

        case 'delete':
          // Re-insert deleted data
          if (change.previousData) {
            await supabase.from(change.table).insert(change.previousData as never);
          }
          break;
      }
    } catch (error) {
      console.error(`Rollback failed for ${change.table} ${change.id}:`, error);
      allSuccess = false;
    }
  }

  return allSuccess;
}

export interface TransactionOperations {
  insert<T = any>(table: string, data: any): Promise<T>;
  insertMany<T = any>(table: string, data: any[]): Promise<T[]>;
  update<T = any>(table: string, id: string, data: any): Promise<T>;
  delete(table: string, id: string): Promise<boolean>;
  rpc<T = any>(functionName: string, params: any): Promise<T>;
}

/**
 * Create a PostgreSQL function for a transactional workflow
 * This helper generates SQL for creating stored procedures
 */
export function generateTransactionFunction(
  functionName: string,
  operations: string[],
  returnType: string = 'JSONB'
): string {
  return `
CREATE OR REPLACE FUNCTION ${functionName}(
  -- Add parameters here
) RETURNS ${returnType} AS $$
DECLARE
  -- Declare variables here
BEGIN
  -- All operations within this function are automatically transactional
  ${operations.join('\n  ')}

  -- Return result
  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Automatic rollback on error
    RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
  `.trim();
}
