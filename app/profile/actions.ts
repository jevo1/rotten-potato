'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  let avatarUrl = null

  const avatarFile = formData.get('avatar_image') as File
  
  if (avatarFile && avatarFile.size > 0) {
    const fileExtension = avatarFile.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExtension}` // Unique filename

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(fileName, avatarFile, { upsert: true })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      throw new Error(`Failed to upload profile picture: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(uploadData.path)

    avatarUrl = publicUrl
  }

  interface UserUpdate {
    name: string;
    avatar_url?: string;
  }
  
  const userUpdateData: UserUpdate = { name }
  if (avatarUrl) {
    userUpdateData.avatar_url = avatarUrl
  }

  const { error: userError } = await supabase
    .from('users')
    .update(userUpdateData)
    .eq('user_id', user.id)

  if (userError) {
    console.error('Database error:', userError);
    throw new Error(`Failed to update user profile: ${userError.message}`);
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role === 'artist') {
    const specialty = formData.get('specialty') as string
    const location = formData.get('location') as string
    const priceRange = formData.get('price_range') as string

    await supabase
      .from('artist_profiles')
      .update({ specialty, location, price_range: priceRange })
      .eq('user_id', user.id)
  }

  revalidatePath('/profile')
  revalidatePath('/homepage')
  redirect('/profile')
}