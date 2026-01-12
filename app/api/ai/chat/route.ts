/**
 * AI Chat API Route
 * Streaming chat endpoint using Claude API
 * Following CodeBakers patterns from 14-ai.md and 03-api.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, CLAUDE_MODELS, SYSTEM_PROMPTS, calculateCost } from '@/lib/ai/claude-client';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';

// Rate limiting (in production, use Redis or similar)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error: 'AI service not configured',
          message: 'The AI Copilot feature is not currently available. Please contact support.'
        },
        { status: 503 }
      );
    }

    // Verify authentication
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { messages, context = 'GENERAL_ASSISTANT', stream = true } = body;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    // Sanitize messages
    const sanitizedMessages: Message[] = messages.map((msg: Message) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: String(msg.content).slice(0, 10000), // Limit message length
    }));

    // Get system prompt
    const systemPrompt = SYSTEM_PROMPTS[context as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.GENERAL_ASSISTANT;

    // Get agent context for personalized responses
    const { data: agent } = await supabase
      .from('agents')
      .select('rank, first_name, personal_premium_90d, team_count, ai_copilot_tier, ai_copilot_subscribed_at')
      .eq('user_id', user.id)
      .single() as { data: any };

    // Check if agent has active AI Copilot subscription
    if (!agent || agent.ai_copilot_tier === 'none') {
      return NextResponse.json(
        {
          error: 'AI Copilot subscription required',
          message: 'Please subscribe to AI Copilot in your Settings to access this feature.',
        },
        { status: 403 }
      );
    }

    // Add agent context to system prompt
    const contextualPrompt = agent
      ? `${systemPrompt}\n\nAgent Context:\n- Name: ${agent.first_name}\n- Rank: ${agent.rank}\n- AI Copilot Tier: ${agent.ai_copilot_tier}\n- 90-day Premium: $${agent.personal_premium_90d?.toLocaleString() || 0}\n- Team Size: ${agent.team_count || 0}`
      : systemPrompt;

    // Handle streaming response
    if (stream) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const messageStream = await getAnthropicClient().messages.create({
              model: CLAUDE_MODELS.SONNET,
              max_tokens: 4096,
              system: contextualPrompt,
              messages: sanitizedMessages,
              stream: true,
            });

            let inputTokens = 0;
            let outputTokens = 0;

            for await (const event of messageStream) {
              if (event.type === 'message_start') {
                inputTokens = event.message.usage.input_tokens;
              } else if (event.type === 'content_block_delta') {
                if (event.delta.type === 'text_delta') {
                  const text = event.delta.text;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
              } else if (event.type === 'message_delta') {
                outputTokens = event.usage.output_tokens;
              } else if (event.type === 'message_stop') {
                // Log usage
                const cost = calculateCost('SONNET', inputTokens, outputTokens);
                console.log('AI Chat Usage:', {
                  userId: user.id,
                  inputTokens,
                  outputTokens,
                  cost: `$${cost.toFixed(4)}`,
                });

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ done: true, usage: { inputTokens, outputTokens, cost } })}\n\n`)
                );
                controller.close();
              }
            }
          } catch (error) {
            console.error('Streaming error:', error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Streaming error' })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const response = await getAnthropicClient().messages.create({
      model: CLAUDE_MODELS.SONNET,
      max_tokens: 4096,
      system: contextualPrompt,
      messages: sanitizedMessages,
    });

    // Log usage
    const cost = calculateCost('SONNET', response.usage.input_tokens, response.usage.output_tokens);
    console.log('AI Chat Usage:', {
      userId: user.id,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cost: `$${cost.toFixed(4)}`,
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === 'text');
    const text = textContent && textContent.type === 'text' ? textContent.text : '';

    return NextResponse.json({
      message: text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cost,
      },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}
