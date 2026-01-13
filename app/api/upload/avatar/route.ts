import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/db/supabase-server';
import type { Agent } from '@/lib/types/database';

// Constants for validation
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent with explicit typing
    const { data: agentData } = await supabase
      .from('agents')
      .select('id, agent_code')
      .eq('user_id', user.id)
      .single();

    if (!agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agentData as Pick<Agent, 'id' | 'agent_code'>;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!VALID_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, GIF, or WebP.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Use admin client for storage operations (bypasses RLS)
    const adminSupabase = createAdminClient();

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${agent.agent_code}/avatar_${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminSupabase
      .storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);

      // Check if bucket doesn't exist
      if (uploadError.message?.includes('Bucket not found')) {
        return NextResponse.json(
          { error: 'Storage not configured. Please create the "avatars" bucket in Supabase.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Upload failed. Please try again.' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = adminSupabase
      .storage
      .from('avatars')
      .getPublicUrl(uploadData.path);

    const avatarUrl = urlData.publicUrl;

    // Update agent's avatar_url in database
    const { error: updateError } = await adminSupabase
      .from('agents')
      .update({ avatar_url: avatarUrl } as never)
      .eq('id', agent.id);

    if (updateError) {
      console.error('Failed to update avatar URL:', updateError);
      return NextResponse.json(
        { error: 'Failed to save avatar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: avatarUrl,
      thumbnail: avatarUrl, // Supabase doesn't auto-generate thumbnails
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
