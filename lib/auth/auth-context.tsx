'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/db/supabase-client';
import { Agent } from '@/lib/types/database';
import { measureAsync } from '@/lib/utils/performance';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  agent: Agent | null;
  loading: boolean;
  agentLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshAgent: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  agent: null,
  loading: true,
  agentLoading: true,
  signIn: async () => ({ error: 'Not initialized' }),
  signOut: async () => {},
  refreshSession: async () => {},
  refreshAgent: async () => {},
});

// Global subscription reference to prevent multiple listeners
let globalAuthSubscription: { unsubscribe: () => void } | null = null;
// Global lock to prevent overlapping auth state change handlers
let authStateChangeLock = false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentLoading, setAgentLoading] = useState(true);

  // Lock to prevent concurrent fetch operations
  const fetchLockRef = useRef<boolean>(false);

  // Fetch agent data from database and cache it
  const fetchAgent = useCallback(async (userId: string, userEmail?: string) => {
    // Skip if already fetching
    if (fetchLockRef.current) {
      return;
    }

    fetchLockRef.current = true;

    try {
      return await measureAsync('fetchAgent', async () => {
        try {
          const supabase = createClient();
          const { data: existingAgent, error: fetchError } = await supabase
            .from('agents')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Suppress AbortError - this happens when requests are cancelled (normal behavior)
        if (fetchError && fetchError.message?.includes('aborted')) {
          setAgentLoading(false);
          return;
        }

        if (existingAgent) {
          setAgent(existingAgent as Agent);
          setAgentLoading(false);
          return;
        }

        // No agent exists - create one automatically
        // If no email provided, fetch from auth
        let email = userEmail || '';
        if (!email) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          email = authUser?.email || '';
        }

        const nameParts = email.split('@')[0].split('.');
        const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'User';
        const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : '';
        const agentCode = `APX${Date.now().toString(36).toUpperCase()}`;

        const { data: newAgent, error } = await supabase
          .from('agents')
          .insert({
            user_id: userId,
            email: email,
            first_name: firstName,
            last_name: lastName,
            username: email.split('@')[0],
            agent_code: agentCode,
            rank: 'pre_associate',
            status: 'active',
            premium_90_days: 0,
            personal_recruits_count: 0,
            active_agents_count: 0,
            ai_copilot_tier: 'none',
          } as never)
          .select()
          .single();

        if (error) {
          // Suppress AbortError during insert
          if (error.message?.includes('aborted')) {
            setAgentLoading(false);
            return;
          }

          // Always try to fetch the agent first - it might already exist
          const { data: retryAgent, error: retryError } = await supabase
            .from('agents')
            .select('*')
            .eq('user_id', userId)
            .single();

          // Suppress AbortError during retry
          if (retryError && retryError.message?.includes('aborted')) {
            setAgentLoading(false);
            return;
          }

          if (retryAgent) {
            // Agent exists, use it and suppress the error
            setAgent(retryAgent as Agent);
            setAgentLoading(false);
            return;
          }

          // If no agent found, log the error for debugging
          // Log the raw error first to see what we're actually getting
          console.error('Failed to create agent - Raw error:', error);
          // Try to extract error information in different formats
          console.error('Failed to create agent - Details:', {
            errorType: typeof error,
            isError: error instanceof Error,
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
            stack: error instanceof Error ? error.stack : undefined,
            // Stringify to see all properties
            stringified: JSON.stringify(error, null, 2),
          });
          setAgentLoading(false);
          return;
        }

        if (newAgent) {
          const typedAgent = newAgent as Agent;
          // Create wallet for the agent
          await supabase.from('wallets').insert({
            agent_id: typedAgent.id,
            balance: 0,
            pending_balance: 0,
            lifetime_earnings: 0,
          } as never);

          setAgent(typedAgent);
        }

        setAgentLoading(false);
        } catch (error) {
          // Suppress AbortError - this happens when requests are cancelled (normal in React)
          if (error instanceof Error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
            setAgentLoading(false);
            return;
          }
          console.error('Failed to fetch agent:', error);
          setAgentLoading(false);
        }
      });
    } catch (error) {
      // Catch any AbortErrors from measureAsync wrapper
      if (error instanceof Error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
        setAgentLoading(false);
        return;
      }
      throw error;
    } finally {
      // Always release the lock, even if an error occurred
      fetchLockRef.current = false;
    }
  }, []);

  const refreshAgent = useCallback(async () => {
    if (user) {
      setAgentLoading(true);
      await fetchAgent(user.id, user.email || undefined);
    }
  }, [user, fetchAgent]);

  const refreshSession = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      // Fetch agent data when session refreshes
      if (currentSession?.user) {
        await fetchAgent(currentSession.user.id, currentSession.user.email || undefined);
      } else {
        setAgent(null);
        setAgentLoading(false);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  }, [fetchAgent]);

  useEffect(() => {
    let mounted = true;

    // Unsubscribe from any existing global subscription to prevent duplicates
    if (globalAuthSubscription) {
      globalAuthSubscription.unsubscribe();
      globalAuthSubscription = null;
    }

    const supabase = createClient();

    // Listen for auth changes - this fires immediately with current session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;

        // Skip if another auth state change is already being processed
        if (authStateChangeLock) {
          return;
        }

        authStateChangeLock = true;

        try {
          await measureAsync('onAuthStateChange', async () => {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setLoading(false);

            // Fetch agent data when auth state changes
            if (newSession?.user) {
              setAgentLoading(true);
              await fetchAgent(newSession.user.id, newSession.user.email || undefined);
            } else {
              setAgent(null);
              setAgentLoading(false);
            }
          });
        } catch (error) {
          // Suppress AbortError from Supabase's internal locks - this is a known
          // development-mode issue caused by React Strict Mode double-mounting
          if (error instanceof Error && error.name === 'AbortError') {
            // Silently ignore - this doesn't affect functionality
            return;
          }
          // Log other errors
          console.error('Auth state change error:', error);
        } finally {
          authStateChangeLock = false;
        }
      }
    );

    // Store globally to prevent multiple subscriptions
    globalAuthSubscription = subscription;

    return () => {
      mounted = false;
      if (globalAuthSubscription) {
        globalAuthSubscription.unsubscribe();
        globalAuthSubscription = null;
      }
    };
  }, [fetchAgent]);

  const signIn = useCallback(async (email: string, password: string) => {
    return measureAsync('signIn', async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      } catch {
        return { error: 'An unexpected error occurred' };
      }
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setAgent(null);
      setAgentLoading(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    agent,
    loading,
    agentLoading,
    signIn,
    signOut,
    refreshSession,
    refreshAgent,
  }), [user, session, agent, loading, agentLoading, signIn, signOut, refreshSession, refreshAgent]);

  // Always render children immediately - never block
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
