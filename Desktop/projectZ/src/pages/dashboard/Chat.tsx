import { useState, useRef, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { sendMessage, clearChat } from '../../store/chatSlice'
import { fetchVideos, toggleVideoSelected } from '../../store/videosSlice'
import { fetchCollections } from '../../store/collectionsSlice'
import ChatMessageComponent from '../../components/ChatMessage'
import YouTubePlayer from '../../components/YouTubePlayer'
import CollectionsPanel from '../../components/CollectionsPanel'

export default function Chat() {
  const dispatch = useAppDispatch()
  const { messages, streaming, error } = useAppSelector((s) => s.chat)
  const { videos, selectedVideoIds } = useAppSelector((s) => s.videos)
  const { activeCollectionId } = useAppSelector((s) => s.collections)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dispatch(fetchVideos())
    dispatch(fetchCollections())
  }, [dispatch])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || streaming) return
    const q = input.trim()
    setInput('')
    await dispatch(sendMessage({
      query: q,
      videoIds: selectedVideoIds,
      collectionId: activeCollectionId ?? undefined,
    }))
  }

  const doneVideos = videos.filter((v) => v.status === 'done')

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Player</h2>
          <YouTubePlayer />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Collection filter */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Collection</h2>
            <CollectionsPanel />
          </div>

          {/* Individual video scope */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Videos</h2>
            <p className="text-xs text-gray-400 mb-2">
              {selectedVideoIds.length === 0 ? 'All videos' : `${selectedVideoIds.length} selected`}
            </p>
            {doneVideos.length === 0 ? (
              <p className="text-xs text-gray-400">No indexed videos yet. Add some in Library.</p>
            ) : (
              <div className="space-y-1">
                {doneVideos.map((video) => {
                  const isSelected = selectedVideoIds.includes(video.id)
                  return (
                    <button
                      key={video.id}
                      onClick={() => dispatch(toggleVideoSelected(video.id))}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                        isSelected ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-sm border flex-shrink-0 ${
                        isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                      }`} />
                      <span className="truncate">{video.title ?? video.youtubeId}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Chat main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
            <p className="text-xs text-gray-500">
              {selectedVideoIds.length === 0
                ? `All ${doneVideos.length} videos`
                : `${selectedVideoIds.length} of ${doneVideos.length} videos`}
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => dispatch(clearChat())}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear chat
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-gray-500 font-medium">Ask anything about your videos</p>
              <p className="text-sm text-gray-400 mt-1">
                I'll search across your library and cite exact timestamps.
              </p>
              {doneVideos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-md">
                  {[
                    'What are the main topics covered?',
                    'What are the key takeaways?',
                    'Who are the speakers?',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-purple-50 hover:text-purple-700 text-gray-600 rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessageComponent key={msg.id} message={msg} />
              ))}
              {error && (
                <div className="text-sm text-red-500 text-center">{error}</div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSend} className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={doneVideos.length === 0 ? 'Add videos to start chatting...' : 'Ask about your videos...'}
              disabled={streaming || doneVideos.length === 0}
              className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim() || doneVideos.length === 0}
              className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {streaming ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
