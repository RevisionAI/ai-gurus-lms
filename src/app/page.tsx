'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const heroTitles = [
    'Vibe Coding Essentials',
    'AI Fluency Program',
    'AI Creative Workflows',
  ];
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroTitles.length);
    }, 6000); // 6 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status === 'loading') return
    
    if (session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-pink-500"></div>
      </div>
    )
  }

  if (session) {
    return null
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white overflow-auto">
      

      {/* Hero Section */}
      <section className="w-full px-0 py-0 relative flex flex-col md:flex-row items-center justify-between gap-0 min-h-[60vh]">
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-tr from-pink-600/40 via-blue-700/30 to-transparent pointer-events-none" />
        {/* Left: Featured Course */}
        <div className="relative z-10 w-full md:w-1/2 flex flex-col gap-6 px-8 py-20 md:py-32">
          <span className="text-pink-400 font-semibold text-lg">Coming Spring 2025</span>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-2 drop-shadow-lg transition-all duration-700" key={heroIndex}>
            {heroTitles[heroIndex]}
          </h1>
          <p className="text-gray-300 text-lg mb-4 max-w-xl">A great introduction to both fundamental programming concepts and the Python programming language.</p>
          <div className="flex gap-4 mb-6">
            <Link href="/register" className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg">Start course</Link>
          </div>
        </div>
        {/* Right: Video Player instead of Unsplash Image */}
        <div className="relative z-10 w-full md:w-1/2 flex justify-center items-center min-h-[400px]">
          <div className="w-full max-w-2xl aspect-[16/9]">
            <iframe
              className="w-full h-full object-cover rounded-none md:rounded-l-3xl shadow-2xl border-4 border-blue-400/20"
              src="https://www.youtube.com/embed/UAaHAUY6UAI"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Choose Your Learning Path */}
      <section className="w-full px-4 py-16 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 border-b border-gray-700">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
            Choose Your Learning Path
          </h2>
          <p className="text-gray-300 text-lg mb-12 max-w-3xl mx-auto">
            Select from our specialized learning programs designed to advance your skills and career
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="group bg-gradient-to-br from-blue-800/40 to-cyan-900/40 rounded-3xl p-8 border border-blue-500/30 hover:border-blue-400/60 transition-all duration-300 hover:shadow-2xl hover:scale-105">
              <div className="text-center">
                <img src="/uploads/thumbnails/landi.png" alt="AI Fluency" className="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-lg" />
                <h3 className="text-2xl font-bold mb-4 text-blue-300">AI Fluency Program</h3>
                <p className="text-gray-300 mb-6">Master artificial intelligence concepts, large language models, and AI tools for business and creativity.</p>
                <Link href="/register" className="bg-blue-500/20 rounded-lg px-4 py-2 text-blue-200 font-semibold group-hover:bg-blue-500/30 transition-colors block mb-2">Access AI Fluency LMS →</Link>
                <Link href="/ai-fluency" className="inline-block mt-2 px-6 py-2 border border-blue-400 text-blue-200 rounded-lg font-semibold hover:bg-blue-500/20 transition-colors">Learn More</Link>
              </div>
            </div>
            <div className="group bg-gradient-to-br from-pink-800/40 to-purple-900/40 rounded-3xl p-8 border border-pink-500/30 hover:border-pink-400/60 transition-all duration-300 hover:shadow-2xl hover:scale-105">
              <div className="text-center">
                <img src="/vtribe2.png" alt="Vibe Code" className="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-lg" />
                <h3 className="text-2xl font-bold mb-4 text-pink-300">Vibe Code Academy</h3>
                <p className="text-gray-300 mb-6">Learn advanced coding techniques, full-stack development, and modern programming languages.</p>
                <Link href="http://localhost:3001/register" className="bg-pink-500/20 rounded-lg px-4 py-2 text-pink-200 font-semibold group-hover:bg-pink-500/30 transition-colors block mb-2">Access Vibe Code LMS →</Link>
                <Link href="/vibe-coding" className="inline-block mt-2 px-6 py-2 border border-pink-400 text-pink-200 rounded-lg font-semibold hover:bg-pink-500/20 transition-colors">Learn More</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stories & Challenges */}
      <section className="w-full px-0 py-16 bg-gradient-to-tr from-black via-gray-950 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative rounded-2xl overflow-hidden min-h-[260px] flex flex-col justify-end shadow-xl">
            <img src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80" alt="Sophie Crowdus" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            <div className="relative z-10 p-8">
              <span className="text-3xl font-extrabold mb-2 block">Sophie Crowdus</span>
              <span className="mb-2 block">From code noob to Google programmer in 6 months</span>
              <Link href="#" className="text-pink-200 font-semibold">Read the article →</Link>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden min-h-[260px] flex flex-col justify-end shadow-xl">
            <img src="https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=600&q=80" alt="Challenge for good" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            <div className="relative z-10 p-8">
              <span className="text-3xl font-extrabold mb-2 block">Challenge for good</span>
              <span className="mb-2 block">Create an app for social good in this month's challenge</span>
              <Link href="#" className="text-orange-200 font-semibold">Bring it on →</Link>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[260px] shadow-xl">
            <img src="/Logo.png" alt="User" className="w-16 h-16 rounded-full mb-2" />
            <span className="font-bold mb-1">Coding noob</span>
            <span className="text-pink-400 font-bold mb-2">170 points</span>
            <div className="flex gap-2 mb-2">
              <img src="/next.svg" alt="Badge 1" className="w-8 h-8" />
              <img src="/vercel.svg" alt="Badge 2" className="w-8 h-8" />
              <img src="/window.svg" alt="Badge 3" className="w-8 h-8" />
            </div>
            <Link href="#" className="text-pink-300 font-semibold">Show all badges & awards →</Link>
          </div>
        </div>
      </section>


      {/* --- Vibe Coding Program Spring Banner --- */}
      <section className="w-full mt-16 bg-gradient-to-r from-pink-700/80 via-blue-900/80 to-black py-16 px-0 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 px-4">
          {/* Left: Text */}
          <div className="w-full md:w-1/2 flex flex-col gap-6 z-10">
            <span className="text-blue-300 font-semibold text-lg uppercase tracking-widest">Spring 2025</span>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-2 drop-shadow-lg bg-gradient-to-r from-pink-400 via-blue-400 to-cyan-400 text-transparent bg-clip-text">Vibe Coding Program</h2>
            <p className="text-gray-200 text-lg mb-4 max-w-xl">Join our immersive Vibe Coding Program this Spring and unlock your potential! Learn modern coding skills, collaborate with peers, and build real-world projects in a vibrant, supportive community.</p>
            <div className="flex gap-4 mt-2">
              <Link href="/register" className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg">Pre-register Now</Link>
              <Link href="/courses" className="bg-gray-800/80 border border-gray-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-700 transition">Learn More</Link>
            </div>
          </div>
          {/* Right: Hero Image */}
          <div className="w-full md:w-1/2 flex justify-center items-center z-10">
            <img src="/vtribe2.png" alt="Vibe Coding Program" className="w-full max-w-md h-auto object-contain rounded-3xl shadow-2xl border-4 border-pink-400/30" />
          </div>
        </div>
        {/* Decorative Gradient Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-pink-500/20 via-blue-700/10 to-transparent" />
      </section>

      {/* Footer */}
      <footer className="w-full bg-gradient-to-r from-gray-950 via-gray-900 to-black text-gray-300 py-8 px-4 mt-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/Logo.png" alt="Vibe Tribe LMS Logo" className="h-8 w-8" />
            <span className="font-bold text-lg tracking-wide">Vibe Tribe LMS</span>
          </div>
          <nav className="flex gap-6 text-sm mt-4 md:mt-0">
            <Link href="/" className="hover:text-pink-400 transition">Home</Link>
            <Link href="/courses" className="hover:text-pink-400 transition">Courses</Link>
            <a href="mailto:info@vibetribe.ai" className="hover:text-pink-400 transition">Contact</a>
          </nav>
          <div className="text-xs text-gray-500 mt-4 md:mt-0">&copy; {new Date().getFullYear()} Vibe Tribe. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}