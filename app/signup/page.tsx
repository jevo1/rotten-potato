import { signup, signInWithGoogle } from '@/app/actions/index'
import Link from 'next/link'
import Image from 'next/image'

export default function SignupPage({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error;

  return (
    <div className="relative min-h-screen w-full bg-black font-sans text-white">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/background.png")' }} 
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col md:flex-row">
        {/* Left Side: Marketing Text */}
        <div className="flex flex-1 flex-col justify-end p-8 md:p-16 lg:p-24">
          <h1 className="mb-4 text-5xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
            It&apos;s time to boost<br />
            <span className="relative inline-block mt-2">
              your creativity
              <span className="absolute -bottom-2 left-0 h-1.5 w-full bg-teal-500"></span>
            </span>
          </h1>

          <div className="mt-12 w-fit rounded-2xl bg-white/10 p-6 backdrop-blur-md border border-white/20">
            <p className="text-sm text-white/80 mb-2 font-medium">Already a member?</p>
            <Link href="/login" className="flex items-center text-lg font-bold hover:text-teal-300 transition-colors">
              Sign in <span className="ml-2">→</span>
            </Link>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex w-full flex-col items-center justify-center bg-white/5 p-8 backdrop-blur-lg border-l border-white/10 md:w-[450px] lg:w-[500px]">
          <div className="w-full max-w-sm">
            <div className="mb-10 flex items-center justify-center gap-2">
                      <div className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
                          <Image 
                            src="/logo.png" 
                            alt="GamâLokal Logo" 
                            width={40} 
                            height={40} 
                            className="object-contain"
                          />
                          GamâLokal 
                       </div>
            </div>

            <h2 className="mb-8 text-3xl font-bold tracking-tight">Sign up</h2>

            {error && (
              <div className="mb-6 rounded-xl bg-red-500/20 border border-red-500/50 p-4 text-sm text-red-200">
                <p className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </p>
              </div>
            )}

            <form className="space-y-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">Full name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Juan dela Cruz"
                  className="w-full rounded-full border border-white/30 bg-transparent px-5 py-3 text-sm text-white placeholder-white/50 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="juan@gmail.com"
                  className="w-full rounded-full border border-white/30 bg-transparent px-5 py-3 text-sm text-white placeholder-white/50 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-full border border-white/30 bg-transparent px-5 py-3 text-sm text-white placeholder-white/50 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>

              {/* Role Selection */}
              <div className="flex items-center justify-between pt-2 px-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="role" value="client" defaultChecked className="h-4 w-4 accent-teal-500" />
                  <span className="text-sm font-medium text-white/90">I want to Buy Art</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="role" value="artist" className="h-4 w-4 accent-teal-500" />
                  <span className="text-sm font-medium text-white/90">I want to Sell Art</span>
                </label>
              </div>

              <button
                formAction={signup}
                className="mt-4 w-full rounded-full bg-white py-3 font-bold text-teal-900 transition-colors hover:bg-gray-100"
              >
                Create account
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="h-px flex-1 bg-white/20"></div>
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Or continue with</span>
              <div className="h-px flex-1 bg-white/20"></div>
            </div>

            <form action={signInWithGoogle} className="mt-6">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-full border border-white/30 bg-white/5 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 hover:border-white/50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}