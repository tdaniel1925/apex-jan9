/**
 * Contact Form API Route
 * Handles contact form submissions from the marketing site
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(10),
});

// Subject line mapping
const subjectMap: Record<string, string> = {
  join: 'Interested in Joining Apex',
  products: 'Product Information Request',
  support: 'Agent Support Request',
  partnership: 'Business Partnership Inquiry',
  other: 'General Inquiry',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, message } = validationResult.data;
    const subjectLine = subjectMap[subject] || 'Contact Form Submission';

    // Send notification email to Apex team
    const { error: sendError } = await resend.emails.send({
      from: 'Apex Contact Form <noreply@apexaffinity.com>',
      to: process.env.CONTACT_EMAIL || 'info@apexaffinity.com',
      replyTo: email,
      subject: `[Contact Form] ${subjectLine} - ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Subject:</strong> ${subjectLine}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
        <hr />
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br />')}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          This message was sent from the Apex Affinity Group contact form.
        </p>
      `,
    });

    if (sendError) {
      console.error('Error sending contact form email:', sendError);
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }

    // Send auto-reply to the sender
    await resend.emails.send({
      from: 'Apex Affinity Group <noreply@apexaffinity.com>',
      to: email,
      subject: 'Thank you for contacting Apex Affinity Group',
      html: `
        <h2>Thank You for Reaching Out!</h2>
        <p>Hi ${name},</p>
        <p>We've received your message and will get back to you within 24 business hours.</p>
        <p>Here's a copy of your message:</p>
        <blockquote style="border-left: 3px solid #0ea5e9; padding-left: 16px; margin: 16px 0; color: #666;">
          ${message.replace(/\n/g, '<br />')}
        </blockquote>
        <p>In the meantime, feel free to explore:</p>
        <ul>
          <li><a href="https://apexaffinity.com/opportunity">Our Career Opportunity</a></li>
          <li><a href="https://apexaffinity.com/carriers">Our Carrier Partners</a></li>
          <li><a href="https://apexaffinity.com/faq">Frequently Asked Questions</a></li>
        </ul>
        <p>Best regards,<br />The Apex Affinity Group Team</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          Apex Affinity Group | Dallas, Texas<br />
          <a href="https://apexaffinity.com">apexaffinity.com</a>
        </p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
