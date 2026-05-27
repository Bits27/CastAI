import { SignInButton, SignedIn, SignedOut } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

const steps = [
  { num: '01', title: 'Paste a YouTube link', desc: 'Drop any YouTube URL into your library. CastAI fetches the metadata and transcript automatically.' },
  { num: '02', title: 'AI extracts everything', desc: 'The video is chunked, embedded, and analysed — producing a summary, key claims, speakers, quotes, and topics.' },
  { num: '03', title: 'Ask questions', desc: 'Chat across your entire library or a specific collection. Every answer cites the exact video moment it came from.' },
]

const features = [
  {
    icon: '🎙️',
    title: 'Auto-Transcription',
    desc: 'Every video is transcribed and split into semantic chunks. Supports YouTube captions with automatic fallback.',
  },
  {
    icon: '🔍',
    title: 'Semantic Search',
    desc: 'Ask anything across your library. Vector embeddings surface the most relevant moments — not just keyword matches.',
  },
  {
    icon: '💬',
    title: 'AI Chat with Citations',
    desc: 'Llama 3.1 answers your questions and cites exact timestamps. Click any citation to jump straight there.',
  },
  {
    icon: '📚',
    title: 'Collections',
    desc: 'Organise videos into collections — a lecture series, podcast feed, or research project. Chat is scoped to each one.',
  },
  {
    icon: '🧠',
    title: 'Instant Insights',
    desc: 'Summaries, speaker detection, key claims, top quotes, and topics extracted automatically on every ingest.',
  },
  {
    icon: '▶️',
    title: 'Embedded Player',
    desc: 'Watch the clip right in the app. Citation clicks seek directly to the referenced second.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm">C</div>
          <span className="font-bold text-lg tracking-tight">CastAI</span>
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
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-28 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/40 border border-purple-700/50 text-purple-300 text-xs font-medium mb-8 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          Powered by Groq · Gemini Embeddings · Neon pgvector
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent leading-tight">
          Chat with your<br />YouTube library
        </h1>
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Paste any YouTube URL. CastAI transcribes it, extracts insights, and lets you ask
          questions across all your videos — with AI answers that link back to the exact moment.
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-8 mb-12 text-center">
          {[
            { val: 'Vector RAG', label: 'Semantic search' },
            { val: 'Groq LLM', label: 'Llama 3.1 powered' },
            { val: 'Timestamp', label: 'Cited answers' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-white">{s.val}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold text-base transition-colors shadow-lg shadow-purple-900/30">
                Start for free
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold text-base transition-colors shadow-lg shadow-purple-900/30"
            >
              Go to Dashboard
            </button>
          </SignedIn>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-3 text-white">How it works</h2>
        <p className="text-center text-gray-500 text-sm mb-12">Three steps from video to conversation.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.num} className="relative p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-4xl font-extrabold text-purple-900/60 mb-3 leading-none">{s.num}</div>
              <h3 className="font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-3 text-white">Everything you need</h2>
        <p className="text-center text-gray-500 text-sm mb-12">Built for researchers, students, and anyone who watches a lot of video.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 pb-28 text-center">
        <h2 className="text-3xl font-bold mb-4 text-white">Ready to get started?</h2>
        <p className="text-gray-400 mb-8">Free to use. No credit card required.</p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold text-base transition-colors shadow-lg shadow-purple-900/30">
              Create your library →
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold text-base transition-colors"
          >
            Go to Dashboard →
          </button>
        </SignedIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-600">
        &copy; 2026 CastAI &nbsp;·&nbsp; Built with React, Neon, Groq &amp; Gemini
      </footer>
    </div>
  )
}
