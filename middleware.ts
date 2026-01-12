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

  // Fast session check without refreshing
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes (no auth required)
  const publicRoutes = ['/login', '/signup', '/admin-login', '/join'];
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

  // If admin route, verify admin privileges
  if (user && isAdminRoute) {
    const { data: agentData } = await supabase
      .from('agents')
      .select('rank')
      .eq('user_id', user.id)
      .single();

    if (!agentData) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }

    // Check if rank has admin privileges (regional_mga or higher)
    const adminRanks = ['regional_mga', 'national_mga', 'executive'];
    if (!adminRanks.includes(agentData.rank)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // If user is logged in and trying to access login/signup pages
  if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/admin-login')) {
    // Fetch agent data to determine where to redirect
    const { data: agentData } = await supabase
      .from('agents')
      .select('rank')
      .eq('user_id', user.id)
      .single();

    if (agentData) {
      const adminRanks = ['regional_mga', 'national_mga', 'executive'];
      const isAdmin = adminRanks.includes(agentData.rank);

      // Redirect admins to admin panel, others to dashboard
      const redirectUrl = isAdmin ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // If no agent data, redirect to dashboard by default
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

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
