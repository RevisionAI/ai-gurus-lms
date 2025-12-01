'use client'

import { motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion'
import { useRef, MouseEvent } from 'react'
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

function CourseCard({ course }: { course: Course }) {
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 })
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 })

    function onMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect()
        x.set(clientX - left - width / 2)
        y.set(clientY - top - height / 2)
    }

    function onMouseLeave() {
        x.set(0)
        y.set(0)
    }

    const rotateX = useTransform(mouseY, [-200, 200], [10, -10])
    const rotateY = useTransform(mouseX, [-200, 200], [-10, 10])
    const transformStyle = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`

    return (
        <motion.div
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{ transform: transformStyle }}
            className="group relative h-[60vh] w-[30vw] shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:border-indigo-500/30"
        >
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black z-10" />
            {course.thumbnail ? (
                <img
                    src={course.thumbnail}
                    alt={course.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-90"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
            )}

            <div className="absolute inset-0 z-20 flex flex-col justify-end p-8">
                <span className="text-xs font-mono text-indigo-400 mb-2 drop-shadow-md">{course.code}</span>
                <h3 className="text-3xl font-bold text-white mb-4 leading-tight drop-shadow-lg">{course.name}</h3>
                <p className="text-slate-200 line-clamp-3 mb-8 text-sm leading-relaxed drop-shadow-md font-medium">
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

            {/* Shine effect */}
            <motion.div
                style={{
                    background: useMotionTemplate`radial-gradient(
                        400px circle at ${mouseX}px ${mouseY}px,
                        rgba(99, 102, 241, 0.15),
                        transparent 80%
                    )`,
                }}
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 z-30"
            />
        </motion.div>
    )
}

function YouTubeCard() {
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 })
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 })

    function onMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect()
        x.set(clientX - left - width / 2)
        y.set(clientY - top - height / 2)
    }

    function onMouseLeave() {
        x.set(0)
        y.set(0)
    }

    const rotateX = useTransform(mouseY, [-200, 200], [10, -10])
    const rotateY = useTransform(mouseX, [-200, 200], [-10, 10])
    const transformStyle = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`

    return (
        <motion.div
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{ transform: transformStyle }}
            className="group relative h-[60vh] aspect-video w-auto shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-black transition-all hover:border-indigo-500/30"
        >
            <div className="absolute inset-0 z-10 pointer-events-none rounded-3xl ring-1 ring-inset ring-white/10" />

            <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/UAaHAUY6UAI?controls=0&rel=0&modestbranding=1"
                title="AI GURUS Vision"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            />

            <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            <div className="absolute bottom-0 left-0 z-30 p-8 pointer-events-none">
                <span className="text-xs font-mono text-red-500 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    NOW PLAYING
                </span>
                <h3 className="text-3xl font-bold text-white leading-tight">Manifesto</h3>
            </div>

            {/* Shine effect */}
            <motion.div
                style={{
                    background: useMotionTemplate`radial-gradient(
                        400px circle at ${mouseX}px ${mouseY}px,
                        rgba(220, 38, 38, 0.15),
                        transparent 80%
                    )`,
                }}
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 z-30"
            />
        </motion.div>
    )
}

export default function CreativeCourseList({ courses }: { courses: Course[] }) {
    const targetRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: targetRef,
    })

    const x = useTransform(scrollYProgress, [0, 1], ['1%', '-55%'])

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
                            <CourseCard key={course.id} course={course} />
                        ))
                    )}
                    {courses.length > 0 && <YouTubeCard />}
                </motion.div>
            </div>
        </section>
    )
}

