/**
 * Admin Commissions Import API
 * POST - Bulk import commissions from CSV data
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { onCommissionCreated } from '@/lib/workflows/on-commission-created';
import type { Commission, Agent } from '@/lib/types/database';

// Schema for a single commission row
const commissionRowSchema = z.object({
  agent_id: z.string().uuid(),
  carrier: z.string().min(1),
  policy_number: z.string().min(1),
  premium_amount: z.coerce.number().positive(),
  commission_rate: z.coerce.number().min(0).max(1),
  commission_amount: z.coerce.number().positive(),
  policy_date: z.string(),
});

// Schema for import request
const importSchema = z.object({
  commissions: z.array(commissionRowSchema).min(1).max(1000),
  trigger_workflows: z.boolean().default(true),
});

interface ImportResult {
  success: boolean;
  row: number;
  agent_id: string;
  policy_number: string;
  commission_id?: string;
  error?: string;
  workflow_result?: {
    rankChanged: boolean;
    overridesCreated: number;
    fastStartBonusAwarded: boolean;
  };
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = importSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const { commissions, trigger_workflows } = parseResult.data;
    const results: ImportResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Get all agents for lookup by ID
    const agentIds = [...new Set(commissions.map(c => c.agent_id))];
    const { data: agentsData, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .in('id', agentIds);

    if (agentsError) {
      console.error('Agents fetch error:', agentsError);
      return serverErrorResponse('Failed to load agents');
    }

    const agents = (agentsData || []) as Agent[];
    const agentsById = new Map(agents.map(a => [a.id, a]));

    // Process each commission
    for (let i = 0; i < commissions.length; i++) {
      const row = commissions[i];
      const rowNum = i + 1;

      try {
        // Look up agent by ID
        const agent = agentsById.get(row.agent_id);

        if (!agent) {
          results.push({
            success: false,
            row: rowNum,
            agent_id: row.agent_id,
            policy_number: row.policy_number,
            error: `Agent not found with ID: ${row.agent_id}`,
          });
          errorCount++;
          continue;
        }

        // Check for duplicate policy number
        const { data: existingData } = await supabase
          .from('commissions')
          .select('id')
          .eq('policy_number', row.policy_number)
          .eq('agent_id', agent.id)
          .single();

        if (existingData) {
          results.push({
            success: false,
            row: rowNum,
            agent_id: row.agent_id,
            policy_number: row.policy_number,
            error: 'Duplicate policy number for this agent',
          });
          errorCount++;
          continue;
        }

        // Create commission
        const commissionData = {
          agent_id: agent.id,
          carrier: row.carrier,
          policy_number: row.policy_number,
          premium_amount: row.premium_amount,
          commission_rate: row.commission_rate,
          commission_amount: row.commission_amount,
          policy_date: row.policy_date,
          status: 'pending' as const,
        };

        const { data: commission, error: createError } = await supabase
          .from('commissions')
          .insert(commissionData as never)
          .select()
          .single();

        if (createError) {
          results.push({
            success: false,
            row: rowNum,
            agent_id: row.agent_id,
            policy_number: row.policy_number,
            error: createError.message,
          });
          errorCount++;
          continue;
        }

        // Trigger workflow if enabled
        let workflowResult = undefined;
        if (trigger_workflows) {
          const result = await onCommissionCreated({
            commission: commission as Commission,
            agent,
          });
          workflowResult = {
            rankChanged: result.rankChanged,
            overridesCreated: result.overridesCreated,
            fastStartBonusAwarded: result.fastStartBonusAwarded,
          };
        }

        results.push({
          success: true,
          row: rowNum,
          agent_id: row.agent_id,
          policy_number: row.policy_number,
          commission_id: (commission as Commission).id,
          workflow_result: workflowResult,
        });
        successCount++;
      } catch (error) {
        results.push({
          success: false,
          row: rowNum,
          agent_id: row.agent_id,
          policy_number: row.policy_number,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      summary: {
        total: commissions.length,
        success: successCount,
        errors: errorCount,
      },
      results,
    });
  } catch (error) {
    console.error('Admin commissions import error:', error);
    return serverErrorResponse();
  }
}
