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

    // Generate AI response
    // For now, use a simple response template
    // In production, this would call the actual AI service
    const aiResponse = await generateWidgetResponse(message, session.messages, agentId);

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

/**
 * Generate AI response for widget
 * TODO: Integrate with actual AI service (OpenAI/Anthropic)
 */
async function generateWidgetResponse(
  message: string,
  history: Array<{ role: string; content: string; timestamp: string }>,
  agentId: string
): Promise<string> {
  // Simple response logic for demo
  // In production, this would call OpenAI/Anthropic API
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('life insurance') || lowerMessage.includes('coverage')) {
    return "Life insurance is essential for protecting your loved ones' financial future. We offer several options including term life and whole life policies. Would you like me to explain the differences, or would you prefer to schedule a call with your agent to discuss your specific needs?";
  }

  if (lowerMessage.includes('quote') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return "I'd be happy to help you get a quote! To provide accurate pricing, I'll need a few details. Could you share your age, whether you smoke, and approximately how much coverage you're looking for?";
  }

  if (lowerMessage.includes('contact') || lowerMessage.includes('call') || lowerMessage.includes('appointment')) {
    return "I can help you schedule a consultation with your agent. Would you prefer a phone call or video meeting? Also, please share your preferred days and times, and I'll find an available slot.";
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! Welcome! I'm here to help you learn about our insurance solutions and answer any questions you might have. What would you like to know about?";
  }

  // Default response
  return "Thank you for your question! I'm here to help you learn about our insurance products and services. Could you tell me a bit more about what you're looking for? For example, are you interested in life insurance, health coverage, or another type of protection?";
}
