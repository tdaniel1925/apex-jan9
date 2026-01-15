/**
 * Next.js Middleware
 * Server-side auth protection + i18n locale routing
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Create the i18n middleware
const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for Next.js internal requests
  const isNextInternalRequest = request.headers.get('x-nextjs-data') ||
                                request.headers.get('purpose') === 'prefetch';

  if (isNextInternalRequest) {
    return NextResponse.next();
  }

  // Extract locale from pathname first
  const localeMatch = pathname.match(/^\/(en|es|zh)(\/.*)?$/);
  const pathWithoutLocale = localeMatch ? (localeMatch[2] || '/') : pathname;
  const detectedLocale = localeMatch ? localeMatch[1] : 'en';

  // Marketing/public pages (base paths without locale)
  const marketingPages = ['/', '/about', '/carriers', '/compare', '/professionals',
                          '/new-to-insurance', '/faq', '/contact', '/opportunity',
                          '/privacy', '/terms', '/income-disclaimer', '/login',
                          '/signup', '/admin-login'];

  // Check if this is a marketing page (checking path without locale)
  const isMarketingPage = marketingPages.includes(pathWithoutLocale) ||
                          pathWithoutLocale.startsWith('/join') ||
                          pathWithoutLocale.startsWith('/team');

  // For locale-prefixed marketing pages (e.g., /es/about), rewrite to base path
  // but set a cookie to remember the locale preference
  if (localeMatch && isMarketingPage) {
    const response = NextResponse.rewrite(new URL(pathWithoutLocale, request.url));
    // Set locale cookie so the page knows which language to display
    response.cookies.set('NEXT_LOCALE', detectedLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    return response;
  }

  // Skip i18n middleware for API routes, static files, images, and non-prefixed marketing pages
  const shouldSkipI18n = pathname.startsWith('/api') ||
                         pathname.startsWith('/_next') ||
                         pathname.startsWith('/images') ||
                         pathname.includes('/favicon.ico') ||
                         /\.(svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname) ||
                         isMarketingPage;

  const joinMatch = pathWithoutLocale.match(/^\/join\/([A-Za-z0-9]+)(\/.*)?$/);
  if (joinMatch) {
    const agentCode = joinMatch[1];
    const subPath = joinMatch[2] || '';
    const localePrefix = localeMatch ? `/${localeMatch[1]}` : '';

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
        // Redirect to /team/[username] with same sub-path, preserving locale
        const newUrl = new URL(`${localePrefix}/team/${agents[0].username}${subPath}`, request.url);
        return NextResponse.redirect(newUrl, 301); // 301 = permanent redirect for SEO
      }
    } catch {
      // If lookup fails, continue to /join/ route (fallback)
    }
  }

  // Apply i18n middleware first (unless skipped)
  let response: NextResponse;
  if (!shouldSkipI18n) {
    response = intlMiddleware(request);
  } else {
    response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  // Now handle Supabase auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Update response with cookies
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Fast session check without refreshing - NO DATABASE QUERIES
  const { data: { user } } = await supabase.auth.getUser();

  // Public routes (no auth required) - check against path without locale
  const publicRoutes = ['/login', '/signup', '/admin-login', '/join', '/team', '/'];
  const isPublicRoute = publicRoutes.some(route =>
    pathWithoutLocale === route || pathWithoutLocale.startsWith(route + '/')
  ) || pathWithoutLocale === '/';

  // Check route types using path without locale
  const isAdminRoute = pathWithoutLocale.startsWith('/admin');
  const isDashboardRoute = pathWithoutLocale.startsWith('/dashboard');

  // If no user and trying to access protected route, redirect to login
  if (!user && (isDashboardRoute || isAdminRoute)) {
    const redirectUrl = isAdminRoute ? '/admin-login' : '/login';
    // Preserve locale in redirect
    const localePrefix = localeMatch ? `/${localeMatch[1]}` : '';
    return NextResponse.redirect(new URL(`${localePrefix}${redirectUrl}`, request.url));
  }

  // If user is logged in and trying to access login/signup pages
  if (user && (pathWithoutLocale === '/login' || pathWithoutLocale === '/signup')) {
    // Redirect to dashboard - preserve locale
    const localePrefix = localeMatch ? `/${localeMatch[1]}` : '';
    return NextResponse.redirect(new URL(`${localePrefix}/dashboard`, request.url));
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
