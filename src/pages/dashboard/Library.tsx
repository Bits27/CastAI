import { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchVideos } from '../../store/videosSlice'
import { fetchCollections, setActiveCollection } from '../../store/collectionsSlice'
import { assignVideoCollection } from '../../store/videosSlice'
import VideoCard from '../../components/VideoCard'
import AddVideoInput from '../../components/AddVideoInput'
import CollectionsPanel from '../../components/CollectionsPanel'

export default function Library() {
  const dispatch = useAppDispatch()
  const { videos, status } = useAppSelector((s) => s.videos)
  const { activeCollectionId } = useAppSelector((s) => s.collections)
  const [search, setSearch] = useState('')
  const [toasts, setToasts] = useState<string[]>([])
  const prevStatusesRef = useRef<Record<string, string>>({})

  useEffect(() => {
    dispatch(fetchVideos())
    dispatch(fetchCollections())
  }, [dispatch])

  // Poll while any video is still processing
  useEffect(() => {
    const hasProcessing = videos.some((v) => v.status === 'processing' || v.status === 'queued')
    if (!hasProcessing) return
    const timer = setInterval(() => { dispatch(fetchVideos()) }, 5000)
    return () => clearInterval(timer)
  }, [videos, dispatch])

  // Toast when a video finishes processing
  useEffect(() => {
    const prev = prevStatusesRef.current
    videos.forEach((v) => {
      if ((prev[v.id] === 'processing' || prev[v.id] === 'queued') && v.status === 'done') {
        const msg = `"${v.title ?? v.youtubeId}" is ready`
        setToasts((t) => [...t, msg])
        setTimeout(() => setToasts((t) => t.filter((x) => x !== msg)), 4000)
      }
    })
    prevStatusesRef.current = Object.fromEntries(videos.map((v) => [v.id, v.status]))
  }, [videos])

  const { collections } = useAppSelector((s) => s.collections)
  const activeCollection = collections.find((c) => c.id === activeCollectionId) ?? null

  const scoped = activeCollectionId
    ? videos.filter((v) => (v.collectionIds ?? []).includes(activeCollectionId))
    : videos

  const filtered = scoped.filter((v) =>
    !search ||
    v.title?.toLowerCase().includes(search.toLowerCase()) ||
    v.channel?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Desktop collections sidebar */}
      <aside className="hidden md:flex w-52 flex-shrink-0 border-r border-gray-200 bg-white flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Collections</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <CollectionsPanel showAssign />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile collection chips */}
        <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar px-4 pt-4 pb-2 border-b border-gray-100 bg-white">
          <button
            onClick={() => dispatch(setActiveCollection(null))}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!activeCollectionId ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}
          >
            All videos
          </button>
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => dispatch(setActiveCollection(activeCollectionId === col.id ? null : col.id))}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCollectionId === col.id ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}
            >
              {col.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full">

          {/* Header */}
          {activeCollection ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => dispatch(setActiveCollection(null))}
                className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 w-fit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                All videos
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{activeCollection.name}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {scoped.length} video{scoped.length !== 1 ? 's' : ''} in this collection
                </p>
              </div>
              <AddVideoInput
                placeholder="Add a video directly to this collection..."
                onSuccess={(videoId) => {
                  dispatch(assignVideoCollection({ id: videoId, collectionIds: [activeCollectionId!] }))
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search in ${activeCollection.name}...`}
                className="w-full sm:w-80 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Library</h1>
                <p className="text-sm text-gray-500 mt-0.5">{videos.length} video{videos.length !== 1 ? 's' : ''} indexed</p>
              </div>
              <AddVideoInput />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or channel..."
                className="w-full sm:w-80 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {(status === 'loading' || status === 'idle') && videos.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-lg font-medium text-gray-700">
                {search ? 'No videos match your search' : activeCollectionId ? 'No videos in this collection' : 'No videos yet'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {search
                  ? 'Try a different search term'
                  : activeCollectionId
                  ? 'Click + on the collection to assign videos'
                  : 'Paste a YouTube link above to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
          {toasts.map((msg, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-lg animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
