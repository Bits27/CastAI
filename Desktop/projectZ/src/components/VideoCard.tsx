import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Video } from '../store/videosSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { deleteVideo, ingestVideo, assignVideoCollection } from '../store/videosSlice'

interface Props {
  video: Video
}

function StatusBadge({ status }: { status: Video['status'] }) {
  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Ready
      </span>
    )
  }
  if (status === 'processing' || status === 'queued') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Processing
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Failed
    </span>
  )
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function VideoCard({ video }: Props) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const collections = useAppSelector((s) => s.collections.collections)
  const videoCollection = collections.find((c) => c.id === video.collectionId) ?? null
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    await dispatch(deleteVideo(video.id))
  }

  async function handleRetry(e: React.MouseEvent) {
    e.stopPropagation()
    setRetrying(true)
    await dispatch(deleteVideo(video.id))
    await dispatch(ingestVideo(`https://youtube.com/watch?v=${video.youtubeId}`))
    setRetrying(false)
  }

  return (
    <div
      className="group relative rounded-xl overflow-hidden border border-gray-200 hover:border-purple-300 hover:shadow-md cursor-pointer transition-all flex flex-col bg-white"
      onClick={() => navigate(`/dashboard/video/${video.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title ?? ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-4 5-4v8zm-5-8l5 4-5 4V9z" />
            </svg>
          </div>
        )}
        {video.durationSeconds && (
          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(video.durationSeconds)}
          </span>
        )}

        {/* Delete overlay */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {confirming ? (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-medium disabled:opacity-50"
              >
                {deleting ? '...' : 'Confirm'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirming(false) }}
                className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              className="text-xs bg-black/50 hover:bg-red-600 text-white px-2 py-0.5 rounded transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
            {video.title ?? video.youtubeId}
          </p>
          {video.channel && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{video.channel}</p>
          )}
          {videoCollection && (
            <span className="inline-flex items-center gap-1 text-xs text-purple-600 mt-0.5 truncate">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              {videoCollection.name}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <StatusBadge status={video.status} />
          <div className="flex items-center gap-2">
            {video.status === 'failed' && (
              <button
                className="text-xs text-amber-600 hover:text-amber-800 font-medium disabled:opacity-50"
                disabled={retrying}
                onClick={handleRetry}
              >
                {retrying ? 'Retrying...' : 'Retry'}
              </button>
            )}
            <div className="relative" ref={pickerRef}>
              <button
                className="text-xs text-gray-400 hover:text-gray-700"
                onClick={(e) => { e.stopPropagation(); setShowCollectionPicker((v) => !v) }}
                title="Add to collection"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>
              {showCollectionPicker && (
                <div
                  className="absolute bottom-6 right-0 z-20 w-44 bg-white rounded-xl border border-gray-200 shadow-lg py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs text-gray-400 px-3 py-1.5 border-b border-gray-100">Add to collection</p>
                  {collections.length === 0 && (
                    <p className="text-xs text-gray-400 px-3 py-2">No collections yet</p>
                  )}
                  {video.collectionId && (
                    <button
                      onClick={() => { dispatch(assignVideoCollection({ id: video.id, collectionId: null })); setShowCollectionPicker(false) }}
                      className="w-full text-left text-xs px-3 py-1.5 text-red-500 hover:bg-red-50"
                    >
                      Remove from collection
                    </button>
                  )}
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => { dispatch(assignVideoCollection({ id: video.id, collectionId: col.id })); setShowCollectionPicker(false) }}
                      className={`w-full text-left text-xs px-3 py-1.5 hover:bg-purple-50 hover:text-purple-700 ${video.collectionId === col.id ? 'text-purple-600 font-medium' : 'text-gray-700'}`}
                    >
                      {video.collectionId === col.id ? '✓ ' : ''}{col.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
