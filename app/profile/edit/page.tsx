import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NavBar } from '@/app/src/components/NavBar'
import { updateProfile } from '../actions'
import Link from 'next/link'
import Image from 'next/image'

export default async function EditProfilePage() {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  // 1. Authenticate & Fetch Data
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', user.id)
    .single()

  let artistDetails = null
  if (profile?.role === 'artist') {
    const { data: artistData } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    artistDetails = artistData
  }

  const isArtist = profile?.role === 'artist'

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full flex flex-col font-sans">
      <div className="sticky top-0 z-50 w-full">
        <NavBar 
          logoText="GamâLokal" 
          userName={profile?.name || 'User'} 
          profileImage={profile?.avatar_url || '/user-default.svg'} 
          isArtist={isArtist} 
        />
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#1C4A5C]">Edit Profile</h1>
            <p className="text-gray-500 font-medium mt-1">Update your personal and public information.</p>
          </div>
          <Link href="/profile" className="text-sm font-bold text-gray-400 hover:text-gray-700">
            Cancel
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <form action={updateProfile} className="space-y-6">
            
            {/* Profile Picture Upload Section */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Profile Picture</h2>
              <div className="flex items-center gap-6">
                {/* Current Avatar Preview */}
                <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0 relative">
                  {profile?.avatar_url && profile.avatar_url !== '/user-default.svg' ? (
                    <Image 
                      src={profile.avatar_url} 
                      alt="Current avatar" 
                      width={80} 
                      height={80} 
                      className="object-cover w-full h-full" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">
                      {profile?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                
                {/* File Input */}
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Upload new image</label>
                  <input 
                    type="file" 
                    name="avatar_image" 
                    accept="image/*"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-bold
                      file:bg-[#1C4A5C]/10 file:text-[#1C4A5C]
                      hover:file:bg-[#1C4A5C]/20 transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-2 font-medium">Recommended: Square JPG or PNG, max 5MB.</p>
                </div>
              </div>
            </div>

            {/* Standard User Fields */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Basic Info</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    defaultValue={profile?.name || ''} 
                    required 
                    className="w-full p-3 border text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C87941] focus:border-[#C87941]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Email Address (Cannot be changed)</label>
                  <input 
                    type="email" 
                    disabled 
                    defaultValue={user.email || ''} 
                    className="w-full p-3 border border-gray-100 bg-gray-50 text-gray-400 rounded-xl cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Artist Specific Fields */}
            {isArtist && artistDetails && (
              <div className="pt-4">
                <h2 className="text-sm font-bold text-[#C87941] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Public Studio Info</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Main Specialty</label>
                    <input 
                      type="text" 
                      name="specialty" 
                      defaultValue={artistDetails.specialty || ''} 
                      required 
                      className="w-full p-3 border text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C4A5C] focus:border-[#1C4A5C]"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                      <input 
                        type="text" 
                        name="location" 
                        defaultValue={artistDetails.location || ''} 
                        required 
                        className="w-full p-3 border text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C4A5C] focus:border-[#1C4A5C]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Price Range</label>
                      <input 
                        type="text" 
                        name="price_range" 
                        defaultValue={artistDetails.price_range || ''} 
                        required 
                        className="w-full p-3 border text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C4A5C] focus:border-[#1C4A5C]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-100">
              <button 
                type="submit" 
                className="w-full bg-[#1C4A5C] hover:bg-[#143745] text-white py-3.5 rounded-xl font-bold shadow-sm transition-all hover:shadow"
              >
                Save Changes
              </button>
            </div>
            
          </form>
        </div>
      </main>
    </div>
  )
}