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

  // --- SAFEGUARD: Check if an entry already exists for this user_id ---
  const { data: existingProfile } = await supabase
    .from('artist_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingProfile) {
    // A. If an entry already exists, update it to avoid duplicate rows!
    const { error: updateError } = await supabase
      .from('artist_profiles')
      .update({
        specialty,
        location,
        price_range: priceRange
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to modify artist profile: ${updateError.message}`);
    }
  } else {
    // B. Only create a brand new profile record if none exists yet
    const { error: insertError } = await supabase
      .from('artist_profiles')
      .insert({
        user_id: user.id,
        specialty,
        location,
        price_range: priceRange
      })

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to create artist profile: ${insertError.message}`);
    }
  }

  // 2. Safely verify/update the user role to 'artist' to unlock the dashboard
  const { error: roleError } = await supabase
    .from('users')
    .update({ role: 'artist' })
    .eq('user_id', user.id)

  if (roleError) {
    console.error('Database role error:', roleError);
    throw new Error(`Failed to update user role: ${roleError.message}`);
  }

  // 3. Redirect to the newly unlocked studio space
  redirect('/dashboard')
}