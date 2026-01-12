/**
 * AI Chat API Tests
 * Following CodeBakers patterns from 08-testing.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/ai/chat/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/db/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

const mockAnthropicClient = {
  messages: {
    create: vi.fn(),
  },
};

vi.mock('@/lib/ai/claude-client', () => ({
  getAnthropicClient: vi.fn(() => Promise.resolve(mockAnthropicClient)),
  CLAUDE_MODELS: {
    SONNET: 'claude-3-5-sonnet-20241022',
  },
  SYSTEM_PROMPTS: {
    GENERAL_ASSISTANT: 'Test system prompt',
  },
  calculateCost: vi.fn(() => 0.001),
}));

import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { getAnthropicClient, calculateCost } from '@/lib/ai/claude-client';

function createMockSupabase(user: any, agent: any = null) {
  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: agent, error: null })),
        })),
      })),
    })),
  };
}

describe('POST /api/ai/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variable
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = createMockSupabase(null);
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if messages are invalid', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' };
    const mockAgent = { ai_copilot_tier: 'basic' };
    const mockSupabase = createMockSupabase(mockUser, mockAgent);
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Messages array required');
  });

  it('should return 403 if agent has no AI Copilot subscription', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' };
    const mockAgent = {
      rank: 'agent',
      first_name: 'John',
      personal_premium_90d: 50000,
      team_count: 5,
      ai_copilot_tier: 'none',
      ai_copilot_subscribed_at: null,
    };
    const mockSupabase = createMockSupabase(mockUser, mockAgent);
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('AI Copilot subscription required');
    expect(data.message).toContain('subscribe');
  });

  it('should handle successful non-streaming chat', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' };
    const mockAgent = { ai_copilot_tier: 'basic' };
    const mockSupabase = createMockSupabase(mockUser, mockAgent);
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    vi.mocked(mockAnthropicClient.messages.create).mockResolvedValue({
      id: 'msg-1',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello! How can I help you?' }],
      model: 'claude-3-5-sonnet-20241022',
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 20 },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Hello! How can I help you?');
    expect(data.usage).toBeDefined();
    expect(data.usage.inputTokens).toBe(10);
    expect(data.usage.outputTokens).toBe(20);
  });

  it('should handle API errors', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' };
    const mockAgent = { ai_copilot_tier: 'basic' };
    const mockSupabase = createMockSupabase(mockUser, mockAgent);
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    vi.mocked(mockAnthropicClient.messages.create).mockRejectedValue(new Error('API Error'));

    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process chat request');
  });

  it('should sanitize message content', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' };
    const mockAgent = { ai_copilot_tier: 'pro' };
    const mockSupabase = createMockSupabase(mockUser, mockAgent);
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    vi.mocked(mockAnthropicClient.messages.create).mockResolvedValue({
      id: 'msg-1',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Response' }],
      model: 'claude-3-5-sonnet-20241022',
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 20 },
    } as any);

    // Create a very long message (>10000 chars)
    const longMessage = 'a'.repeat(20000);

    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: longMessage }],
        stream: false,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    // Verify that the message was truncated in the API call
    const callArgs = vi.mocked(mockAnthropicClient.messages.create).mock.calls[0][0];
    expect((callArgs.messages as any)[0].content.length).toBe(10000);
  });

  it('should add agent context when available', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' };
    const mockAgent = {
      rank: 'agent',
      first_name: 'John',
      personal_premium_90d: 50000,
      team_count: 5,
    };
    const mockSupabase = createMockSupabase(mockUser, mockAgent);
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    vi.mocked(mockAnthropicClient.messages.create).mockResolvedValue({
      id: 'msg-1',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Response' }],
      model: 'claude-3-5-sonnet-20241022',
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 20 },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    // Verify system prompt includes agent context
    const callArgs = vi.mocked(mockAnthropicClient.messages.create).mock.calls[0][0];
    expect(callArgs.system).toContain('John');
    expect(callArgs.system).toContain('agent');
    expect(callArgs.system).toContain('50,000');
  });
});
