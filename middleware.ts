// SPEC: SPEC-AUTH.md > Middleware (src/middleware.ts)
// Route protection and session refresh

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }>
        ) {
          cookiesToSet.forEach(({ name, value }) =>
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

  // Refresh session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Route protection logic
  if (pathname.startsWith("/dashboard")) {
    // /dashboard/* → redirect to /login if no session
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Allow through if authenticated (distributor check happens in components)
    return response;
  }

  if (pathname.startsWith("/admin")) {
    // /admin/* → redirect to /login if no session
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is admin (not distributor) using Supabase client
    try {
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("id")
        .eq("auth_user_id", session.user.id)
        .single();

      // If not admin, redirect to dashboard (they're a distributor)
      if (!adminUser) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // Admin user - allow through
      return response;
    } catch (error) {
      // Error handled
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (pathname === "/login") {
    // /login → redirect to appropriate dashboard if already authenticated
    if (session) {
      try {
        // Check if admin or distributor using Supabase client
        const { data: adminUser } = await supabase
          .from("admin_users")
          .select("id")
          .eq("auth_user_id", session.user.id)
          .single();

        if (adminUser) {
          return NextResponse.redirect(new URL("/admin", request.url));
        }

        // Not admin, must be distributor
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (error) {
        // Error handled
        // If error, default to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  // All other routes → pass through (public)
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handle auth separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
