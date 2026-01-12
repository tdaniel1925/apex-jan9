/**
 * Email Click Tracking Endpoint
 * Records the click and redirects to the original URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';

// Type for queue item query result
interface QueueItemResult {
  contact_id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ queueId: string }> }
) {
  const { queueId } = await params;
  const { searchParams } = new URL(request.url);
  const encodedUrl = searchParams.get('url');

  // Decode the original URL
  const originalUrl = encodedUrl
    ? decodeURIComponent(encodedUrl)
    : process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net';

  // Record the click asynchronously (don't wait)
  recordEmailClick(queueId, originalUrl).catch((err) => {
    console.error('Error recording email click:', err);
  });

  // Redirect to the original URL
  return NextResponse.redirect(originalUrl, { status: 302 });
}

async function recordEmailClick(queueId: string, url: string): Promise<void> {
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

    // Record the click activity
    await (supabase.from('lead_activities' as 'agents') as unknown as ReturnType<typeof supabase.from>).insert({
      contact_id: queueItem.contact_id,
      activity_type: 'email_click',
      metadata: {
        queue_id: queueId,
        clicked_url: url,
        clicked_at: new Date().toISOString(),
      },
    });

    console.log('Email click recorded:', {
      queueId,
      contactId: queueItem.contact_id,
      url,
    });
  } catch (error) {
    console.error('Error recording email click:', error);
  }
}
