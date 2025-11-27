'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

export default function KineticHero() {
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start'],
    })

    const x1 = useTransform(scrollYProgress, [0, 1], [0, 200])
    const x2 = useTransform(scrollYProgress, [0, 1], [0, -200])
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

    return (
        <section ref={containerRef} className="relative h-screen w-full flex flex-col justify-center overflow-hidden">
            <div className="z-10 px-6 md:px-12 mix-blend-difference text-white">
                <motion.div style={{ x: x1, opacity }} className="mb-4">
                    <h1 className="text-[5vw] md:text-[6vw] leading-[0.9] font-black tracking-tighter uppercase">
                        Artificial-Intelligence
                    </h1>
                </motion.div>

                <motion.div style={{ x: x2, opacity }} className="flex flex-col items-end">
                    <h1 className="text-[12vw] leading-[0.9] font-black tracking-tighter uppercase text-right">
                        Fluency
                    </h1>
                    <p className="mt-8 text-xl md:text-2xl max-w-md text-right font-light tracking-wide">
                        Make confident AI decisions. <br />
                        Know when to build, buy, or walk away.
                    </p>
                </motion.div>
            </div>

            <motion.div
                style={{ opacity }}
                className="absolute bottom-12 left-6 md:left-12 z-10"
            >
                <span className="block text-sm uppercase tracking-widest mb-2">Scroll to Explore</span>
                <div className="w-12 h-[1px] bg-white/50" />
            </motion.div>
        </section>
    )
}
