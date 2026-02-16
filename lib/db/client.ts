// SPEC: CLAUDE.md > Database > Supabase client utilities
// Client creation for server components and server actions

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Create Supabase client for Server Components
 * Uses cookies for auth state
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }>
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create Supabase service client for Server Actions
 * Uses service role key for admin operations
 * WARNING: Only use server-side, never expose to client
 */
export function createServiceClient() {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Get database connection string for Drizzle
 * Note: Set DATABASE_URL in .env.local with your Supabase connection string
 * Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
 */
export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Fallback: construct from Supabase URL (requires additional setup)
  throw new Error(
    "DATABASE_URL not set. Please add your Supabase database connection string to .env.local"
  );
}

/**
 * Drizzle ORM database client
 * Use this for all database queries
 *
 * Connection pooling configuration:
 * - max: Maximum number of connections in pool
 * - idle_timeout: How long to keep idle connections (seconds)
 * - connect_timeout: How long to wait for connection (seconds)
 *
 * Development mode: Use global variable to prevent connection exhaustion
 * during Next.js hot reloading
 */
declare global {
  // eslint-disable-next-line no-var
  var __db_client: postgres.Sql | undefined;
}

function getQueryClient() {
  if (process.env.NODE_ENV === "development") {
    // In development, reuse connection across hot reloads
    if (!global.__db_client) {
      const connectionString = getDatabaseUrl();
      global.__db_client = postgres(connectionString, {
        max: 5, // Lower max for development
        idle_timeout: 20,
        connect_timeout: 10,
      });
    }
    return global.__db_client;
  } else {
    // In production, create a single connection pool
    const connectionString = getDatabaseUrl();
    return postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
}

export const db = drizzle(getQueryClient(), { schema });
