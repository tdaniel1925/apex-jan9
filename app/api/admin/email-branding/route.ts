/**
 * Email Branding Settings API
 * GET - Retrieve current email branding settings
 * PUT - Update email branding settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';

interface EmailBrandingSettings {
  id: string;
  header_logo_url: string;
  header_logo_width: number;
  footer_logo_url: string;
  footer_logo_width: number;
  updated_at: string;
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get branding settings (singleton table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settings, error } = await (supabase as any)
      .from('email_branding_settings')
      .select('*')
      .single() as { data: EmailBrandingSettings | null; error: Error | null };

    if (error) {
      // If no settings exist, create default
      if (error.message?.includes('No rows')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newSettings, error: insertError } = await (supabase as any)
          .from('email_branding_settings')
          .insert({
            header_logo_url: '/images/logo.png',
            header_logo_width: 200,
            footer_logo_url: '/images/logo-w.png',
            footer_logo_width: 150,
          })
          .select()
          .single() as { data: EmailBrandingSettings | null; error: Error | null };

        if (insertError) {
          console.error('Error creating branding settings:', insertError);
          return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
        }

        return NextResponse.json(newSettings);
      }

      console.error('Error fetching branding settings:', error);
      return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Email branding GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { header_logo_url, header_logo_width, footer_logo_url, footer_logo_width } = body;

    // Get existing settings to get ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('email_branding_settings')
      .select('id')
      .single() as { data: { id: string } | null };

    if (!existing) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    // Update settings
    const updateData: Partial<EmailBrandingSettings> = {};
    if (header_logo_url !== undefined) updateData.header_logo_url = header_logo_url;
    if (header_logo_width !== undefined) updateData.header_logo_width = header_logo_width;
    if (footer_logo_url !== undefined) updateData.footer_logo_url = footer_logo_url;
    if (footer_logo_width !== undefined) updateData.footer_logo_width = footer_logo_width;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase as any)
      .from('email_branding_settings')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single() as { data: EmailBrandingSettings | null; error: Error | null };

    if (error) {
      console.error('Error updating branding settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Email branding PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
