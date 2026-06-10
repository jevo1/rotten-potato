import { setAccountRole } from '@/app/actions/index'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function RoleSelectionPage() {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    // Authenticate user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect('/login')
    }

    return (
        <div className="bg-[#FCFAF8] min-h-screen w-full flex items-center justify-center p-6 font-sans text-slate-800 relative overflow-hidden">
            
            {/* Decorative background elements */}
            <div className="hidden md:block absolute top-0 left-0 w-96 h-96 bg-[#1C4A5C]/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
            <div className="hidden md:block absolute bottom-0 right-0 w-96 h-96 bg-[#C87941]/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

            <div className="w-full max-w-4xl relative z-10">
                <div className="text-center mb-8 md:mb-12">
                    <div className="flex justify-center mb-4 md:mb-6">
                        <Image 
                            src="/logo.png" 
                            alt="GamâLokal Logo" 
                            width={48} 
                            height={48} 
                            className="md:w-16 md:h-16 object-contain"
                        />
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black text-[#1C4A5C] mb-3 md:mb-4">Welcome to GamâLokal!</h1>
                    <p className="text-sm md:text-lg text-gray-500 max-w-lg mx-auto font-medium px-4">
                        To get started, tell us how you plan to use the platform. You can always change this later in your settings.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 px-4 md:px-0">
                    {/* Buyer Option */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-[#1C4A5C] rounded-[2rem] md:rounded-[2.5rem] translate-y-2 opacity-0 group-hover:opacity-10 transition-all"></div>
                        <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center text-center h-full">
                            <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-blue-600 transition-transform group-hover:scale-110">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-8 md:h-8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-[#1C4A5C] mb-2 md:mb-3">I want to Buy Art</h2>
                            <p className="text-xs md:text-sm text-gray-500 leading-relaxed mb-6 md:mb-8 flex-1">
                                Discover and purchase unique local masterpieces, support Baybayanon artists, and request custom commissions.
                            </p>
                            <form action={async () => {
                                'use server'
                                await setAccountRole('client')
                            }} className="w-full">
                                <button className="w-full bg-[#1C4A5C] text-white py-3.5 md:py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest shadow-lg shadow-[#1C4A5C]/20 transition-all hover:bg-[#143745] active:scale-95">
                                    Join as a Buyer
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Artist Option */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-[#C87941] rounded-[2rem] md:rounded-[2.5rem] translate-y-2 opacity-0 group-hover:opacity-10 transition-all"></div>
                        <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center text-center h-full">
                            <div className="w-14 h-14 md:w-20 md:h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-[#C87941] transition-transform group-hover:scale-110">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-8 md:h-8"><path d="m12 19 7-7 3 3-7 7-3-3Z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5Z"/><path d="m2 2 5 5"/><path d="m9.5 14.5 4 4"/></svg>
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-[#1C4A5C] mb-2 md:mb-3">I want to Sell Art</h2>
                            <p className="text-xs md:text-sm text-gray-500 leading-relaxed mb-6 md:mb-8 flex-1">
                                Showcase your portfolio, reach local and international art lovers, and manage your commissions with our seller tools.
                            </p>
                            <form action={async () => {
                                'use server'
                                await setAccountRole('artist')
                            }} className="w-full">
                                <button className="w-full bg-[#C87941] text-white py-3.5 md:py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest shadow-lg shadow-[#C87941]/20 transition-all hover:bg-[#b06a39] active:scale-95">
                                    Join as an Artist
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                        By continuing, you agree to our Terms of Service
                    </p>
                </div>
            </div>
        </div>
    )
}
