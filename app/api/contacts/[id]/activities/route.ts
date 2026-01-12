/**
 * Lead Activities API
 * Fetches activity history for a specific contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';

// Types for activity results
interface LeadActivityRow {
  id: string;
  contact_id: string;
  activity_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface EmailQueueRow {
  id: string;
  status: string;
  scheduled_for: string;
  sent_at: string | null;
  email_sequence_steps: {
    subject: string;
    step_number: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contactId } = await params;

  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Verify contact belongs to this agent
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, agent_id, lead_score, email_sequence_id, email_sequence_started_at')
      .eq('id', contactId)
      .single() as unknown as {
        data: {
          id: string;
          agent_id: string;
          lead_score: number;
          email_sequence_id: string | null;
          email_sequence_started_at: string | null;
        } | null;
        error: unknown;
      };

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (contact.agent_id !== (agentData as { id: string }).id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch activities
    const { data: activities, error: activitiesError } = await supabase
      .from('lead_activities' as 'agents')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(50) as unknown as { data: LeadActivityRow[] | null; error: unknown };

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      throw activitiesError;
    }

    // Fetch email queue items for this contact
    const { data: emailQueue, error: queueError } = await supabase
      .from('lead_email_queue' as 'agents')
      .select(`
        id,
        status,
        scheduled_for,
        sent_at,
        email_sequence_steps (
          subject,
          step_number
        )
      `)
      .eq('contact_id', contactId)
      .order('scheduled_for', { ascending: true }) as unknown as { data: EmailQueueRow[] | null; error: unknown };

    if (queueError) {
      console.error('Error fetching email queue:', queueError);
    }

    // Calculate engagement stats
    const opens = activities?.filter(a => a.activity_type === 'email_open').length || 0;
    const clicks = activities?.filter(a => a.activity_type === 'email_click').length || 0;
    const formSubmits = activities?.filter(a => a.activity_type === 'form_submit').length || 0;

    return NextResponse.json({
      contactId,
      leadScore: contact.lead_score,
      emailSequenceId: contact.email_sequence_id,
      emailSequenceStartedAt: contact.email_sequence_started_at,
      activities: activities || [],
      emailQueue: emailQueue || [],
      stats: {
        opens,
        clicks,
        formSubmits,
        totalActivities: activities?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching contact activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
