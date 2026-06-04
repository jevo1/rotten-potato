'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  let avatarUrl = null
  let coverUrl = null

  const avatarFile = formData.get('avatar_image') as File
  const coverFile = formData.get('cover_image') as File
  
  // Avatar Upload
  if (avatarFile && avatarFile.size > 0) {
    const fileExtension = avatarFile.name.split('.').pop()
    const fileName = `${user.id}-avatar-${Date.now()}.${fileExtension}`

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

  // Cover Upload
  if (coverFile && coverFile.size > 0) {
    const fileExtension = coverFile.name.split('.').pop()
    const fileName = `${user.id}-cover-${Date.now()}.${fileExtension}`

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('covers')
      .upload(fileName, coverFile, { upsert: true })

    if (uploadError) {
      console.error('Cover upload error:', uploadError)
      throw new Error(`Failed to upload cover photo: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('covers')
      .getPublicUrl(uploadData.path)

    coverUrl = publicUrl
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
    const bio = formData.get('bio') as string
    
    const instagram = formData.get('instagram') as string
    const facebook = formData.get('facebook') as string
    const website = formData.get('website') as string
    
    const socialLinks = { instagram, facebook, website }

    const updateData: {
      specialty: string;
      location: string;
      price_range: string;
      bio: string;
      social_links: {
        instagram: string;
        facebook: string;
        website: string;
      };
      cover_url?: string;
    } = { 
      specialty, 
      location, 
      price_range: priceRange, 
      bio, 
      social_links: socialLinks 
    }
    
    if (coverUrl) {
      updateData.cover_url = coverUrl
    }

    await supabase
      .from('artist_profiles')
      .update(updateData)
      .eq('user_id', user.id)
  }

  revalidatePath('/profile')
  revalidatePath('/profile/[id]', 'page')
  revalidatePath('/homepage')
}

export async function followUser(followingId: string) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: followingId })

  if (error) {
    console.error('Follow error:', error)
    throw new Error('Failed to follow user')
  }

  revalidatePath(`/profile/${followingId}`)
}

export async function unfollowUser(followingId: string) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)

  if (error) {
    console.error('Unfollow error:', error)
    throw new Error('Failed to unfollow user')
  }

  revalidatePath(`/profile/${followingId}`)
}