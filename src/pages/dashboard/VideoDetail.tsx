import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { setActiveVideo, seekTo } from '../../store/playerSlice'
import { fetchVideos } from '../../store/videosSlice'
import YouTubePlayer from '../../components/YouTubePlayer'

interface TranscriptChunk {
  content: string
  startTimeSeconds: number | null
  endTimeSeconds: number | null
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

async function getToken(): Promise<string> {
  if (typeof window !== 'undefined' && (window as any).__clerkGetToken) {
    return (window as any).__clerkGetToken()
  }
  return ''
}

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { videos, status } = useAppSelector((s) => s.videos)
  const video = videos.find((v) => v.id === id)
  const [reextracting, setReextracting] = useState(false)
  const [chunks, setChunks] = useState<TranscriptChunk[]>([])

  useEffect(() => {
    if (videos.length === 0) dispatch(fetchVideos())
  }, [])

  useEffect(() => {
    if (video) dispatch(setActiveVideo(video.youtubeId))
  }, [video?.youtubeId])

  useEffect(() => {
    if (!id) return
    getToken().then((token) =>
      fetch(`/api/videos/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => Array.isArray(data) && setChunks(data))
    )
  }, [id])

  async function handleReextract() {
    if (!id) return
    setReextracting(true)
    try {
      const token = await getToken()
      await fetch(`/api/videos/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      await dispatch(fetchVideos())
    } finally {
      setReextracting(false)
    }
  }

  if (!video) {
    if (status === 'loading' || videos.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 gap-2">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
        <p>Video not found</p>
        <button onClick={() => navigate(-1)} className="text-sm text-purple-600 hover:text-purple-800">
          ← Go back
        </button>
      </div>
    )
  }

  const insights = (video as any).insights

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-gray-800 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{video.channel}</p>
      </div>

      {/* Player */}
      <div className="aspect-video rounded-xl overflow-hidden bg-black">
        <YouTubePlayer />
      </div>

      {/* Re-extract insights if missing */}
      {!insights && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-700">Insights were not extracted for this video.</p>
          <button
            onClick={handleReextract}
            disabled={reextracting}
            className="text-sm font-medium text-amber-700 hover:text-amber-900 disabled:opacity-50"
          >
            {reextracting ? 'Extracting...' : 'Extract now'}
          </button>
        </div>
      )}

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
      {(chunks.length > 0 || video.transcriptText) && (
        <section className="p-5 rounded-xl border border-gray-200 bg-white">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Full Transcript</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {chunks.length > 0 ? chunks.map((chunk, i) => (
              <div key={i} className="flex gap-3">
                <button
                  className="text-xs font-mono text-purple-500 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded flex-shrink-0 h-fit transition-colors"
                  onClick={() => {
                    if (chunk.startTimeSeconds != null) {
                      dispatch(setActiveVideo(video.youtubeId))
                      dispatch(seekTo(chunk.startTimeSeconds))
                    }
                  }}
                >
                  {formatTime(chunk.startTimeSeconds ?? 0)}
                </button>
                <p className="text-sm text-gray-600 leading-relaxed">{chunk.content}</p>
              </div>
            )) : (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{video.transcriptText}</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
