import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { NavBar } from '@/app/src/components/NavBar'
import ProfileHeader from '@/app/src/components/ProfileHeader'
import ProfileGallery from '@/app/src/components/ProfileGallery'

interface PageProps {
  params: {
    id: string
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  // 1. Get current user (viewer)
  const { data: { user: viewer } } = await supabase.auth.getUser()
  if (viewer?.id === id) {
    redirect('/profile')
  }

  // Fetch viewer profile for navbar
  let viewerProfile = null
  if (viewer) {
    const { data: vProfile } = await supabase
      .from('users')
      .select('name, avatar_url, role')
      .eq('user_id', viewer.id)
      .single()
    viewerProfile = vProfile
  }

  // 2. Fetch the target user profile
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', id)
    .single()

  if (error || !profile) {
    return notFound()
  }

  // 3. Fetch artist details
  const { data: artistDetails } = await supabase
    .from('artist_profiles')
    .select('*')
    .eq('user_id', id)
    .single()

  // 4. Fetch follower count
  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', id)

  // 5. Check if viewer is following
  let isFollowing = false
  if (viewer) {
    const { data: followData } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', viewer.id)
      .eq('following_id', id)
      .single()
    isFollowing = !!followData
  }

  // 6. Fetch artworks and posts for the gallery
  const [{ data: artworks }, { data: posts }] = await Promise.all([
    supabase.from('artworks').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    supabase.from('posts').select('*').eq('user_id', id).order('created_at', { ascending: false })
  ])

  // For NavBar
  const viewerName = viewerProfile?.name || viewer?.email?.split('@')[0] || 'Guest'
  const viewerAvatar = viewerProfile?.avatar_url || '/user-default.svg'

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full flex flex-col font-sans">
      <div className="sticky top-0 z-50 w-full">
        <NavBar 
          logoText="GamâLokal" 
          userName={viewerName} 
          profileImage={viewerAvatar} 
          isArtist={viewerProfile?.role === 'artist'} 
        />
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <ProfileHeader 
          profile={profile}
          artistDetails={artistDetails}
          isOwner={false}
          isFollowingInitial={isFollowing}
          followerCount={followerCount || 0}
        />

        <div className="mt-12">
          <ProfileGallery 
            artworks={artworks || []} 
            posts={posts || []} 
          />
        </div>
      </main>
    </div>
  )
}