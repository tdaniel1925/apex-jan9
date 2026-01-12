/**
 * Auth Context Unit Tests
 * Testing auth context caching and state management
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';

// Create a shared mock Supabase client that all calls to createClient() will return
const mockSupabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })),
  })),
};

// Mock Supabase client to return the shared mock
vi.mock('@/lib/db/supabase-client', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Mock performance utilities
vi.mock('@/lib/utils/performance', () => ({
  measureAsync: vi.fn((name, fn) => fn()),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    });
  });

  it('should initialize with loading state', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Initially loading is true
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.agent).toBeNull();

    // Wait for loading to finish
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should cache agent data after first fetch', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01',
    };

    const mockAgent = {
      id: 'agent-123',
      user_id: 'user-123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      rank: 'associate',
      status: 'active',
    };

    // Setup mocks BEFORE rendering
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } as any },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockAgent, error: null }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Wait for agent to be loaded
    await waitFor(() => {
      expect(result.current.agentLoading).toBe(false);
    });

    // Agent should be loaded
    expect(result.current.agent).toEqual(mockAgent);

    // from().select() should have been called for agent fetch
    expect(mockSupabase.from).toHaveBeenCalledWith('agents');
  });

  it('should provide refreshAgent function', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refreshAgent).toBe('function');

    // Call refreshAgent
    await act(async () => {
      await result.current.refreshAgent();
    });

    // Should complete without error
    expect(result.current.agentLoading).toBe(false);
  });

  it('should clear agent data on signOut', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01',
    };

    const mockAgent = {
      id: 'agent-123',
      user_id: 'user-123',
      email: 'test@example.com',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } as any },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockAgent, error: null }),
        }),
      }),
    } as any);

    // Mock onAuthStateChange to capture the callback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let authChangeCallback: any;
    (mockSupabase.auth.onAuthStateChange as any).mockImplementation((callback: any) => {
      authChangeCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.agentLoading).toBe(false);
    });

    // Agent should be loaded
    expect(result.current.agent).toEqual(mockAgent);

    // Sign out - this triggers onAuthStateChange with null session
    await act(async () => {
      // Simulate auth state change to null (sign out)
      if (authChangeCallback) {
        authChangeCallback('SIGNED_OUT', null);
      }
    });

    // Agent should be cleared
    expect(result.current.agent).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('should handle agent fetch errors gracefully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } as any },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.agentLoading).toBe(false);
    });

    // Should complete loading even with error
    expect(result.current.agent).toBeNull();
  });

  it('should handle signIn errors', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' } as any,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Attempt sign in with invalid credentials
    let signInResult;
    await act(async () => {
      signInResult = await result.current.signIn('test@example.com', 'wrongpassword');
    });

    // Should return error
    expect(signInResult).toEqual({ error: 'Invalid credentials' });
  });

  it('should call supabase methods correctly', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // getSession should have been called during initialization
    expect(mockSupabase.auth.getSession).toHaveBeenCalled();

    // onAuthStateChange should have been set up
    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
  });
});
