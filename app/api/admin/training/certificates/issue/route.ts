/**
 * Admin Issue Certificate API
 * POST - Manually issue a certificate to an agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { issueCertificate } from '@/lib/services/training-service';

// Issue certificate schema
const issueCertificateSchema = z.object({
  agent_id: z.string().uuid(),
  course_id: z.string().uuid().optional(),
  track_id: z.string().uuid().optional(),
  custom_title: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = issueCertificateSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const { agent_id, course_id, track_id, custom_title } = parseResult.data;

    // Verify agent exists
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agent_id)
      .single() as unknown as { data: { id: string } | null };

    if (!agent) {
      return badRequestResponse('Agent not found');
    }

    // Must provide either course_id or track_id
    if (!course_id && !track_id) {
      return badRequestResponse('Must provide either course_id or track_id');
    }

    // Check if certificate already exists
    let existingQuery = supabase
      .from('certificates')
      .select('id')
      .eq('agent_id', agent_id);

    if (course_id) {
      existingQuery = existingQuery.eq('course_id', course_id);
    }
    if (track_id) {
      existingQuery = existingQuery.eq('track_id', track_id);
    }

    const { data: existing } = await existingQuery.single() as unknown as { data: { id: string } | null };

    if (existing) {
      return badRequestResponse('Certificate already issued for this course/track');
    }

    // Issue certificate
    const certificate = await issueCertificate(
      agent_id,
      course_id || null,
      null, // No quiz attempt for manual issuance
      track_id || null
    );

    // Update with custom title if provided
    if (custom_title) {
      await supabase
        .from('certificates')
        .update({ title: custom_title } as never)
        .eq('id', certificate.id);
      certificate.title = custom_title;
    }

    return NextResponse.json({ certificate }, { status: 201 });
  } catch (error) {
    console.error('Admin certificate issue error:', error);
    return serverErrorResponse();
  }
}
