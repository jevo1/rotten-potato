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
      // Successfully logged in! Redirect to the home page.
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there's an error, redirect back to login
  return NextResponse.redirect(`${origin}/login?error=Auth_callback_failed`)
}