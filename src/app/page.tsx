'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import SmoothScroll from '@/components/creative/SmoothScroll'
import KineticHero from '@/components/creative/KineticHero'
import InteractiveFeatures from '@/components/creative/InteractiveFeatures'
import CreativeCourseList from '@/components/creative/CreativeCourseList'

// Dynamically import 3D components
const LiquidBrain = dynamic(() => import('@/components/creative/LiquidBrain'), {
  ssr: false,
})

interface Course {
  id: string
  name: string
  code: string
  description: string | null
  thumbnail: string | null
  semester: string | null
  year: number | null
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/courses')
        if (res.ok) {
          const data = await res.json()
          setCourses(data.slice(0, 6))
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      }
    }
    fetchCourses()
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-1 w-24 bg-white/20 overflow-hidden rounded-full">
          <div className="h-full bg-white w-1/2 animate-[shimmer_1s_infinite]" />
        </div>
      </div>
    )
  }

  if (session) return null

  return (
    <SmoothScroll>
      <div className="relative min-h-screen w-full bg-black text-white selection:bg-indigo-500 selection:text-white">
        <LiquidBrain />

        {/* Navigation */}
        <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference">
          <span className="text-xl font-bold tracking-tighter">AI GURUS</span>
          <div className="flex gap-6 text-sm font-medium tracking-wide uppercase">
            <Link href="/login" className="hover:opacity-50 transition-opacity">Login</Link>
            <Link href="/register" className="hover:opacity-50 transition-opacity">Get Started</Link>
          </div>
        </nav>

        <main>
          <KineticHero />

          <div className="relative z-10 bg-black">
            <InteractiveFeatures />
            <CreativeCourseList courses={courses} />

            {/* Final CTA */}
            <section className="relative py-48 px-6 text-center overflow-hidden">
              <div className="absolute inset-0 bg-indigo-900/20 blur-[100px] -z-10" />
              <h2 className="text-5xl md:text-8xl font-black mb-12 tracking-tighter uppercase">
                Ready to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/0">Lead?</span>
              </h2>

              <Link
                href="/register"
                className="relative inline-block px-16 py-8 bg-white text-black font-bold text-xl rounded-full overflow-hidden group hover:scale-105 transition-transform duration-300"
              >
                <span className="relative z-10">START FREE COURSE</span>
                <div className="absolute inset-0 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                <span className="absolute inset-0 z-10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">START FREE COURSE</span>
              </Link>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 px-6 bg-black">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
                <div className="font-mono">AI GURUS © {new Date().getFullYear()}</div>
                <div className="flex gap-8 uppercase tracking-widest">
                  <a href="#" className="hover:text-white transition-colors">Legal</a>
                  <a href="#" className="hover:text-white transition-colors">Privacy</a>
                  <a href="#" className="hover:text-white transition-colors">Contact</a>
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </SmoothScroll>
  )
}