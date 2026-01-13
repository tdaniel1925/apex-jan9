/**
 * Admin Bulk Operations API
 * POST - Perform bulk operations on agents/commissions/payouts
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUntypedAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';

// Bulk operation schema
const bulkOperationSchema = z.object({
  operation: z.enum([
    'agents_status_change',
    'agents_rank_change',
    'agents_delete',
    'commissions_approve',
    'commissions_reject',
    'payouts_process',
    'payouts_complete',
  ]),
  ids: z.array(z.string().uuid()).min(1).max(100),
  data: z.record(z.string(), z.any()).optional(),
});

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const body = await request.json();
    const parseResult = bulkOperationSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Invalid request', parseResult.error.flatten());
    }

    const { operation, ids, data } = parseResult.data;
    const supabase = createUntypedAdminClient();

    let result: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    switch (operation) {
      case 'agents_status_change': {
        const newStatus = data?.status as string;
        if (!['active', 'inactive', 'pending', 'suspended'].includes(newStatus)) {
          return badRequestResponse('Invalid status value');
        }

        const { data: updated, error } = await supabase
          .from('agents')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .in('id', ids)
          .select('id');

        if (error) {
          result.errors.push(error.message);
        } else {
          result.success = updated?.length || 0;
          result.failed = ids.length - result.success;
        }
        break;
      }

      case 'agents_rank_change': {
        const newRank = data?.rank as string;
        const validRanks = [
          'pre_associate', 'associate', 'senior_associate',
          'team_leader', 'senior_team_leader', 'executive_team_leader',
          'mga', 'senior_mga', 'executive_mga',
          'national_director', 'senior_national_director', 'executive_national_director',
          'national_vice_president', 'senior_vice_president', 'executive_vice_president'
        ];

        if (!validRanks.includes(newRank)) {
          return badRequestResponse('Invalid rank value');
        }

        const { data: updated, error } = await supabase
          .from('agents')
          .update({ rank: newRank, updated_at: new Date().toISOString() })
          .in('id', ids)
          .select('id');

        if (error) {
          result.errors.push(error.message);
        } else {
          result.success = updated?.length || 0;
          result.failed = ids.length - result.success;
        }
        break;
      }

      case 'agents_delete': {
        // Soft delete by setting status to 'deleted'
        const { data: updated, error } = await supabase
          .from('agents')
          .update({ status: 'deleted', updated_at: new Date().toISOString() })
          .in('id', ids)
          .select('id');

        if (error) {
          result.errors.push(error.message);
        } else {
          result.success = updated?.length || 0;
          result.failed = ids.length - result.success;
        }
        break;
      }

      case 'commissions_approve': {
        const { data: updated, error } = await supabase
          .from('commissions')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .in('id', ids)
          .eq('status', 'pending')
          .select('id');

        if (error) {
          result.errors.push(error.message);
        } else {
          result.success = updated?.length || 0;
          result.failed = ids.length - result.success;
        }
        break;
      }

      case 'commissions_reject': {
        const reason = data?.reason || 'Rejected by admin';
        const { data: updated, error } = await supabase
          .from('commissions')
          .update({
            status: 'rejected',
            notes: reason,
            updated_at: new Date().toISOString()
          })
          .in('id', ids)
          .select('id');

        if (error) {
          result.errors.push(error.message);
        } else {
          result.success = updated?.length || 0;
          result.failed = ids.length - result.success;
        }
        break;
      }

      case 'payouts_process': {
        const { data: updated, error } = await supabase
          .from('payouts')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .in('id', ids)
          .eq('status', 'pending')
          .select('id');

        if (error) {
          result.errors.push(error.message);
        } else {
          result.success = updated?.length || 0;
          result.failed = ids.length - result.success;
        }
        break;
      }

      case 'payouts_complete': {
        const { data: updated, error } = await supabase
          .from('payouts')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .in('id', ids)
          .in('status', ['pending', 'processing'])
          .select('id');

        if (error) {
          result.errors.push(error.message);
        } else {
          result.success = updated?.length || 0;
          result.failed = ids.length - result.success;
        }
        break;
      }

      default:
        return badRequestResponse('Unknown operation');
    }

    // Log the bulk operation
    await supabase.from('audit_logs').insert({
      admin_id: admin.agentId,
      action: `bulk_${operation}`,
      entity_type: operation.split('_')[0],
      details: {
        operation,
        ids_count: ids.length,
        success_count: result.success,
        failed_count: result.failed,
        data,
      },
    });

    return NextResponse.json({
      operation,
      ...result,
      message: `Bulk ${operation}: ${result.success} succeeded, ${result.failed} failed`,
    });
  } catch (error) {
    console.error('Admin bulk operation error:', error);
    return serverErrorResponse();
  }
}
