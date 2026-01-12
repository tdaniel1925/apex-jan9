/**
 * Admin Login Page Tests
 * Tests for manual admin verification and forced logout
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLoginPage from '@/app/admin-login/page';
import { useRouter } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

// Mock auth context
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/db/supabase-client', () => ({
  createClient: () => mockSupabaseClient,
}));

describe('AdminLoginPage', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    } as any);
  });

  it('should force logout on page load if user is logged in', async () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signOut: mockSignOut,
      agent: { id: 'agent-123', rank: 'regional_mga' },
      agentLoading: false,
    });

    render(<AdminLoginPage />);

    // Wait for useEffect to run
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it('should not force logout if already logged out', async () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signOut: mockSignOut,
      agent: null,
      agentLoading: false,
    });

    render(<AdminLoginPage />);

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('should handle sign-in errors', async () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signOut: mockSignOut,
      agent: null,
      agentLoading: false,
    });

    mockSignIn.mockResolvedValue({ error: 'Invalid credentials' });

    render(<AdminLoginPage />);

    // Fill in the form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /access admin panel/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle admin verification failure', async () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signOut: mockSignOut,
      agent: null,
      agentLoading: false,
    });

    mockSignIn.mockResolvedValue({ error: null });
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock agent fetch to return error
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Agent not found' },
          }),
        }),
      }),
    });

    render(<AdminLoginPage />);

    // Fill in the form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /access admin panel/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/failed to verify admin access/i)).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should reject non-admin users', async () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signOut: mockSignOut,
      agent: null,
      agentLoading: false,
    });

    mockSignIn.mockResolvedValue({ error: null });
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock agent with non-admin rank
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { rank: 'associate' }, // Low rank
            error: null,
          }),
        }),
      }),
    });

    render(<AdminLoginPage />);

    // Fill in the form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /access admin panel/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/access denied.*regional mga or higher required/i)).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should allow admin users and redirect to /admin', async () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signOut: mockSignOut,
      agent: null,
      agentLoading: false,
    });

    mockSignIn.mockResolvedValue({ error: null });
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock agent with admin rank
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { rank: 'regional_mga' }, // Admin rank
            error: null,
          }),
        }),
      }),
    });

    render(<AdminLoginPage />);

    // Fill in the form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /access admin panel/i });

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'adminpassword' } });
    fireEvent.click(submitButton);

    // Wait for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('should show loading state during authentication', async () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signOut: mockSignOut,
      agent: null,
      agentLoading: false,
    });

    // Make signIn take a while
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 1000)));

    render(<AdminLoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /access admin panel/i });

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'adminpassword' } });
    fireEvent.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/authenticating/i)).toBeInTheDocument();
    });
  });

  it('should disable form inputs during loading', async () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signOut: mockSignOut,
      agent: null,
      agentLoading: false,
    });

    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 1000)));

    render(<AdminLoginPage />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /access admin panel/i }) as HTMLButtonElement;

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'adminpassword' } });
    fireEvent.click(submitButton);

    // Inputs should be disabled
    await waitFor(() => {
      expect(emailInput.disabled).toBe(true);
      expect(passwordInput.disabled).toBe(true);
      expect(submitButton.disabled).toBe(true);
    });
  });
});
