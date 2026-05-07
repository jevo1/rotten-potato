import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export async function updateSession(request: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const currentPath = request.nextUrl.pathname;

  // 1. Updated route categories
  const protectedRoutes = ['/homepage', '/settings', '/profile', '/dashboard']; 
  const authRoutes = ['/login', '/signup'];

  const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));
  const isAuthRoute = authRoutes.some(route => currentPath.startsWith(route));

  // 2. Handle Root Path
  if (currentPath === '/') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = user ? '/homepage' : '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Guest protection
  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // 4. Auth route protection
  if (user && isAuthRoute) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/homepage'; 
    return NextResponse.redirect(homeUrl);
  }

  // 5. NEW: Artist Dashboard Protection
  // Redirect to onboarding if they try to access dashboard without an artist profile
  if (user && currentPath.startsWith('/dashboard')) {
    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!artistProfile) {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = '/onboarding/artist';
      return NextResponse.redirect(onboardingUrl);
    }
  }

  return supabaseResponse;
}