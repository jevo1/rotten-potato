import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ProfileNavBar from './ProfileNavBar' // <-- Importing our new Client Wrapper!

export default async function ProfilePage() {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  // 1. Authenticate the user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch standard user profile from public.users
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // 3. If they are an artist, fetch their specific creator details
  let artistDetails = null
  if (profile?.role === 'artist') {
    const { data: artistData } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    artistDetails = artistData
  }

  // Fallbacks for UI
  const displayName = profile?.name || user.email?.split('@')[0] || 'User'
  
  // Clean check: Only use avatar_url if it actually exists in the database
  const avatarUrl = profile?.avatar_url || null 
  
  const isArtist = profile?.role === 'artist'
  const joinDate = new Date(profile?.created_at || user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full flex flex-col font-sans">
      
      {/* Global Navigation using the Client Wrapper */}
      <div className="sticky top-0 z-50 w-full">
        <ProfileNavBar 
          displayName={displayName} 
          avatarUrl={avatarUrl} 
          isArtist={isArtist} 
        />
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-8 relative">
          
          {/* Guaranteed Banner Gradient */}
          <div className="h-32 w-full" style={{ background: 'linear-gradient(to right, #1C4A5C, #3A6A7C)' }}></div>
          
          <div className="px-8 pb-8 relative">
            
            <div className="relative -mt-12 mb-4 flex justify-between items-end">
              {/* Avatar Container */}
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
              
              <Link href="/profile/edit" className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-full transition-colors border border-gray-200 z-10">
                Edit Profile
              </Link>
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
              <p className="text-gray-500 font-medium text-sm">{user.email}</p>
              <p className="text-gray-400 text-xs mt-2 font-medium flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Joined {joinDate}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Lower Section based on Role */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Account Details / Artist Info */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Account Status Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Account Type</h2>
              
              {isArtist ? (
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col gap-1">
                    <span className="text-[#C87941] font-black text-lg">Verified Artist</span>
                    <span className="text-xs text-orange-800/70 font-medium">You have access to the creator studio.</span>
                  </div>
                  <Link 
                    href="/dashboard" 
                    className="w-full flex justify-center items-center gap-2 bg-[#1C4A5C] hover:bg-[#143745] text-white py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
                  >
                    Go to Studio Dashboard
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
                    <span className="text-gray-700 font-black text-lg">Standard Client</span>
                    <span className="text-xs text-gray-500 font-medium">You can browse, buy, and commission art.</span>
                  </div>
                  <Link 
                    href="/onboarding/artist" 
                    className="w-full flex justify-center items-center gap-2 bg-white border-2 border-[#1C4A5C] text-[#1C4A5C] hover:bg-[#f4f7f8] py-2.5 rounded-xl text-sm font-bold transition-colors"
                  >
                    Become a Seller
                  </Link>
                </div>
              )}
            </div>

            {/* Artist Public Details (Only shows if Artist) */}
            {isArtist && artistDetails && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Public Studio Info</h2>
                <ul className="space-y-3 text-sm">
                  <li className="flex flex-col">
                    <span className="text-gray-400 text-xs font-semibold uppercase">Specialty</span>
                    <span className="font-medium text-gray-900">{artistDetails.specialty}</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="text-gray-400 text-xs font-semibold uppercase">Location</span>
                    <span className="font-medium text-gray-900">{artistDetails.location}</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="text-gray-400 text-xs font-semibold uppercase">Base Price Range</span>
                    <span className="font-medium text-[#C87941]">{artistDetails.price_range}</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Activity/History */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
              <div className="flex gap-6 border-b border-gray-100 mb-6">
                <button className="pb-3 border-b-2 border-[#1C4A5C] text-[#1C4A5C] font-bold text-sm">
                  Recent Activity
                </button>
                <button className="pb-3 border-b-2 border-transparent text-gray-400 hover:text-gray-600 font-bold text-sm transition-colors">
                  Saved Items
                </button>
              </div>

              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <h3 className="font-bold text-gray-900">No recent activity</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-xs">When you interact with artworks or commission artists, your history will appear here.</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}