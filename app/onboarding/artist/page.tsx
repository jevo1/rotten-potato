import { setupArtistProfile } from './actions'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function ArtistOnboardingPage() {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    // 1. Authenticate user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect('/login')
    }

    // 2. Fetch their real-time profile role from the database
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', user.id)
        .single()

    // 3. GUARD CLAUSE: If they are already an artist, skip onboarding completely!
    if (profile?.role === 'artist') {
        redirect('/dashboard')
    }

    return (
        <div className="bg-[#FCFAF8] min-h-screen w-full flex items-center justify-center p-6 font-sans text-slate-800 relative">
            
            {/* MAIN CONTAINER - Matches the exact structure of EditProfilePage */}
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                
                {/* Header Banner - Configured with the matching palette */}
                <div className="bg-[#1C4A5C] p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/logo.png"
                            alt="GamâLokal Logo"
                            width={32}
                            height={32}
                            className="object-contain brightness-0 invert"
                        />
                        <div>
                            <h1 className="text-2xl font-extrabold flex items-center gap-2">
                                GamâLokal <span className="text-orange-300 font-medium text-sm">Artist Setup</span>
                            </h1>
                            <p className="text-sm text-blue-50/80 font-medium mt-1">
                                Set up your workspace parameters to unlock the seller dashboard.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Elements - Mirroring input layout & transition animations from Edit Profile */}
                <form action={setupArtistProfile} className="p-8 space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">Specialty</label>
                            <input
                                name="specialty"
                                type="text"
                                required
                                placeholder="e.g. Oil Painting, Pottery, Weaving"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">Location (Barangay)</label>
                            <input
                                name="location"
                                type="text"
                                required
                                placeholder="e.g. Brgy. Guadalupe"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Integrated clean selection matching your profile configuration */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Price Range</label>
                        <select 
                            name="price_range" 
                            required
                            defaultValue=""
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all bg-white cursor-pointer"
                        >
                            <option value="" disabled>Select a range</option>
                            <option value="₱ - Budget Friendly (Under ₱500)">₱ - Budget Friendly (Under ₱500)</option>
                            <option value="₱₱ - Mid Range (₱500 - ₱2,000)">₱₱ - Mid Range (₱500 - ₱2,000)</option>
                            <option value="₱₱₱ - Premium (₱2,000+)">₱₱₱ - Premium (₱2,000+)</option>
                        </select>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <button 
                            type="submit" 
                            className="w-full bg-[#C87941] text-white font-bold py-3.5 rounded-full hover:bg-[#a86536] hover:shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            Complete Studio Setup &rarr;
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}