/**
 * Lead Capture API Route
 * Handles new lead submissions from agent replicated sites
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { onLeadCaptured } from '@/lib/workflows/on-lead-captured';
import { createAdminClient } from '@/lib/db/supabase-server';

// Type for agent query result
interface AgentIdResult {
  id: string;
}

// Input validation schema
const leadCaptureSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().optional(),
  agentCode: z.string().min(1, 'Agent code is required'),
  source: z.string().optional().default('contact_form'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = leadCaptureSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, message, agentCode, source } =
      validationResult.data;

    // Look up the agent by their code
    const supabase = createAdminClient();
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('agent_code', agentCode)
      .single() as unknown as { data: AgentIdResult | null; error: unknown };

    if (agentError || !agent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agent not found',
        },
        { status: 404 }
      );
    }

    // Execute the lead capture workflow
    const result = await onLeadCaptured({
      firstName,
      lastName,
      email,
      phone,
      agentId: agent.id,
      source,
      metadata: {
        message,
        agentCode,
        capturedAt: new Date().toISOString(),
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to capture lead',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contactId: result.contactId,
      emailsQueued: result.emailsQueued,
      message: 'Lead captured successfully',
    });
  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
