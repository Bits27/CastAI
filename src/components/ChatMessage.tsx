import type { ChatMessage as IChatMessage, Citation } from '../store/chatSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setActiveVideo, seekTo } from '../store/playerSlice'

interface Props {
  message: IChatMessage
}

function CitationChip({ citation }: { citation: Citation }) {
  const dispatch = useAppDispatch()
  const videos = useAppSelector((s) => s.videos.videos)

  function handleClick() {
    const matched = videos.find((v) => v.title === citation.videoTitle)
    if (matched) {
      dispatch(setActiveVideo(matched.youtubeId))
    }
    dispatch(seekTo(citation.startSeconds))
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full transition-colors max-w-xs truncate"
      title={`${citation.videoTitle} @ ${Math.round(citation.startSeconds)}s`}
    >
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
      </svg>
      <span className="truncate">{citation.videoTitle}</span>
      <span className="flex-shrink-0 text-purple-500">
        {Math.floor(citation.startSeconds / 60)}:{String(Math.round(citation.startSeconds % 60)).padStart(2, '0')}
      </span>
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
          {message.content || (
            <span className="flex items-center gap-1 text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </div>
        {message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {message.citations.map((citation, i) => (
              <CitationChip key={i} citation={citation} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
