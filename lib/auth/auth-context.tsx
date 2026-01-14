'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/db/supabase-client';
import { Agent } from '@/lib/types/database';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  agent: Agent | null;
  loading: boolean;
  agentLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
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
  refreshAgent: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentLoading, setAgentLoading] = useState(true);

  // Simple agent fetch - no retries, no locks
  const fetchAgent = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data) {
        setAgent(data as Agent);
      } else {
        setAgent(null);
      }
    } catch (error) {
      console.error('Failed to fetch agent:', error);
      setAgent(null);
    } finally {
      setAgentLoading(false);
    }
  }, []);

  // Initialize auth - simple and direct
  useEffect(() => {
    const supabase = createClient();
    let currentUserId: string | null = null;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      currentUserId = session?.user?.id ?? null;
      setLoading(false);

      if (session?.user) {
        fetchAgent(session.user.id);
      } else {
        setAgentLoading(false);
      }
    });

    // Listen for auth changes - only react to actual user changes, not token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id ?? null;

      // Skip if user hasn't changed - this prevents refetch on TOKEN_REFRESHED events
      // which happen when tab regains focus
      if (event === 'TOKEN_REFRESHED' && newUserId === currentUserId) {
        // Just update session without refetching agent
        setSession(session);
        return;
      }

      // Only update and refetch if user actually changed
      if (newUserId !== currentUserId) {
        currentUserId = newUserId;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setAgentLoading(true);
          fetchAgent(session.user.id);
        } else {
          setAgent(null);
          setAgentLoading(false);
        }
      } else {
        // User is the same, just update session (e.g., for token refresh)
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAgent]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Sign in failed' };
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAgent(null);
  }, []);

  const refreshAgent = useCallback(async () => {
    if (user) {
      setAgentLoading(true);
      await fetchAgent(user.id);
    }
  }, [user, fetchAgent]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      agent,
      loading,
      agentLoading,
      signIn,
      signOut,
      refreshAgent
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
