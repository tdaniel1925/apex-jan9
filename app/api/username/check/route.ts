/**
 * Username Availability Check API
 * GET /api/username/check?username=jsmith
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { validateUsername, normalizeUsername } from '@/lib/utils/username';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate format first
    const validation = validateUsername(username);

    if (!validation.valid) {
      return NextResponse.json({
        available: false,
        error: validation.error,
      });
    }

    const normalized = normalizeUsername(username);

    // Check database for existing username
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('agents')
      .select('id')
      .eq('username', normalized)
      .maybeSingle();

    if (error) {
      console.error('Error checking username:', error);
      return NextResponse.json(
        { error: 'Failed to check username availability' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      available: !data,
      normalized,
    });
  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
