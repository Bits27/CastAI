import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchVideos } from '../../store/videosSlice'
import { fetchCollections } from '../../store/collectionsSlice'
import VideoCard from '../../components/VideoCard'
import AddVideoInput from '../../components/AddVideoInput'
import CollectionsPanel from '../../components/CollectionsPanel'

export default function Library() {
  const dispatch = useAppDispatch()
  const { videos, status } = useAppSelector((s) => s.videos)
  const { activeCollectionId } = useAppSelector((s) => s.collections)
  const [search, setSearch] = useState('')

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

  const scoped = activeCollectionId
    ? videos.filter((v) => v.collectionId === activeCollectionId)
    : videos

  const filtered = scoped.filter((v) =>
    !search ||
    v.title?.toLowerCase().includes(search.toLowerCase()) ||
    v.channel?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full overflow-hidden">
      {/* Collections sidebar */}
      <aside className="w-52 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Collections</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <CollectionsPanel showAssign />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Library</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {scoped.length} video{scoped.length !== 1 ? 's' : ''}
                  {activeCollectionId ? ' in collection' : ' indexed'}
                </p>
              </div>
            </div>
            <AddVideoInput />
            {scoped.length > 6 && (
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or channel..."
                className="w-full sm:w-80 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            )}
          </div>

          {status === 'loading' && videos.length === 0 ? (
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
                  ? 'Hover a collection and click + to assign videos'
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
    </div>
  )
}
