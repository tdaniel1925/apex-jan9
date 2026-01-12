/**
 * Copilot AI Service
 * Generates AI responses for the chat widget using OpenAI
 * Following CodeBakers 14-ai.md patterns
 */

import { openai, MODELS } from '@/lib/ai/openai';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentContext {
  agentName: string;
  agentEmail?: string;
  companyName?: string;
  specialties?: string[];
}

export interface GenerateResponseOptions {
  message: string;
  history?: ChatMessage[];
  agentContext?: AgentContext;
  maxTokens?: number;
}

// System prompt for insurance agent copilot
const SYSTEM_PROMPT = `You are an AI assistant for an insurance agent. Your role is to:

1. Welcome visitors warmly and professionally
2. Answer questions about life insurance, health insurance, and financial protection
3. Qualify leads by understanding their needs
4. Encourage visitors to provide their contact information
5. Schedule appointments with the agent when appropriate

Guidelines:
- Be helpful, friendly, and professional
- Keep responses concise (2-3 sentences usually)
- Don't provide specific quotes or pricing - that requires a consultation
- If asked complex questions, encourage scheduling a call with the agent
- Always be honest - if you don't know something, say so
- Never provide medical or legal advice
- Focus on the value of protection and peace of mind

Remember: Your goal is to engage visitors and convert them into qualified leads for the agent.`;

/**
 * Generate AI response for widget chat
 */
export async function generateCopilotResponse(
  options: GenerateResponseOptions
): Promise<{ response: string; tokensUsed: number }> {
  const { message, history = [], agentContext, maxTokens = 300 } = options;

  // If OpenAI is not configured, use fallback responses
  if (!openai) {
    return {
      response: generateFallbackResponse(message),
      tokensUsed: 0,
    };
  }

  try {
    // Build system message with agent context
    let systemMessage = SYSTEM_PROMPT;
    if (agentContext) {
      systemMessage += `\n\nAgent Information:
- Agent Name: ${agentContext.agentName}
${agentContext.companyName ? `- Company: ${agentContext.companyName}` : ''}
${agentContext.specialties?.length ? `- Specialties: ${agentContext.specialties.join(', ')}` : ''}

When appropriate, mention that ${agentContext.agentName} would be happy to help with a personalized consultation.`;
    }

    // Build messages array
    const messages: ChatMessage[] = [
      { role: 'system', content: systemMessage },
      ...history.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: MODELS.GPT4O_MINI, // Cost-effective for high-volume widget chats
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || generateFallbackResponse(message);
    const tokensUsed = completion.usage?.total_tokens || 0;

    return { response, tokensUsed };
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Return fallback on error
    return {
      response: generateFallbackResponse(message),
      tokensUsed: 0,
    };
  }
}

/**
 * Generate fallback response when OpenAI is unavailable
 */
function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Greeting responses
  if (
    lowerMessage.includes('hello') ||
    lowerMessage.includes('hi') ||
    lowerMessage.includes('hey')
  ) {
    return "Hello! Welcome! I'm here to help you learn about our insurance solutions and answer any questions you might have. What would you like to know about?";
  }

  // Insurance-related queries
  if (
    lowerMessage.includes('life insurance') ||
    lowerMessage.includes('coverage') ||
    lowerMessage.includes('policy')
  ) {
    return "Life insurance is essential for protecting your loved ones' financial future. We offer several options including term life and whole life policies. Would you like me to explain the differences, or would you prefer to schedule a call with your agent to discuss your specific needs?";
  }

  // Quote/pricing queries
  if (
    lowerMessage.includes('quote') ||
    lowerMessage.includes('price') ||
    lowerMessage.includes('cost') ||
    lowerMessage.includes('how much')
  ) {
    return "I'd be happy to help you get a quote! To provide accurate pricing, we'll need some details about your situation. The best way to get a personalized quote is to schedule a quick consultation with your agent. Would you like me to help arrange that?";
  }

  // Contact/appointment queries
  if (
    lowerMessage.includes('contact') ||
    lowerMessage.includes('call') ||
    lowerMessage.includes('appointment') ||
    lowerMessage.includes('schedule') ||
    lowerMessage.includes('talk')
  ) {
    return "I'd be happy to help you connect with your agent! You can schedule a consultation at a time that works for you. What days and times work best for you?";
  }

  // Health insurance
  if (lowerMessage.includes('health') || lowerMessage.includes('medical')) {
    return "Health insurance is crucial for protecting yourself and your family from unexpected medical costs. We can help you find coverage that fits your needs and budget. Would you like to learn more about your options?";
  }

  // Retirement/savings
  if (
    lowerMessage.includes('retire') ||
    lowerMessage.includes('savings') ||
    lowerMessage.includes('investment')
  ) {
    return "Planning for retirement is one of the most important financial decisions you'll make. We offer products that can help you build wealth while providing protection. Would you like to discuss your retirement goals?";
  }

  // Thank you responses
  if (lowerMessage.includes('thank')) {
    return "You're welcome! Is there anything else I can help you with today? Feel free to ask any questions about our insurance products or services.";
  }

  // Default response
  return "Thank you for your question! I'm here to help you learn about our insurance products and services. Could you tell me a bit more about what you're looking for? For example, are you interested in life insurance, health coverage, or retirement planning?";
}

/**
 * Sanitize user input before sending to AI
 */
export function sanitizeInput(input: string): string {
  // Remove potential prompt injection attempts
  const sanitized = input
    .replace(/\[.*?\]/g, '') // Remove bracketed content
    .replace(/system:/gi, '') // Remove system: prefix
    .replace(/assistant:/gi, '') // Remove assistant: prefix
    .replace(/user:/gi, '') // Remove user: prefix
    .trim()
    .slice(0, 1000); // Limit length

  return sanitized;
}

/**
 * Check if message contains sensitive information that shouldn't be processed
 */
export function containsSensitiveInfo(message: string): boolean {
  const sensitivePatterns = [
    /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/, // SSN
    /\b\d{16}\b/, // Credit card
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card with spaces
  ];

  return sensitivePatterns.some((pattern) => pattern.test(message));
}
