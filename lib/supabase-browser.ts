// Client-side Supabase utilities
// For use in Client Components only

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Create Supabase client for Client Components
 * Uses browser cookies for auth state
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
