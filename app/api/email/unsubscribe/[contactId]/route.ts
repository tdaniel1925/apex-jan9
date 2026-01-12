/**
 * Email Unsubscribe Endpoint
 * Handles unsubscribe requests from email links
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';
import { cancelPendingEmails } from '@/lib/email/email-queue-processor';

// Type for contact query result
interface ContactResult {
  id: string;
  email: string;
  first_name: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params;

  try {
    const supabase = createAdminClient();

    // Verify the contact exists
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, email, first_name')
      .eq('id', contactId)
      .single() as unknown as { data: ContactResult | null; error: unknown };

    if (contactError || !contact) {
      // Return a friendly page even if contact not found
      return new NextResponse(
        getUnsubscribePage({ success: false, message: 'Contact not found' }),
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Cancel all pending emails for this contact
    const { cancelled } = await cancelPendingEmails(contactId);

    // Update contact to mark as unsubscribed
    await (supabase.from('contacts') as unknown as ReturnType<typeof supabase.from>).update({
      email_sequence_id: null,
    }).eq('id', contactId);

    // Return success page
    return new NextResponse(
      getUnsubscribePage({
        success: true,
        message: `You have been unsubscribed. ${cancelled} pending email(s) cancelled.`,
        email: contact.email,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new NextResponse(
      getUnsubscribePage({
        success: false,
        message: 'An error occurred. Please try again later.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

function getUnsubscribePage(options: {
  success: boolean;
  message: string;
  email?: string;
}): string {
  const { success, message, email } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe - Apex Affinity Group</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      background: ${success ? '#10b981' : '#ef4444'};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg {
      width: 32px;
      height: 32px;
      color: white;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .email {
      color: #374151;
      font-weight: 600;
    }
    .button {
      display: inline-block;
      background: #0ea5e9;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s;
    }
    .button:hover {
      background: #0284c7;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      ${
        success
          ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>'
      }
    </div>
    <h1>${success ? 'Unsubscribed Successfully' : 'Unsubscribe Failed'}</h1>
    <p>${message}${email ? ` <span class="email">${email}</span>` : ''}</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net'}" class="button">
      Return to Website
    </a>
    <div class="footer">
      Apex Affinity Group | Building Financial Futures
    </div>
  </div>
</body>
</html>
  `.trim();
}
