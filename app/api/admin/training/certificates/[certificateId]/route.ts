/**
 * Admin Training Certificate API
 * GET - Get single certificate details
 * DELETE - Revoke/delete a certificate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { Certificate } from '@/lib/types/training';

interface CertificateWithRelations extends Certificate {
  agent: { id: string; first_name: string; last_name: string; email: string; agent_code: string } | null;
  course: { id: string; title: string } | null;
  track: { id: string; title: string } | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { certificateId } = await params;
    const supabase = createAdminClient();

    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        *,
        agent:agents(id, first_name, last_name, email, agent_code),
        course:courses(id, title),
        track:training_tracks(id, title)
      `)
      .eq('id', certificateId)
      .single() as unknown as { data: CertificateWithRelations | null; error: unknown };

    if (error || !certificate) {
      return notFoundResponse('Certificate not found');
    }

    return NextResponse.json({ certificate });
  } catch (error) {
    console.error('Admin certificate GET error:', error);
    return serverErrorResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { certificateId } = await params;
    const supabase = createAdminClient();

    // Check if certificate exists
    const { data: existing } = await supabase
      .from('certificates')
      .select('id')
      .eq('id', certificateId)
      .single() as unknown as { data: { id: string } | null };

    if (!existing) {
      return notFoundResponse('Certificate not found');
    }

    // Delete the certificate
    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', certificateId);

    if (error) {
      console.error('Certificate delete error:', error);
      return serverErrorResponse();
    }

    return NextResponse.json({ success: true, message: 'Certificate revoked' });
  } catch (error) {
    console.error('Admin certificate DELETE error:', error);
    return serverErrorResponse();
  }
}
