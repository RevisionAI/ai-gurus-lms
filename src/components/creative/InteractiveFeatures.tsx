'use client'

import { motion } from 'framer-motion'

const features = [
    {
        id: '01',
        title: 'Executive Focus',
        description: 'Content designed for decision makers, not developers. We skip the code and focus on strategy, ROI, and implementation frameworks.',
    },
    {
        id: '02',
        title: 'Live Cohorts',
        description: 'Learn with peers in interactive sessions. Network with other leaders facing the same challenges and build your AI support system.',
    },
    {
        id: '03',
        title: 'Actionable Frameworks',
        description: 'Take away tools you can use immediately. From vendor assessment scorecards to internal policy templates, we provide the toolkit.',
    },
]

export default function InteractiveFeatures() {
    return (
        <section className="relative py-32 px-6 md:px-12 bg-black z-10">
            <div className="max-w-7xl mx-auto">
                <div className="mb-24 border-b border-white/10 pb-8">
                    <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                        We don't teach AI usage. <span className="text-indigo-500">We teach AI leadership.</span>
                    </h2>
                </div>

                <div className="grid gap-32">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, delay: index * 0.2 }}
                            className="group grid md:grid-cols-[200px_1fr] gap-8 items-start"
                        >
                            <div className="relative">
                                <span className="text-8xl font-black text-white/5 group-hover:text-indigo-500/20 transition-colors duration-500">
                                    {feature.id}
                                </span>
                                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                            </div>

                            <div>
                                <h3 className="text-4xl font-light text-white mb-6 group-hover:text-indigo-400 transition-colors duration-300">
                                    {feature.title}
                                </h3>
                                <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
