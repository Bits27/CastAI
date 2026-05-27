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

function CitationChip({ citation, index }: { citation: Citation; index: number }) {
  const dispatch = useAppDispatch()
  const videos = useAppSelector((s) => s.videos.videos)

  function handleClick() {
    const matched = videos.find((v) => v.id === citation.videoId)
    if (matched) {
      dispatch(setActiveVideo(matched.youtubeId))
    }
    dispatch(seekTo(citation.startSeconds))
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-100 hover:border-purple-200 transition-colors group"
      title="Click to jump to this moment"
    >
      <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold flex-shrink-0 flex items-center justify-center">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 truncate">{citation.videoTitle}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 bg-purple-600 text-white text-xs font-mono px-2 py-0.5 rounded-md">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
        {formatTime(citation.startSeconds)}
      </div>
    </button>
  )
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? '' : 'w-full'}`}>
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
        {message.citations.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
              Sources
            </p>
            {message.citations.map((citation, i) => (
              <CitationChip key={i} citation={citation} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
