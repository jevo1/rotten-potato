import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Absolute protection: No user, no dashboard
  if (!user) redirect('/login')

  // 2. Profile Check: Query profile_id matching your explicit schema
  const { data: artistProfile } = await supabase
    .from('artist_profiles')
    .select('profile_id') // Fixed from 'id' to prevent query failures
    .eq('user_id', user.id)
    .maybeSingle() // Safely evaluates to null if no row matches

  // If no artist profile row exists in the database, push to onboarding
  if (!artistProfile) {
    redirect('/onboarding/artist')
  }

  return <>{children}</>
}