import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Log all cookies (names only for security)
  const cookieNames = allCookies.map(c => c.name);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  return NextResponse.json({
    cookieCount: allCookies.length,
    cookieNames,
    hasSession: !!session,
    hasUser: !!user,
    userId: user?.id || session?.user?.id || null,
    userEmail: user?.email || session?.user?.email || null,
    sessionError: sessionError?.message || null,
    userError: userError?.message || null,
  });
}
