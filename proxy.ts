import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/proxy'

// The exported function must now be named 'proxy'
export async function proxy(request: NextRequest) {
  // This intercepts every page request to refresh the user's secure session cookies
  return await updateSession(request)
}

// This tells Next.js exactly which routes to run the proxy on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}