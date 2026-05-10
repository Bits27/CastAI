import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Video } from '../store/videosSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { toggleVideoSelected, deleteVideo } from '../store/videosSlice'
import { setActiveVideo } from '../store/playerSlice'

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
  const isSelected = useAppSelector((s) => s.videos.selectedVideoIds.includes(video.id))
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    await dispatch(deleteVideo(video.id))
  }

  return (
    <div
      className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all ${
        isSelected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 hover:border-gray-300'
      } bg-white`}
      onClick={() => dispatch(toggleVideoSelected(video.id))}
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
        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Delete overlay — visible on hover */}
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
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
          {video.title ?? video.youtubeId}
        </p>
        {video.channel && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{video.channel}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <StatusBadge status={video.status} />
          <div className="flex items-center gap-2">
            {video.status === 'done' && (
              <button
                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                onClick={(e) => {
                  e.stopPropagation()
                  dispatch(setActiveVideo(video.youtubeId))
                }}
              >
                Play
              </button>
            )}
            <button
              className="text-xs text-gray-400 hover:text-gray-700 font-medium"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/dashboard/video/${video.id}`)
              }}
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
