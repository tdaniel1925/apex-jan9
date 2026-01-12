/**
 * Email Queue Processor API Route
 * Called by cron job to process pending emails
 *
 * Security: Protected by CRON_SECRET header
 */

import { NextRequest, NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/email/email-queue-processor';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get batch size from query params (default 50)
    const { searchParams } = new URL(request.url);
    const batchSize = parseInt(searchParams.get('batch') || '50', 10);

    // Process the queue
    const result = await processEmailQueue(batchSize);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Email queue processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}
