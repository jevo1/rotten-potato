// app/login/page.tsx
import { login } from '../actions'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full bg-black font-sans text-white">
      {/* Background Image (Replace with your own image path in public folder) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2000&auto=format&fit=crop")' }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col md:flex-row">
        {/* Left Side: Marketing Text */}
        <div className="flex flex-1 flex-col justify-end p-8 md:p-16 lg:p-24">
          <h1 className="mb-4 text-4xl font-medium tracking-wide md:text-5xl lg:text-6xl">
            Welcome back to<br />
            <span className="relative inline-block">
              GamâLokal
              <span className="absolute -bottom-2 left-0 h-1 w-full bg-teal-500"></span>
            </span>
          </h1>

          <div className="mt-12 w-fit rounded-2xl bg-white/10 p-6 backdrop-blur-md border border-white/20">
            <p className="text-sm text-white/80 mb-2">Not a member yet?</p>
            <Link href="/signup" className="flex items-center text-lg font-semibold hover:text-teal-300 transition-colors">
              Sign up <span className="ml-2">→</span>
            </Link>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex w-full flex-col items-center justify-center bg-white/5 p-8 backdrop-blur-lg border-l border-white/10 md:w-[450px] lg:w-[500px]">
          <div className="w-full max-w-sm">
            <div className="mb-10 flex items-center justify-center gap-2">
              <div className="flex items-center gap-2 text-xl font-bold tracking-wider">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13.5h-13L12 6.5z"/></svg>
                GamâLokal
              </div>
            </div>

            <h2 className="mb-8 text-2xl font-medium">Log in</h2>

            <form className="space-y-5">
              <div>
                <label className="mb-1 block text-xs text-white/80">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="juan@gmail.com"
                  className="w-full rounded-full border border-white/30 bg-transparent px-5 py-3 text-sm text-white placeholder-white/50 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/80">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-full border border-white/30 bg-transparent px-5 py-3 text-sm text-white placeholder-white/50 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>

              <button
                formAction={login}
                className="mt-6 w-full rounded-full bg-white py-3 font-semibold text-teal-900 transition-colors hover:bg-gray-100"
              >
                Log in
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}