import { SignInButton, SignedIn, SignedOut } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

const features = [
  {
    icon: '🎙️',
    title: 'Auto-Transcription',
    desc: 'Every video is transcribed and chunked automatically. Supports captions and AI fallback.',
  },
  {
    icon: '🔍',
    title: 'Semantic Search',
    desc: 'Ask anything across your entire library. Vector embeddings find the most relevant moments.',
  },
  {
    icon: '💬',
    title: 'AI Chat with Citations',
    desc: 'Claude answers your questions and cites exact timestamps. Click to jump right there.',
  },
  {
    icon: '📚',
    title: 'Collections',
    desc: 'Organize videos into collections — a lecture series, podcast feed, or research project.',
  },
  {
    icon: '🧠',
    title: 'Instant Insights',
    desc: 'Get summaries, key claims, top quotes, and topics extracted automatically.',
  },
  {
    icon: '▶️',
    title: 'Embedded Player',
    desc: 'Watch the clip in-app. Citation clicks seek directly to the referenced moment.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm">C</div>
          <span className="font-semibold text-lg">CastAI</span>
        </div>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </SignedIn>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-700/50 text-purple-300 text-sm mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          Powered by Claude & Gemini
        </div>
        <h1 className="text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
          Chat with your
          <br />
          YouTube library
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Paste any YouTube link. CastAI transcribes it, extracts insights, and lets you ask
          questions across all your videos — with answers that link back to the exact moment.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold text-lg transition-colors">
                Start for free
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold text-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </SignedIn>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">Everything you need</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500">
        &copy; 2026 CastAI. Built with React, Neon, and Claude.
      </footer>
    </div>
  )
}
