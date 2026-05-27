import { SignInButton, SignedIn, SignedOut } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

const steps = [
  { num: '01', title: 'Paste a YouTube link', desc: 'Drop any YouTube URL. CastAI fetches the title, thumbnail, and full transcript automatically.' },
  { num: '02', title: 'AI extracts everything', desc: 'Chunks are embedded and analysed — producing a summary, speakers, key claims, quotes, and topics.' },
  { num: '03', title: 'Ask questions', desc: 'Chat across your library or a collection. Every answer cites the exact video moment it came from.' },
]

const features = [
  { icon: '🎙️', title: 'Auto-Transcription', desc: 'Transcripts fetched via Supadata and split into semantic chunks ready for vector search.' },
  { icon: '🔍', title: 'Semantic Search', desc: 'Vector embeddings surface the most relevant moments — not just keyword matches.' },
  { icon: '💬', title: 'AI Chat + Citations', desc: 'Llama 3.1 via Groq answers your questions and cites exact timestamps. Click to jump there.' },
  { icon: '📚', title: 'Collections', desc: 'Organise videos into collections. Chat and search are scoped to whichever one you choose.' },
  { icon: '🧠', title: 'Instant Insights', desc: 'Summaries, speakers, key claims, top quotes, and topics extracted on every ingest.' },
  { icon: '▶️', title: 'Embedded Player', desc: 'Watch the clip right in the app. Citation clicks seek directly to the referenced second.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#07070f] text-white overflow-x-hidden">

      {/* Animated orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="orb-a absolute top-[-200px] left-[-100px] w-[700px] h-[700px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="orb-b absolute top-[30%] right-[-150px] w-[500px] h-[500px] rounded-full bg-blue-500/15 blur-[100px]" />
        <div className="orb-c absolute bottom-[-100px] left-[30%] w-[400px] h-[400px] rounded-full bg-pink-500/10 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-900/50">C</div>
          <span className="font-bold text-lg tracking-tight">CastAI</span>
        </div>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg transition-colors backdrop-blur-sm">
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
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-32 max-w-4xl mx-auto">
        <div className="fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-purple-300 text-xs font-medium mb-8 tracking-wide backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
          Groq · Gemini Embeddings · Neon pgvector
        </div>

        <h1 className="fade-up-delay text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]">
          <span className="bg-gradient-to-br from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Chat with your
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            YouTube library
          </span>
        </h1>

        <p className="fade-up-delay-2 text-lg sm:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed">
          Paste any YouTube URL. CastAI transcribes it, extracts insights, and lets you ask
          questions — with AI answers that link back to the exact moment.
        </p>

        <div className="fade-up-delay-2 flex flex-col sm:flex-row gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60 hover:scale-[1.02]">
                Start for free →
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-purple-900/40 hover:scale-[1.02]"
            >
              Go to Dashboard →
            </button>
          </SignedIn>
        </div>

        {/* Tech pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-12">
          {['Llama 3.1 · Groq', 'pgvector · Neon', 'Gemini Embeddings', 'Clerk Auth', 'Vercel'].map((t) => (
            <span key={t} className="text-xs text-gray-500 px-3 py-1 rounded-full border border-white/5 bg-white/3">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest text-center mb-4">How it works</p>
        <h2 className="text-3xl font-bold text-center mb-16 text-white">Three steps to start chatting</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.num} className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-purple-500/30 transition-colors backdrop-blur-sm">
              <div className="text-5xl font-extrabold text-white/5 mb-3 leading-none select-none">{s.num}</div>
              <h3 className="font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest text-center mb-4">Features</p>
        <h2 className="text-3xl font-bold text-center mb-16 text-white">Everything you need</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-purple-500/30 hover:bg-white/[0.05] transition-all group">
              <div className="text-2xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 pb-28 text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-br from-purple-900/40 to-blue-900/30 border border-purple-500/20 backdrop-blur-sm">
          <h2 className="text-3xl font-bold mb-3 text-white">Ready to get started?</h2>
          <p className="text-gray-400 mb-8 text-sm">Free to use. No credit card required.</p>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-purple-900/40 hover:scale-[1.02]">
                Create your library →
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold text-base transition-all hover:scale-[1.02]"
            >
              Go to Dashboard →
            </button>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-gray-600">
        &copy; 2026 CastAI &nbsp;·&nbsp; Built with React, Neon, Groq &amp; Gemini
      </footer>
    </div>
  )
}
