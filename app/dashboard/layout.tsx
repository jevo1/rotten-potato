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

  // 2. Profile Check: Ensure they aren't skipping onboarding
  const { data: artistProfile } = await supabase
    .from('artist_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!artistProfile) {
    redirect('/onboarding/artist')
  }

  return <>{children}</>
}