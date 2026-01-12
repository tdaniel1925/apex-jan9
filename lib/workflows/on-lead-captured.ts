/**
 * Lead Capture Workflow
 * Triggered when a new lead is captured through an agent's replicated site
 *
 * This workflow:
 * 1. Creates a contact record
 * 2. Records the capture activity
 * 3. Enrolls the lead in the nurturing sequence
 */

import { createAdminClient } from '@/lib/db/supabase-server';
import { enqueueSequenceEmails } from '@/lib/email/email-queue-processor';

// Type for contact query/insert results
interface ContactIdResult {
  id: string;
}

interface ContactWithSequenceResult {
  id: string;
  email_sequence_id: string | null;
}

export interface LeadCaptureData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  agentId: string;
  source?: string; // e.g., 'replicated_site', 'landing_page', 'referral'
  metadata?: Record<string, unknown>;
}

export interface LeadCaptureResult {
  success: boolean;
  contactId?: string;
  emailsQueued?: number;
  error?: string;
}

/**
 * Default lead nurturing sequence ID (from migration seed)
 */
const DEFAULT_NURTURING_SEQUENCE_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Handle a new lead capture
 * Creates contact, records activity, and starts nurturing sequence
 */
export async function onLeadCaptured(data: LeadCaptureData): Promise<LeadCaptureResult> {
  const supabase = createAdminClient();

  try {
    // Check if contact already exists for this agent
    const { data: existingContact, error: checkError } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', data.email)
      .eq('agent_id', data.agentId)
      .single() as unknown as { data: ContactIdResult | null; error: { code?: string } | null };

    if (checkError && checkError.code !== 'PGRST116') {
      // Error other than "not found"
      throw checkError;
    }

    // If contact exists, just update and return
    if (existingContact) {
      console.log('Contact already exists:', existingContact.id);
      return {
        success: true,
        contactId: existingContact.id,
        emailsQueued: 0,
      };
    }

    // Create new contact
    const { data: newContact, error: createError } = await (supabase
      .from('contacts') as unknown as ReturnType<typeof supabase.from>)
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || null,
        agent_id: data.agentId,
        type: 'lead',
        pipeline_stage: 'new',
        lead_score: 0,
        source: data.source || 'replicated_site',
      })
      .select('id')
      .single() as unknown as { data: ContactIdResult | null; error: unknown };

    if (createError) throw createError;
    if (!newContact) throw new Error('Failed to create contact');

    console.log('New contact created:', newContact.id);

    // Record the form submission activity
    await (supabase.from('lead_activities' as 'agents') as unknown as ReturnType<typeof supabase.from>).insert({
      contact_id: newContact.id,
      activity_type: 'form_submit',
      metadata: {
        source: data.source || 'replicated_site',
        ...data.metadata,
      },
    });

    // Enqueue the nurturing sequence
    const sequenceResult = await enqueueSequenceEmails(
      newContact.id,
      DEFAULT_NURTURING_SEQUENCE_ID
    );

    if (!sequenceResult.success) {
      console.error('Failed to enqueue sequence emails:', sequenceResult.error);
      // Don't fail the whole operation, contact was still created
    }

    return {
      success: true,
      contactId: newContact.id,
      emailsQueued: sequenceResult.queued,
    };
  } catch (error) {
    console.error('Error in lead capture workflow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Manually start a sequence for an existing contact
 */
export async function startSequenceForContact(
  contactId: string,
  sequenceId: string = DEFAULT_NURTURING_SEQUENCE_ID
): Promise<{ success: boolean; queued: number; error?: string }> {
  const supabase = createAdminClient();

  try {
    // Verify contact exists
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, email_sequence_id')
      .eq('id', contactId)
      .single() as unknown as { data: ContactWithSequenceResult | null; error: unknown };

    if (contactError || !contact) {
      return { success: false, queued: 0, error: 'Contact not found' };
    }

    // Check if already in a sequence
    if (contact.email_sequence_id) {
      return {
        success: false,
        queued: 0,
        error: 'Contact is already in an email sequence',
      };
    }

    // Start the sequence
    return enqueueSequenceEmails(contactId, sequenceId);
  } catch (error) {
    console.error('Error starting sequence:', error);
    return {
      success: false,
      queued: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get the default nurturing sequence info
 */
export async function getDefaultSequence() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('email_sequences')
    .select(`
      *,
      email_sequence_steps (
        id,
        step_number,
        subject,
        delay_days,
        delay_hours
      )
    `)
    .eq('id', DEFAULT_NURTURING_SEQUENCE_ID)
    .single();

  if (error) {
    console.error('Error fetching default sequence:', error);
    return null;
  }

  return data;
}
