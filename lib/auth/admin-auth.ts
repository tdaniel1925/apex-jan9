/**
 * Admin Authentication Utilities
 * Middleware and helpers for admin route protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { RANK_CONFIG, Rank } from '@/lib/config/ranks';
import type { Agent } from '@/lib/types/database';

export interface AdminUser {
  userId: string;
  agentId: string;
  agent: Agent;
  isAdmin: boolean;
}

// Minimum rank required for admin access
const ADMIN_MIN_RANK: Rank = 'regional_mga';

/**
 * Verify the current user has admin privileges
 * Returns the admin user info or null if not authorized
 */
export async function verifyAdmin(): Promise<AdminUser | null> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: agentData, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !agentData) {
      return null;
    }

    const agent = agentData as Agent;
    const agentRankOrder = RANK_CONFIG[agent.rank]?.order ?? 0;
    const minRankOrder = RANK_CONFIG[ADMIN_MIN_RANK].order;
    const isAdmin = agentRankOrder >= minRankOrder;

    if (!isAdmin) {
      return null;
    }

    return {
      userId: user.id,
      agentId: agent.id,
      agent,
      isAdmin: true,
    };
  } catch (error) {
    console.error('Admin verification error:', error);
    return null;
  }
}

/**
 * Check if current user is admin (simplified version)
 * Returns { isAdmin: boolean, admin?: AdminUser }
 */
export async function isAdmin(request?: NextRequest): Promise<{ isAdmin: boolean; admin?: AdminUser }> {
  const admin = await verifyAdmin();
  return {
    isAdmin: admin !== null,
    admin: admin || undefined,
  };
}

/**
 * Middleware wrapper for admin routes
 * Use this to wrap route handlers that require admin access
 */
export function withAdminAuth<T extends unknown[]>(
  handler: (admin: AdminUser, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const admin = await verifyAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    return handler(admin, ...args);
  };
}

/**
 * Check if a rank qualifies for admin access
 */
export function isAdminRank(rank: Rank): boolean {
  const rankOrder = RANK_CONFIG[rank]?.order ?? 0;
  const minRankOrder = RANK_CONFIG[ADMIN_MIN_RANK].order;
  return rankOrder >= minRankOrder;
}

/**
 * Unauthorized response helper
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Forbidden response helper
 */
export function forbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Not found response helper
 */
export function notFoundResponse(message = 'Not found'): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Bad request response helper
 */
export function badRequestResponse(message: string, details?: unknown): NextResponse {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

/**
 * Server error response helper
 */
export function serverErrorResponse(message = 'Internal server error'): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 });
}
