/**
 * Email Open Tracking Endpoint
 * Returns a 1x1 transparent pixel and records the open
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';

// Type for queue item query result
interface QueueItemResult {
  contact_id: string;
}

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ queueId: string }> }
) {
  const { queueId } = await params;

  // Record the open asynchronously (don't wait)
  recordEmailOpen(queueId).catch((err) => {
    console.error('Error recording email open:', err);
  });

  // Return tracking pixel immediately
  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

async function recordEmailOpen(queueId: string): Promise<void> {
  const supabase = createAdminClient();

  try {
    // Get the queue item to find the contact
    const { data: queueItem, error: queueError } = await supabase
      .from('lead_email_queue' as 'agents') // Type assertion for new table
      .select('contact_id')
      .eq('id', queueId)
      .single() as unknown as { data: QueueItemResult | null; error: unknown };

    if (queueError || !queueItem) {
      console.error('Queue item not found:', queueId);
      return;
    }

    // Record the open activity
    await (supabase.from('lead_activities' as 'agents') as unknown as ReturnType<typeof supabase.from>).insert({
      contact_id: queueItem.contact_id,
      activity_type: 'email_open',
      metadata: {
        queue_id: queueId,
        opened_at: new Date().toISOString(),
      },
    });

    console.log('Email open recorded:', { queueId, contactId: queueItem.contact_id });
  } catch (error) {
    console.error('Error recording email open:', error);
  }
}
