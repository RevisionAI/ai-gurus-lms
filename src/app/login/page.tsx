'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        const session = await getSession()
        if (session) {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-black">
      {/* Left section - Video (1/3) */}
      <div className="w-1/3 relative overflow-hidden">
        <video 
          className="h-full w-full object-cover" 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="/Port%20sup.mov" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black opacity-40"></div>
        <div className="absolute bottom-8 left-8 text-white">
          <h2 className="text-2xl font-bold mb-2"><strong>Coming Soon</strong> - <em>Create AI videos for you ads, promos and stories</em></h2>
        </div>
      </div>
      
      {/* Right two-thirds - Sign-in form */}
      <div className="w-2/3 py-12 px-4 sm:px-6 lg:px-8 overflow-auto flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-md w-full space-y-8 bg-card-bg p-8 rounded-lg shadow-xl border border-gray-800">
          <div>
            <div className="flex justify-center mb-2">
              <img src="/Logo.png" alt="Revision AI Learning Port Logo" className="h-14 w-auto" />
            </div>
            <h1 className="text-center text-3xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 text-transparent bg-clip-text">
              Revision AI Learning Port
            </h1>
            <h2 className="mt-6 text-center text-xl text-white">
              Sign in to your account
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-white/60 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-white/60 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-md hover:opacity-90 disabled:opacity-50 transition duration-200"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-white/90">
              Don't have an account?{' '}
              <Link href="/register" className="text-pink-500 hover:text-pink-400">
                Sign up
              </Link>
            </p>
          </div>
          </form>
        </div>
        
        {/* Vibe Tribe Poster moved below the sign-in form */}
        <div className="max-w-md w-full mt-8">
          <div className="w-full text-center mb-4">
            <h2 className="text-2xl font-bold italic text-white tracking-wider bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-transparent bg-clip-text"><strong><em>Coming in Spring</em></strong></h2>
            <p className="text-lg text-white mt-1">September 2025</p>
          </div>
          <div className="w-full flex justify-center">
            <img 
              src="/vtribe2.png" 
              alt="Vibe Tribe" 
              className="w-full max-w-md object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}