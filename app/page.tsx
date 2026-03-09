import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col font-sans text-white">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1b5b71] via-[#3a686b] to-[#a36846]">
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* Header Navigation */}
      <header className="relative z-10 flex w-full items-center justify-between p-6 lg:px-12">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-wider text-white">
          {/* GamâLokal Logo SVG */}
          <svg className="h-8 w-8 text-[#f2a83b]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13.5h-13L12 6.5z" />
          </svg>
          GamâLokal
        </div>
        <nav className="flex items-center gap-6 font-medium">
          <Link href="/login" className="text-white/90 hover:text-[#f2a83b] transition-colors">
            Log in
          </Link>
          <Link 
            href="/signup" 
            className="rounded-full bg-white/10 px-6 py-2.5 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/20 border border-white/20"
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-6 text-center lg:px-12">
        <div className="flex max-w-3xl flex-col items-center space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          
          {/* Top Badge */}
          <div className="flex items-center gap-2 rounded-full border border-[#f2a83b] px-5 py-1.5 text-sm font-medium text-[#f2a83b]">
            <span className="text-xs">⭐</span> Baybay City's Premier Art Marketplace
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            Discover Authentic <br />
            <span className="text-[#f2a83b]">Baybayanon Art</span>
          </h1>
          
          {/* Subheadline */}
          <p className="mx-auto max-w-2xl text-lg text-white/90 sm:text-xl font-light">
            Shop unique artworks and handcrafted goods directly from local 
            artists and craftsmen of Baybay City, Leyte, Philippines.
          </p>
          
          {/* CTA Buttons  */}
          <div className="flex flex-col items-center justify-center gap-4 pt-6 sm:flex-row w-full sm:w-auto">
            <Link
              href="/signup?role=client"
              className="flex h-12 w-full items-center justify-center rounded-full bg-[#f2a83b] px-8 text-base font-bold text-zinc-900 shadow-lg transition-all hover:scale-105 hover:bg-[#ffbd59] sm:w-auto"
            >
              Shop Now
            </Link>
            <Link
              href="/signup?role=client"
              className="flex h-12 w-full items-center justify-center rounded-full border border-white/80 bg-transparent px-8 text-base font-semibold text-white transition-all hover:bg-white/10 sm:w-auto"
            >
              Request Commission
            </Link>
          </div>

          {/* Stats Section */}
          <div className="pt-14 flex items-center gap-12 sm:gap-24 text-center">
            <div>
              <div className="text-2xl font-extrabold sm:text-3xl">200+</div>
              <div className="text-xs text-white/70 sm:text-sm mt-1">Local Artists</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold sm:text-3xl">1,500+</div>
              <div className="text-xs text-white/70 sm:text-sm mt-1">Artworks</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold sm:text-3xl">3,000+</div>
              <div className="text-xs text-white/70 sm:text-sm mt-1">Happy Buyers</div>
            </div>
          </div>

        </div>
      </main>

      {/* Project Footer */}
      <footer className="relative z-10 w-full p-6 text-center text-sm text-white/40">
        <p>
          © {new Date().getFullYear()} GamâLokal. A CSci 136 project developed by Cabras, Sala, and Oreiro.
        </p>
      </footer>
    </div>
  );
}