/**
 * Send Test Email API
 * POST - Send a test email using the template
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth/admin-auth';

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

const sendTestSchema = z.object({
  recipient_email: z.string().email('Valid email required'),
  variables: z.record(z.string(), z.string()).optional(),
});

// Sample data for test emails
const SAMPLE_DATA: Record<string, string> = {
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  agent_code: 'APX000000',
  sponsor_name: 'Demo Sponsor',
  dashboard_url: process.env.NEXT_PUBLIC_APP_URL || 'https://app.apexaffinity.com',
  logo_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.apexaffinity.com'}/images/logo.png`,
  current_year: new Date().getFullYear().toString(),
  amount: '$1,000.00',
  policy_number: 'TEST-001',
  carrier: 'Test Carrier',
  premium: '$5,000.00',
  payment_date: new Date().toLocaleDateString('en-US'),
  new_rank: 'Senior Associate',
  previous_rank: 'Associate',
  reset_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.apexaffinity.com'}/reset-password?token=test`,
  lead_name: 'Test Lead',
  lead_email: 'lead@example.com',
  lead_phone: '(555) 000-0000',
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
    const body = await request.json();
    const parseResult = sendTestSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const { recipient_email, variables } = parseResult.data;

    // Get template
    const { data: templateData, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !templateData) {
      return notFoundResponse('Template not found');
    }

    const template = templateData as unknown as EmailTemplate;

    // Merge sample data with custom variables (ensure all values are strings)
    const customVars: Record<string, string> = {};
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        if (typeof value === 'string') {
          customVars[key] = value;
        }
      }
    }
    const mergedData: Record<string, string> = { ...SAMPLE_DATA, ...customVars };

    // Generate email content
    const subject = `[TEST] ${replaceVariables(template.subject, mergedData)}`;
    const htmlContent = replaceVariables(template.html_content, mergedData);
    const textContent = template.text_content
      ? replaceVariables(template.text_content, mergedData)
      : null;

    // Try to send email using Resend if configured
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'Apex Affinity Group <noreply@apexaffinity.com>',
            to: [recipient_email],
            subject,
            html: htmlContent,
            text: textContent,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Resend API error:', errorData);

          // Log the attempt
          await (supabase.from('email_send_logs') as unknown as {
            insert: (data: Record<string, unknown>) => Promise<unknown>;
          }).insert({
            template_id: id,
            template_slug: template.slug,
            recipient_email,
            subject,
            status: 'failed',
            error_message: JSON.stringify(errorData),
            metadata: { test: true, admin_id: admin.agentId },
          });

          return NextResponse.json({
            success: false,
            message: 'Failed to send test email',
            error: errorData,
          }, { status: 500 });
        }

        const result = await response.json();

        // Log successful send
        await (supabase.from('email_send_logs') as unknown as {
          insert: (data: Record<string, unknown>) => Promise<unknown>;
        }).insert({
          template_id: id,
          template_slug: template.slug,
          recipient_email,
          subject,
          status: 'sent',
          metadata: { test: true, admin_id: admin.agentId, resend_id: result.id },
        });

        return NextResponse.json({
          success: true,
          message: `Test email sent to ${recipient_email}`,
          email_id: result.id,
        });
      } catch (sendError) {
        console.error('Email send error:', sendError);

        return NextResponse.json({
          success: false,
          message: 'Email service error',
          preview: {
            subject,
            html: htmlContent,
            text: textContent,
          },
        }, { status: 500 });
      }
    } else {
      // No email service configured, return preview
      return NextResponse.json({
        success: false,
        message: 'Email service not configured. Preview generated instead.',
        preview: {
          subject,
          html: htmlContent,
          text: textContent,
          recipient: recipient_email,
        },
      });
    }
  } catch (error) {
    console.error('Send test email error:', error);
    return serverErrorResponse();
  }
}
