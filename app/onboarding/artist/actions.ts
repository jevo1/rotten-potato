'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function setupArtistProfile(formData: FormData) {
  const supabase = await createClient(cookies())

  // Get current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Extract data from the onboarding form
  const specialty = formData.get('specialty') as string
  const location = formData.get('location') as string
  const priceRange = formData.get('price_range') as string

  // 1. Create the artist profile record
  const { error: profileError } = await supabase
    .from('artist_profiles')
    .insert({
      user_id: user.id,
      specialty,
      location,
      price_range: priceRange
    })

  if (profileError) {
    console.error('Database error:', profileError);
    throw new Error(`Failed to create artist profile: ${profileError.message}`);
  }

  // 2. Update the user role to 'artist' to unlock the dashboard
  const { error: roleError } = await supabase
    .from('users')
    .update({ role: 'artist' })
    .eq('user_id', user.id)

  if (roleError) {
    console.error('Database error:', roleError);
    throw new Error(`Failed to update user role: ${roleError.message}`);
  }

  // 3. Redirect to the newly unlocked studio space
  redirect('/dashboard')
}