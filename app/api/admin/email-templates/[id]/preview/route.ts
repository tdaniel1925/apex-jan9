/**
 * Email Template Preview API
 * POST - Generate preview with sample data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth/admin-auth';

// Type definitions for email templates (tables not yet in generated types)
interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  subject: string;
  preview_text: string | null;
  html_content: string;
  text_content: string | null;
  variables: string[];
  is_active: boolean;
  is_system: boolean;
  for_replicated_site: boolean;
  created_at: string;
  updated_at: string;
}

// Sample data for preview
const SAMPLE_DATA: Record<string, string> = {
  first_name: 'John',
  last_name: 'Smith',
  email: 'john.smith@example.com',
  agent_code: 'APX123456',
  sponsor_name: 'Jane Doe',
  dashboard_url: 'https://app.theapexway.net/dashboard',
  logo_url: 'https://app.theapexway.net/images/logo.png',
  current_year: new Date().getFullYear().toString(),
  amount: '$1,250.00',
  policy_number: 'POL-2024-001234',
  carrier: 'Columbus Life',
  premium: '$5,000.00',
  payment_date: new Date().toLocaleDateString('en-US'),
  new_rank: 'Senior Associate',
  previous_rank: 'Associate',
  reset_url: 'https://app.theapexway.net/reset-password?token=abc123',
  lead_name: 'Robert Johnson',
  lead_email: 'robert.johnson@example.com',
  lead_phone: '(555) 123-4567',
  lead_interest: 'Life Insurance',
};

function replaceVariables(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get template
    const { data: templateData, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !templateData) {
      return notFoundResponse('Template not found');
    }

    const template = templateData as EmailTemplate;

    // Get custom data from request body (optional)
    let customData = {};
    try {
      const body = await request.json();
      customData = body.variables || {};
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Merge sample data with custom data
    const mergedData = { ...SAMPLE_DATA, ...customData };

    // Generate preview
    const preview = {
      subject: replaceVariables(template.subject, mergedData),
      html: replaceVariables(template.html_content, mergedData),
      text: template.text_content ? replaceVariables(template.text_content, mergedData) : null,
    };

    return NextResponse.json({
      preview,
      variables: template.variables,
      sampleData: SAMPLE_DATA,
    });
  } catch (error) {
    console.error('Email template preview error:', error);
    return serverErrorResponse();
  }
}
