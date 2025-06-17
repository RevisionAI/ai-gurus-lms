'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-pink-500"></div>
      </div>
    )
  }

  if (session) {
    return null
  }

  return (
    <div className="min-h-screen py-8 overflow-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start justify-between gap-12 my-8">
        {/* Left side with Vtribe image and Coming Soon caption */}
        <div className="w-full md:w-1/2 relative">
          <div className="flex flex-col">
            {/* Coming Soon text in its own section */}
            <div className="mb-3 text-center">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 text-transparent bg-clip-text">Coming Soon</h3>
            </div>
            {/* Vtribe image */}
            <div className="rounded-lg overflow-hidden shadow-2xl">
              <img 
                src="/vtribe2.png" 
                alt="Vibe Tribe" 
                className="w-full h-auto object-cover" 
              />
            </div>
          </div>
        </div>

        {/* Right side with authentication options */}
        <div className="w-full md:w-1/2 bg-card-bg p-8 rounded-lg shadow-lg text-center">
          <div className="flex justify-center mb-4">
            <img src="/Logo.png" alt="Revision AI Learning Port Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 text-transparent bg-clip-text mb-6">
            Revision AI Learning Port
          </h1>
          <p className="text-lg text-white mb-8">
            A comprehensive platform designed to facilitate online, hybrid, 
            and web-enhanced teaching and learning with AI-powered features.
          </p>
          
          <div className="space-y-4">
            <Link
              href="/login"
              className="w-full inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="w-full inline-block bg-white hover:bg-gray-100 text-blue-500 font-semibold py-3 px-8 rounded-lg border border-blue-300 transition duration-200"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}