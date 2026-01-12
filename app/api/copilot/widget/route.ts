/**
 * Copilot Widget API
 * Public API for the embeddable chat widget
 * POST /api/copilot/widget - Send a message
 * GET /api/copilot/widget - Get agent widget config
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/supabase-server';
import { DEFAULT_WIDGET_CONFIG, WIDGET_RATE_LIMITS } from '@/lib/copilot/widget-config';
import { getSubscription, incrementUsage } from '@/lib/copilot/subscription-service';
import { generateCopilotResponse, sanitizeInput, containsSensitiveInfo } from '@/lib/copilot/ai-service';
import { z } from 'zod';

// Request schema for widget messages
const widgetMessageSchema = z.object({
  agentId: z.string().uuid(),
  visitorId: z.string().min(1),
  sessionId: z.string().optional(),
  message: z.string().min(1).max(WIDGET_RATE_LIMITS.maxMessageLength),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

// Response headers for CORS (widget can be embedded anywhere)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Visitor-Id',
};

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Result types for Supabase queries
interface AgentRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_image_url: string | null;
  ai_copilot_tier: string | null;
}

interface WidgetSessionRow {
  id: string;
  agent_id: string;
  visitor_id: string;
  contact_id: string | null;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

/**
 * GET /api/copilot/widget?agentId=xxx
 * Get widget configuration for an agent
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createServiceClient();

    // Get agent info
    const { data: agent } = await supabase
      .from('agents')
      .select('id, first_name, last_name, email, profile_image_url, ai_copilot_tier')
      .eq('id', agentId)
      .single() as unknown as { data: AgentRow | null; error: unknown };

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if agent has active copilot subscription
    const subscription = await getSubscription(agentId);
    const isActive = subscription &&
      (subscription.status === 'active' || subscription.status === 'trialing');

    if (!isActive) {
      return NextResponse.json(
        { error: 'Widget not available', reason: 'no_subscription' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Return widget config
    return NextResponse.json({
      enabled: true,
      config: {
        ...DEFAULT_WIDGET_CONFIG,
        agentName: `${agent.first_name} ${agent.last_name}`,
        agentAvatar: agent.profile_image_url,
      },
      agent: {
        id: agent.id,
        name: `${agent.first_name} ${agent.last_name}`,
        avatar: agent.profile_image_url,
      },
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error getting widget config:', error);
    return NextResponse.json(
      { error: 'Failed to get widget config' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/copilot/widget
 * Send a message to the copilot widget
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = widgetMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400, headers: corsHeaders }
      );
    }

    const { agentId, visitorId, sessionId, message, email, phone } = validationResult.data;

    const supabase = createServiceClient();

    // Verify agent exists and has subscription
    const subscription = await getSubscription(agentId);

    if (!subscription) {
      return NextResponse.json(
        { error: 'Widget not available' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check if agent can use copilot (subscription active and within limits)
    const usageResult = await incrementUsage(agentId);

    if (!usageResult.allowed) {
      return NextResponse.json({
        error: 'Usage limit reached',
        limit: usageResult.limit,
        used: usageResult.used,
        upgradeRequired: subscription.status === 'trialing',
      }, { status: 429, headers: corsHeaders });
    }

    // Get or create widget session
    let session: WidgetSessionRow | null = null;

    if (sessionId) {
      const { data } = await supabase
        .from('copilot_widget_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('agent_id', agentId)
        .single() as unknown as { data: WidgetSessionRow | null; error: unknown };

      session = data;
    }

    // Create new session if needed
    if (!session) {
      const { data: newSession, error: sessionError } = await supabase
        .from('copilot_widget_sessions')
        .insert({
          agent_id: agentId,
          visitor_id: visitorId,
          messages: [],
          message_count: 0,
        } as never)
        .select()
        .single() as unknown as { data: WidgetSessionRow | null; error: unknown };

      if (sessionError || !newSession) {
        throw new Error('Failed to create session');
      }

      session = newSession;
    }

    // If email provided, create or update contact
    let contactId = session.contact_id;

    if (email && !contactId) {
      // Check for existing contact
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('agent_id', agentId)
        .eq('email', email)
        .single() as unknown as { data: { id: string } | null; error: unknown };

      if (existingContact) {
        contactId = existingContact.id;
      } else {
        // Create new contact (lead from widget)
        const { data: newContact } = await supabase
          .from('contacts')
          .insert({
            agent_id: agentId,
            email: email,
            phone: phone || null,
            source: 'copilot_widget',
            status: 'new',
            lead_score: 10, // Initial score for engaging with widget
          } as never)
          .select('id')
          .single() as unknown as { data: { id: string } | null; error: unknown };

        if (newContact) {
          contactId = newContact.id;

          // Track activity
          await supabase
            .from('contact_activities')
            .insert({
              contact_id: contactId,
              activity_type: 'copilot_demo',
              metadata: { session_id: session.id },
            } as never);
        }
      }

      // Update session with contact
      if (contactId) {
        await supabase
          .from('copilot_widget_sessions')
          .update({ contact_id: contactId } as never)
          .eq('id', session.id);
      }
    }

    // Sanitize input and check for sensitive info
    const sanitizedMessage = sanitizeInput(message);
    if (containsSensitiveInfo(sanitizedMessage)) {
      return NextResponse.json({
        sessionId: session.id,
        response: "For your security, please don't share sensitive information like social security numbers or credit card details in chat. Your agent will collect any necessary information securely during your consultation.",
        usage: { used: usageResult.used, limit: usageResult.limit },
      }, { headers: corsHeaders });
    }

    // Get agent info for context
    const { data: agentInfo } = await supabase
      .from('agents')
      .select('first_name, last_name, email')
      .eq('id', agentId)
      .single() as unknown as { data: { first_name: string; last_name: string; email: string } | null; error: unknown };

    // Generate AI response using OpenAI
    const { response: aiResponse } = await generateCopilotResponse({
      message: sanitizedMessage,
      history: session.messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      agentContext: agentInfo ? {
        agentName: `${agentInfo.first_name} ${agentInfo.last_name}`,
        agentEmail: agentInfo.email,
      } : undefined,
    });

    // Update session with new messages
    const updatedMessages = [
      ...session.messages,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
    ];

    await supabase
      .from('copilot_widget_sessions')
      .update({
        messages: updatedMessages,
        message_count: session.message_count + 1,
        last_message_at: new Date().toISOString(),
      } as never)
      .eq('id', session.id);

    // Track copilot message activity if we have a contact
    if (contactId) {
      await supabase
        .from('contact_activities')
        .insert({
          contact_id: contactId,
          activity_type: 'copilot_message',
          metadata: { session_id: session.id },
        } as never);

      // Update lead score for engagement using RPC
      await (supabase as any).rpc('increment_lead_score', {
        p_contact_id: contactId,
        p_increment: 2,
      });
    }

    return NextResponse.json({
      sessionId: session.id,
      response: aiResponse,
      usage: {
        used: usageResult.used,
        limit: usageResult.limit,
      },
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error processing widget message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500, headers: corsHeaders }
    );
  }
}

