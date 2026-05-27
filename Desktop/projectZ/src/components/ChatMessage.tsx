import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { ChatMessage as IChatMessage, Citation } from '../store/chatSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setActiveVideo, seekTo } from '../store/playerSlice'

interface Props {
  message: IChatMessage
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function CitationChip({ citation }: { citation: Citation }) {
  const dispatch = useAppDispatch()
  const videos = useAppSelector((s) => s.videos.videos)

  function handleClick() {
    const matched = videos.find((v) => v.id === citation.videoId)
    if (matched) dispatch(setActiveVideo(matched.youtubeId))
    dispatch(seekTo(citation.startSeconds))
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 text-xs bg-white border border-gray-200 hover:border-purple-400 hover:bg-purple-50 text-gray-600 hover:text-purple-700 px-3 py-1.5 rounded-lg shadow-sm transition-all"
      title={`Jump to ${formatTime(citation.startSeconds)}`}
    >
      <svg className="w-3 h-3 text-purple-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
      </svg>
      <span className="truncate max-w-[140px]">{citation.videoTitle}</span>
      <span className="font-mono font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded flex-shrink-0">
        {formatTime(citation.startSeconds)}
      </span>
    </button>
  )
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'
  const [showCitations, setShowCitations] = useState(false)
  const hasCitations = message.citations.length > 0

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? '' : 'w-full'}`}>
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-purple-600 text-white rounded-br-sm'
              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
          }`}
        >
          {message.content ? (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-1">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <span className="flex items-center gap-1 text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </div>

        {/* Citations toggle button */}
        {hasCitations && (
          <div className="mt-2 pl-1">
            <button
              onClick={() => setShowCitations((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-600 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {showCitations ? 'Hide' : 'Show'} sources ({message.citations.length})
            </button>

            {showCitations && (
              <div className="flex flex-wrap gap-2 mt-2">
                {message.citations.map((citation, i) => (
                  <CitationChip key={i} citation={citation} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
