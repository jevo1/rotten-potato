import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Declare variables at the top level so Turbopack can statically analyze them
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export async function updateSession(request: NextRequest) {
  // Validate inside the function so it throws cleanly if they are missing
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check your .env.local file."
    );
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

 const { data: { user } } = await supabase.auth.getUser();

  // --- ROUTE PROTECTION LOGIC ---
  const currentPath = request.nextUrl.pathname;

  // 1. Define your route categories
  const protectedRoutes = ['/homepage', '/settings', '/profile']; 
  const authRoutes = ['/login', '/signup'];

  // Check if the current path starts with any of the routes in our arrays
  const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));
  const isAuthRoute = authRoutes.some(route => currentPath.startsWith(route));

  // 2. Handle the Root Path (/)
  if (currentPath === '/') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = user ? '/homepage' : '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Kick guests out of private areas
  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // 4. Keep logged-in users away from auth pages
  if (user && isAuthRoute) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/homepage'; 
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}