import { setupArtistProfile } from './actions'
import Image from 'next/image'

export default function ArtistOnboardingPage() {
    return (
        <div className="relative min-h-screen w-full bg-black font-sans text-white flex items-center justify-center p-6">
            {/* Background Image - Matches Login */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url("/background.png")' }}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            </div>
            {/* FIXED COMPACT CONTAINER 
          max-w-[400px] keeps it narrow and "boxy" on all screens.
            */}

            {/* Modern Floating Form Card */}
            <div className="relative z-10 w-full-[1000px] max-w-xl overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
                <div className="p-8 md:p-12">
                    {/* Logo/Branding */}
                    <div className="mb-10 flex items-center gap-2 text-xl font-extrabold tracking-tight">
                        <Image
                            src="/logo.png"
                            alt="GamâLokal Logo"
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                        GamâLokal <span className="text-teal-500 font-medium text-sm ml-1">Artist Setup</span>
                    </div>

                    <h1 className="mb-2 text-4xl font-bold tracking-tight">Create your Studio</h1>
                    <p className="mb-10 text-white/60 text-sm">
                        Please provide your details to verify your artist profile and unlock the seller dashboard.
                    </p>

                    <form action={setupArtistProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-white ml-1">Specialty</label>
                                <input
                                    name="specialty"
                                    required
                                    placeholder="e.g. Digital Art"
                                    className=" w-full rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm text-white placeholder-white/30 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-white ml-1">Location</label>
                                <input
                                    name="location"
                                    required
                                    placeholder="e.g. Manila, PH"
                                    className="w-full rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm text-white placeholder-white/30 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-white ml-1">Starting Price Range</label>
                            <input
                                name="price_range"
                                required
                                placeholder="e.g. ₱500 - ₱5,000"
                                className="w-full rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm text-white placeholder-white/30 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="group relative w-full overflow-hidden rounded-full bg-white py-4 font-bold text-teal-900 transition-all hover:bg-teal-50"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Complete Profile <span className="transition-transform group-hover:translate-x-1">→</span>
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}