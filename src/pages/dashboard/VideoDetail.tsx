import { useParams } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { setActiveVideo } from '../../store/playerSlice'
import YouTubePlayer from '../../components/YouTubePlayer'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const video = useAppSelector((s) => s.videos.videos.find((v) => v.id === id))

  if (!video) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Video not found
      </div>
    )
  }

  const insights = (video as any).insights

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => dispatch(setActiveVideo(video.youtubeId))}
          className="text-sm text-purple-600 hover:text-purple-800 mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          Play in sidebar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{video.channel}</p>
      </div>

      {/* Player */}
      <div className="aspect-video rounded-xl overflow-hidden bg-black">
        <YouTubePlayer />
      </div>

      {/* Insights */}
      {insights && (
        <div className="space-y-6">
          {insights.summary && (
            <section className="p-5 rounded-xl border border-gray-200 bg-white">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Summary</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{insights.summary}</p>
            </section>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.isArray(insights.topics) && insights.topics.length > 0 && (
              <section className="p-5 rounded-xl border border-gray-200 bg-white">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Topics</h2>
                <div className="flex flex-wrap gap-2">
                  {insights.topics.map((t: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {Array.isArray(insights.speakers) && insights.speakers.length > 0 && (
              <section className="p-5 rounded-xl border border-gray-200 bg-white">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Speakers</h2>
                <div className="space-y-1">
                  {insights.speakers.map((s: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-medium">
                        {s[0]?.toUpperCase()}
                      </div>
                      {s}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {Array.isArray(insights.keyClaims) && insights.keyClaims.length > 0 && (
            <section className="p-5 rounded-xl border border-gray-200 bg-white">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Key Claims</h2>
              <div className="space-y-3">
                {insights.keyClaims.map((kc: { claim: string; timestamp: number }, i: number) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-xs text-gray-400 font-mono pt-0.5 flex-shrink-0">
                      {formatTime(kc.timestamp)}
                    </span>
                    <p className="text-sm text-gray-600">{kc.claim}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {Array.isArray(insights.topQuotes) && insights.topQuotes.length > 0 && (
            <section className="p-5 rounded-xl border border-gray-200 bg-white">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Top Quotes</h2>
              <div className="space-y-3">
                {insights.topQuotes.map((q: string, i: number) => (
                  <blockquote key={i} className="border-l-2 border-purple-200 pl-4 text-sm text-gray-600 italic">
                    "{q}"
                  </blockquote>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Transcript */}
      {video.transcriptText && (
        <section className="p-5 rounded-xl border border-gray-200 bg-white">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Full Transcript</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{video.transcriptText}</p>
        </section>
      )}
    </div>
  )
}
