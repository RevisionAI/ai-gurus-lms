'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'

interface Course {
    id: string
    name: string
    code: string
    description: string | null
    thumbnail: string | null
    semester: string | null
    year: number | null
}

export default function CreativeCourseList({ courses }: { courses: Course[] }) {
    const targetRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: targetRef,
    })

    const x = useTransform(scrollYProgress, [0, 1], ['1%', '-95%'])

    return (
        <section ref={targetRef} className="relative h-[300vh] bg-black/90">
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">
                <motion.div style={{ x }} className="flex gap-12 px-24">
                    {/* Header Card */}
                    <div className="flex h-[60vh] w-[40vw] flex-col justify-center shrink-0">
                        <h2 className="text-6xl font-bold text-white mb-6 leading-tight">
                            Curated <br />
                            <span className="text-indigo-500">Intelligence.</span>
                        </h2>
                        <p className="text-xl text-slate-400 max-w-md">
                            Access executive-grade modules designed to decode the future of business.
                        </p>
                    </div>

                    {courses.length === 0 ? (
                        // Locked Vault State
                        <div className="relative h-[60vh] w-[30vw] shrink-0 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="w-24 h-24 rounded-full border-2 border-white/20 flex items-center justify-center mb-6 group-hover:border-indigo-500/50 transition-colors duration-500">
                                <svg className="w-10 h-10 text-white/50 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Access Restricted</h3>
                            <p className="text-slate-400 text-center px-8 mb-8">
                                Cohort Q1 2026 is currently forming. Secure your position in the queue.
                            </p>
                            <Link
                                href="/register"
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full transition-colors relative z-10"
                            >
                                Join Waitlist
                            </Link>
                        </div>
                    ) : (
                        courses.map((course) => (
                            <div
                                key={course.id}
                                className="group relative h-[60vh] w-[30vw] shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:border-indigo-500/30"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10" />
                                {course.thumbnail ? (
                                    <img
                                        src={course.thumbnail}
                                        alt={course.name}
                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                                )}

                                <div className="absolute inset-0 z-20 flex flex-col justify-end p-8">
                                    <span className="text-xs font-mono text-indigo-400 mb-2">{course.code}</span>
                                    <h3 className="text-3xl font-bold text-white mb-4 leading-tight">{course.name}</h3>
                                    <p className="text-slate-300 line-clamp-3 mb-8 text-sm leading-relaxed">
                                        {course.description}
                                    </p>
                                    <Link
                                        href="/register"
                                        className="flex items-center gap-2 text-white font-medium group/link"
                                    >
                                        <span className="border-b border-transparent group-hover/link:border-indigo-500 transition-colors">Enroll Now</span>
                                        <svg className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </motion.div>
            </div>
        </section>
    )
}
