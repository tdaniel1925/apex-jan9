/**
 * Next.js Middleware
 * Server-side auth protection - runs before page renders
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip middleware for Next.js internal requests
  const isNextInternalRequest = request.headers.get('x-nextjs-data') ||
                                request.headers.get('purpose') === 'prefetch';

  if (isNextInternalRequest) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Handle /join/[agentCode] to /team/[username] redirects
  // This preserves SEO by redirecting old URLs to new canonical URLs
  const joinMatch = pathname.match(/^\/join\/([A-Za-z0-9]+)(\/.*)?$/);
  if (joinMatch) {
    const agentCode = joinMatch[1];
    const subPath = joinMatch[2] || '';

    // Quick lookup to check if agent has username
    try {
      const apiResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/agents?agent_code=eq.${agentCode}&select=username`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
        }
      );
      const agents = await apiResponse.json();
      if (agents && agents.length > 0 && agents[0].username) {
        // Redirect to /team/[username] with same sub-path
        const newUrl = new URL(`/team/${agents[0].username}${subPath}`, request.url);
        return NextResponse.redirect(newUrl, 301); // 301 = permanent redirect for SEO
      }
    } catch {
      // If lookup fails, continue to /join/ route (fallback)
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Fast session check without refreshing - NO DATABASE QUERIES
  const { data: { user } } = await supabase.auth.getUser();

  // Public routes (no auth required)
  const publicRoutes = ['/login', '/signup', '/admin-login', '/join', '/team'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route)) || pathname === '/';

  // Admin routes
  const isAdminRoute = pathname.startsWith('/admin');

  // Dashboard routes (agent-only)
  const isDashboardRoute = pathname.startsWith('/dashboard');

  // If no user and trying to access protected route, redirect to login
  if (!user && (isDashboardRoute || isAdminRoute)) {
    const redirectUrl = isAdminRoute ? '/admin-login' : '/login';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Admin route protection - check happens in admin layout, not here
  // Middleware only checks if user is authenticated, not their role
  // This prevents database queries that cause AbortError

  // If user is logged in and trying to access login/signup pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    // Redirect to dashboard - role-based routing happens in dashboard/admin layouts
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // For /admin-login, let logged-in users access it - the page will check admin role and redirect appropriately

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (they handle their own auth)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
