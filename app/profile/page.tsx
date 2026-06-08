import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ProfileNavBar from './ProfileNavBar'
import ProfileHeader from '@/app/src/components/ProfileHeader'
import ProfileGallery from '@/app/src/components/ProfileGallery'

export default async function ProfilePage() {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Fetch standard user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch artist details
  const { data: artistDetails } = await supabase
    .from('artist_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch follows stats
  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id)
  ])

  // Fetch artworks, posts, and reviews for the gallery
  const [{ data: artworks }, { data: posts }, { data: reviews }] = await Promise.all([
    supabase.from('artworks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('rating_reviews').select('*, users!client_id(name, avatar_url)').eq('artist_id', user.id).order('created_at', { ascending: false })
  ])

  // Calculate rating stats
  const totalReviews = reviews?.length || 0
  const avgRating = totalReviews > 0 
    ? reviews!.reduce((acc, r) => acc + r.rating, 0) / totalReviews 
    : 0

  const displayName = profile?.name || user.email?.split('@')[0] || 'User'
  const isArtist = profile?.role === 'artist'

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full flex flex-col font-sans">
      <div className="sticky top-0 z-50 w-full">
        <ProfileNavBar 
          displayName={displayName} 
          avatarUrl={profile?.avatar_url} 
          isArtist={isArtist} 
        />
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <ProfileHeader 
          profile={profile}
          artistDetails={artistDetails}
          isOwner={true}
          isFollowingInitial={false}
          followerCount={followerCount || 0}
          followingCount={followingCount || 0}
          avgRating={avgRating}
          reviewCount={totalReviews}
        />

        <div className="mt-12">
          <ProfileGallery 
            artworks={artworks || []} 
            posts={posts || []} 
            reviews={reviews || []}
            profileName={displayName}
            profileAvatar={profile?.avatar_url}
          />
        </div>
      </main>
    </div>
  )
}