/**
 * Agent Signup API Tests
 * Tests for POST /api/auth/signup
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/signup/route';

// Mock the supabase server module
vi.mock('@/lib/db/supabase-server', () => ({
  createAdminClient: vi.fn(),
}));

// Mock the workflow
vi.mock('@/lib/workflows/on-agent-registered', () => ({
  onAgentRegistered: vi.fn().mockResolvedValue({ success: true, matrixPosition: '1.1', errors: [] }),
}));

// Mock the email service
vi.mock('@/lib/email/email-service', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Import mocked modules
import { createAdminClient } from '@/lib/db/supabase-server';
import { onAgentRegistered } from '@/lib/workflows/on-agent-registered';

describe('Agent Signup API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    const validPayload = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-123-4567',
    };

    it('should return 400 for invalid email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          ...validPayload,
          email: 'invalid-email',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for password too short', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          ...validPayload,
          password: '1234567', // Only 7 chars
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for missing first name', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          ...validPayload,
          firstName: '',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 409 if email already exists', async () => {
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing-agent' },
              error: null,
            }),
          }),
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('An account with this email already exists');
    });

    it('should return 400 for invalid sponsor username', async () => {
      const mockClient = {
        from: vi.fn().mockImplementation((table) => {
          if (table === 'agents') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockImplementation((field) => {
                if (field === 'email') {
                  return {
                    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
                  };
                }
                if (field === 'username') {
                  return {
                    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
                  };
                }
                return { single: vi.fn().mockResolvedValue({ data: null, error: null }) };
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          ...validPayload,
          sponsorUsername: 'invaliduser',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid sponsor code. Please check and try again.');
    });

    it('should create agent successfully and return 201', async () => {
      const mockAgentId = 'new-agent-id';
      const mockUserId = 'new-user-id';
      const mockAgentCode = 'APX123456';
      const mockUsername = 'johndoe';

      const mockClient = {
        from: vi.fn().mockImplementation((table) => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: mockAgentId,
                  email: validPayload.email.toLowerCase(),
                  first_name: validPayload.firstName,
                  last_name: validPayload.lastName,
                  username: mockUsername,
                  agent_code: mockAgentCode,
                },
                error: null,
              }),
            }),
          }),
        })),
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: { user: { id: mockUserId } },
              error: null,
            }),
            generateLink: vi.fn().mockResolvedValue({
              data: { properties: { action_link: 'https://example.com/verify' } },
              error: null,
            }),
            deleteUser: vi.fn().mockResolvedValue({ error: null }),
          },
        },
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Account created successfully');
      expect(data.requiresVerification).toBe(true);
    });

    it('should call onAgentRegistered workflow after creating agent', async () => {
      const mockAgentId = 'new-agent-id';
      const mockUserId = 'new-user-id';

      const mockClient = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: mockAgentId,
                  email: validPayload.email.toLowerCase(),
                  first_name: validPayload.firstName,
                  last_name: validPayload.lastName,
                  username: 'johndoe',
                  agent_code: 'APX123456',
                },
                error: null,
              }),
            }),
          }),
        })),
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: { user: { id: mockUserId } },
              error: null,
            }),
            generateLink: vi.fn().mockResolvedValue({
              data: { properties: { action_link: 'https://example.com/verify' } },
              error: null,
            }),
            deleteUser: vi.fn().mockResolvedValue({ error: null }),
          },
        },
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });

      await POST(request);

      // Verify the workflow was called
      expect(onAgentRegistered).toHaveBeenCalledWith(
        expect.objectContaining({
          agent: expect.objectContaining({
            id: mockAgentId,
          }),
        })
      );
    });

    it('should clean up auth user if agent creation fails', async () => {
      const mockUserId = 'new-user-id';
      const mockDeleteUser = vi.fn().mockResolvedValue({ error: null });

      const mockClient = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        })),
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: { user: { id: mockUserId } },
              error: null,
            }),
            deleteUser: mockDeleteUser,
          },
        },
      };
      vi.mocked(createAdminClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>);

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(mockDeleteUser).toHaveBeenCalledWith(mockUserId);
    });
  });
});
