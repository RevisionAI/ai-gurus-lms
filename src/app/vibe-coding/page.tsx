import Link from 'next/link'

export default function VibeCodingInfoPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-900 via-purple-900 to-black text-white overflow-auto">
      <section className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-transparent bg-clip-text">Vibe Code Academy</h1>
        <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">Learn advanced coding techniques, full-stack development, and modern programming languages. Join a vibrant community and build real-world projects with expert guidance.</p>
        <img src="/vtribe2.png" alt="Vibe Code" className="w-32 h-32 mx-auto mb-8 rounded-2xl shadow-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12 text-left">
          <div className="bg-pink-800/40 rounded-2xl p-6 border border-pink-500/30">
            <h2 className="text-2xl font-bold mb-2 text-pink-300">What You'll Learn</h2>
            <ul className="list-disc list-inside text-gray-200 space-y-2">
              <li>Modern programming languages (Python, JavaScript, more)</li>
              <li>Full-stack web development</li>
              <li>Project-based learning and teamwork</li>
              <li>Version control and deployment</li>
              <li>Career-ready coding skills</li>
            </ul>
          </div>
          <div className="bg-pink-800/40 rounded-2xl p-6 border border-pink-500/30">
            <h2 className="text-2xl font-bold mb-2 text-pink-300">Key Features</h2>
            <ul className="list-disc list-inside text-gray-200 space-y-2">
              <li>Hands-on coding challenges and projects</li>
              <li>Mentorship from industry professionals</li>
              <li>Collaborative learning environment</li>
              <li>Flexible, self-paced modules</li>
              <li>Certification upon completion</li>
            </ul>
          </div>
        </div>
        <Link href="http://localhost:3001/register" className="inline-block mt-8 px-8 py-4 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg transition">Register for Vibe Code</Link>
      </section>
    </div>
  )
} 