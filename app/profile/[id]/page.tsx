import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { NavBar } from '@/app/src/components/NavBar'
import Image from 'next/image'
import Link from 'next/link'

interface PageProps {
  params: {
    id: string
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  // 1. Get current user (viewer) for navigation
  const { data: { user: viewer } } = await supabase.auth.getUser()

  // 2. Fetch the target user profile from public.users
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', id)
    .single()

  if (error || !profile) {
    return notFound()
  }

  // 3. If they are an artist, fetch their specific creator details
  let artistDetails = null
  if (profile.role === 'artist') {
    const { data: artistData } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', id)
      .single()
    artistDetails = artistData
  }

  const isOwnProfile = viewer?.id === id
  const displayName = profile.name || 'User'
  const avatarUrl = profile.avatar_url || null 
  const isArtist = profile.role === 'artist'
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  // For NavBar
  const viewerName = viewer?.user_metadata?.name || viewer?.email?.split('@')[0] || 'Guest'
  const viewerAvatar = viewer?.user_metadata?.avatar_url || '/user-default.svg'

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full flex flex-col font-sans">
      {/* Global Navigation */}
      <div className="sticky top-0 z-50 w-full">
        <NavBar 
          logoText="GamâLokal" 
          userName={viewerName} 
          profileImage={viewerAvatar} 
          isArtist={viewer?.user_metadata?.role === 'artist'} 
        />
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-8 relative">
          
          <div className="h-32 w-full" style={{ background: 'linear-gradient(to right, #1C4A5C, #3A6A7C)' }}></div>
          
          <div className="px-8 pb-8 relative">
            
            <div className="relative -mt-12 mb-4 flex justify-between items-end">
              <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md shrink-0 z-10">
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-full overflow-hidden relative flex items-center justify-center">
                  {avatarUrl ? (
                    <Image 
                      src={avatarUrl} 
                      alt={displayName} 
                      width={96} 
                      height={96} 
                      className="object-cover w-full h-full" 
                    />
                  ) : (
                    <span className="text-gray-400 font-black text-3xl uppercase">
                      {displayName.charAt(0)}
                    </span>
                  )}
                </div>
              </div>
              
              {isOwnProfile ? (
                <Link href="/profile/edit" className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-full transition-colors border border-gray-200 z-10">
                  Edit Profile
                </Link>
              ) : (
                <button className="px-5 py-2 bg-[#1C4A5C] hover:bg-[#143745] text-white text-sm font-bold rounded-full transition-colors shadow-sm z-10">
                  Follow
                </button>
              )}
            </div>

            {/* Basic Info */}
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                {displayName}
                {isArtist && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#C87941" stroke="white" strokeWidth="2" className="drop-shadow-sm">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                )}
              </h1>
              <p className="text-gray-400 text-xs mt-2 font-medium flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Joined {joinDate}
              </p>
            </div>
          </div>
        </div>

        {/* Lower Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Account Type</h2>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <span className={isArtist ? "text-[#C87941] font-black text-lg" : "text-gray-700 font-black text-lg"}>
                  {isArtist ? 'Verified Artist' : 'Standard Client'}
                </span>
              </div>
            </div>

            {isArtist && artistDetails && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Studio Info</h2>
                <ul className="space-y-3 text-sm">
                  <li className="flex flex-col">
                    <span className="text-gray-400 text-xs font-semibold uppercase">Specialty</span>
                    <span className="font-medium text-gray-900">{artistDetails.specialty}</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="text-gray-400 text-xs font-semibold uppercase">Location</span>
                    <span className="font-medium text-gray-900">{artistDetails.location}</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
              <div className="flex gap-6 border-b border-gray-100 mb-6">
                <button className="pb-3 border-b-2 border-[#1C4A5C] text-[#1C4A5C] font-bold text-sm">
                  Posts
                </button>
                <button className="pb-3 border-b-2 border-transparent text-gray-400 hover:text-gray-600 font-bold text-sm transition-colors">
                  Artworks
                </button>
              </div>

              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-sm text-gray-500 italic">This section is coming soon.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
