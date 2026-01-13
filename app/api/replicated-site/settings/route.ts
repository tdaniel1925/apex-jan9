import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { z } from 'zod';
import { ApiErrors, apiSuccess, handleZodError } from '@/lib/api/response';

// Type for agent replicated site settings
interface AgentSiteSettings {
  id: string;
  agent_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  site_headline: string | null;
  site_cta_text: string | null;
  site_primary_color: string | null;
  show_phone: boolean;
  show_email: boolean;
  replicated_site_enabled: boolean;
  social_facebook: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_youtube: string | null;
  social_tiktok: string | null;
}

// Validation schema for updating settings
const updateSettingsSchema = z.object({
  bio: z.string().max(500).optional().nullable(),
  site_headline: z.string().max(150).optional().nullable(),
  site_cta_text: z.string().max(50).optional().nullable(),
  site_primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  show_phone: z.boolean().optional(),
  show_email: z.boolean().optional(),
  replicated_site_enabled: z.boolean().optional(),
  social_facebook: z.string().url().or(z.literal('')).optional().nullable(),
  social_instagram: z.string().url().or(z.literal('')).optional().nullable(),
  social_linkedin: z.string().url().or(z.literal('')).optional().nullable(),
  social_youtube: z.string().url().or(z.literal('')).optional().nullable(),
  social_tiktok: z.string().url().or(z.literal('')).optional().nullable(),
});

// GET - Get current agent's replicated site settings
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiErrors.unauthorized();
    }

    // Get agent with replicated site fields - cast to any to bypass typed table restrictions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agent, error } = await (supabase as any)
      .from('agents')
      .select(`
        id,
        agent_code,
        first_name,
        last_name,
        email,
        phone,
        avatar_url,
        bio,
        site_headline,
        site_cta_text,
        site_primary_color,
        show_phone,
        show_email,
        replicated_site_enabled,
        social_facebook,
        social_instagram,
        social_linkedin,
        social_youtube,
        social_tiktok
      `)
      .eq('user_id', user.id)
      .single() as { data: AgentSiteSettings | null; error: unknown };

    if (error || !agent) {
      return ApiErrors.notFound('Agent');
    }

    // Generate the replicated site URL
    const siteUrl = `/join/${agent.agent_code}`;

    return apiSuccess({
      ...agent,
      site_url: siteUrl,
    });
  } catch (error) {
    console.error('Failed to get replicated site settings:', error);
    return ApiErrors.internal();
  }
}

// PUT - Update replicated site settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiErrors.unauthorized();
    }

    const body = await request.json();
    const validation = updateSettingsSchema.safeParse(body);

    if (!validation.success) {
      return handleZodError(validation.error);
    }

    const updates = validation.data;

    // Clean up empty strings to null for URL fields
    const cleanUpdates = {
      ...updates,
      social_facebook: updates.social_facebook === '' ? null : updates.social_facebook,
      social_instagram: updates.social_instagram === '' ? null : updates.social_instagram,
      social_linkedin: updates.social_linkedin === '' ? null : updates.social_linkedin,
      social_youtube: updates.social_youtube === '' ? null : updates.social_youtube,
      social_tiktok: updates.social_tiktok === '' ? null : updates.social_tiktok,
    };

    // Update agent - cast to any to bypass typed table restrictions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedAgent, error } = await (supabase as any)
      .from('agents')
      .update(cleanUpdates)
      .eq('user_id', user.id)
      .select(`
        id,
        agent_code,
        first_name,
        last_name,
        email,
        phone,
        avatar_url,
        bio,
        site_headline,
        site_cta_text,
        site_primary_color,
        show_phone,
        show_email,
        replicated_site_enabled,
        social_facebook,
        social_instagram,
        social_linkedin,
        social_youtube,
        social_tiktok
      `)
      .single() as { data: AgentSiteSettings | null; error: unknown };

    if (error || !updatedAgent) {
      console.error('Failed to update settings:', error);
      return ApiErrors.internal('Failed to update settings');
    }

    const siteUrl = `/join/${updatedAgent.agent_code}`;

    return apiSuccess({
      ...updatedAgent,
      site_url: siteUrl,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Failed to update replicated site settings:', error);
    return ApiErrors.internal();
  }
}
