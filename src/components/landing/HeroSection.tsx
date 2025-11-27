'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function HeroSection() {
    return (
        <section className="relative w-full min-h-screen flex items-center justify-center px-6 overflow-hidden">
            <div className="max-w-7xl mx-auto w-full z-10 pt-20">
                <div className="max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium tracking-wide mb-6 backdrop-blur-sm">
                            FOR FORWARD-THINKING EXECUTIVES
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight mb-8">
                            Master the Art of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                AI Leadership
                            </span>
                        </h1>
                        <p className="text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed">
                            Make confident AI decisions for your organization. Learn when to build,
                            when to buy, and when to walk away. Our executive curriculum teaches
                            AI leadership—not just AI usage.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/register"
                                className="group relative px-8 py-4 bg-white text-slate-900 font-bold rounded-lg overflow-hidden transition-transform hover:scale-105 active:scale-95"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                                <span className="relative flex items-center gap-2">
                                    Start Learning Free
                                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
                            </Link>

                            <a
                                href="#courses"
                                className="px-8 py-4 bg-slate-800/50 text-white font-semibold rounded-lg border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all backdrop-blur-sm"
                            >
                                View Curriculum
                            </a>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Decorative gradient at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
        </section>
    )
}
