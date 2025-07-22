import Link from 'next/link'

const features = [
  {
    title: 'Comprehensive Foundation',
    desc: 'Master the fundamentals of Large Language Models, generative AI, and the critical distinctions between classical and modern AI approaches, establishing a solid technical understanding without requiring coding expertise.'
  },
  {
    title: 'Strategic Implementation Framework',
    desc: 'Learn a proven 8-step AI implementation methodology specifically designed for executive decision-makers, enabling confident leadership of AI initiatives across your organization.'
  },
  {
    title: 'Practical Workplace Applications',
    desc: 'Gain immediate proficiency with AI workflows and tools that solve real business challenges across executive decision support, marketing, customer service, and team productivity functions.'
  },
  {
    title: 'Ethical Leadership Mastery',
    desc: 'Develop sophisticated ethical reasoning through multiple philosophical frameworks (Deontology, Utilitarianism, Virtue Ethics) applied to AI governance and decision-making scenarios.'
  },
  {
    title: 'Commercial Deployment Expertise',
    desc: 'Navigate the complex landscape of AI deployment options including open vs. closed models, cloud vs. self-hosted solutions, with comprehensive cost-benefit analysis frameworks.'
  },
  {
    title: 'Executive-Focused Content',
    desc: 'Benefit from curriculum specifically designed for C-suite executives and senior leaders, with all concepts, case studies, and applications tailored to strategic decision-making contexts.'
  },
  {
    title: 'Multimedia Learning Experience',
    desc: 'Engage with diverse learning materials including professional presentations, comprehensive lecture scripts, detailed student notes, and curated external resources from leading institutions.'
  },
  {
    title: 'Practical Assessment Model',
    desc: 'Apply learning through strategic assignments that directly address your organization\'s specific AI opportunities and challenges, creating immediate business value.'
  },
  {
    title: 'Facilitated Peer Dialogue',
    desc: 'Participate in structured discussions with fellow executives on implementation challenges, ethical considerations, and strategic applications of AI in enterprise contexts.'
  },
  {
    title: 'Immediate ROI',
    desc: 'Complete the program with actionable implementation plans, practical AI workflows, ethical frameworks, and strategic roadmaps that deliver measurable business value within weeks, not months.'
  },
];

export default function AiFluencyInfoPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white overflow-auto">
      <div className="w-full flex justify-start px-8 pt-8">
        <Link href="/" className="inline-block bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition">Home</Link>
      </div>
      {/* Video Player */}
      <section className="w-full px-0 py-0 relative flex flex-col md:flex-row items-center justify-between gap-0 min-h-[60vh]">
        <div className="absolute inset-0 z-0 bg-gradient-to-tr from-pink-600/40 via-blue-700/30 to-transparent pointer-events-none" />
        <div className="relative z-10 w-full flex flex-col gap-6 px-8 py-20 md:py-32 items-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text text-center">AI Fluency Program</h1>
          <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto text-center">
            The premier executive program for mastering AI strategy, implementation, and ethical leadership—no coding required.
          </p>
          <div className="w-full max-w-2xl aspect-[16/9] mx-auto">
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
      {/* Features Grid */}
      <section className="max-w-7xl mx-auto py-16 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-blue-800/40 rounded-2xl p-6 border border-blue-500/30 shadow-lg flex flex-col">
              <h2 className="text-xl font-bold mb-2 text-blue-200">{feature.title}</h2>
              <p className="text-gray-200 flex-1">{feature.desc}</p>
            </div>
          ))}
        </div>
        <div className="w-full flex justify-center mt-12">
          <Link href="/register" className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold rounded-lg shadow-lg transition">Register for AI Fluency</Link>
        </div>
      </section>
    </div>
  )
} 