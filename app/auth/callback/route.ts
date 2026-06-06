import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // The 'next' param is where we want to go after login (defaulting to home '/')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 1. Check if the user has a role assigned in their profile
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .maybeSingle();

      // 2. If no role is found, redirect to role selection onboarding
      if (!profile || !profile.role) {
        return NextResponse.redirect(`${origin}/onboarding/role-selection`)
      }

      // Successfully logged in! Redirect to the home page.
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there's an error, redirect back to login
  return NextResponse.redirect(`${origin}/login?error=Auth_callback_failed`)
}