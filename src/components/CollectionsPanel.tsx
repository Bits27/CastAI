import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  fetchCollections,
  createCollection,
  deleteCollection,
  setActiveCollection,
} from '../store/collectionsSlice'
import { assignVideoCollection } from '../store/videosSlice'

interface Props {
  /** When true shows the "assign video" dropdown on each video row */
  showAssign?: boolean
}

export default function CollectionsPanel({ showAssign = false }: Props) {
  const dispatch = useAppDispatch()
  const { collections, activeCollectionId } = useAppSelector((s) => s.collections)
  const videos = useAppSelector((s) => s.videos.videos)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    await dispatch(createCollection(newName.trim()))
    await dispatch(fetchCollections())
    setNewName('')
    setCreating(false)
  }

  return (
    <div className="space-y-1">
      {/* All videos (clear collection filter) */}
      <button
        onClick={() => dispatch(setActiveCollection(null))}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs font-medium transition-colors ${
          activeCollectionId === null
            ? 'bg-purple-50 text-purple-700'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        All videos
      </button>

      {/* Collection rows */}
      {collections.map((col) => {
        const colVideos = videos.filter((v) => v.collectionId === col.id)
        const isActive = activeCollectionId === col.id
        const isExpanded = expanded === col.id

        return (
          <div key={col.id}>
            <div
              className={`group w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => dispatch(setActiveCollection(isActive ? null : col.id))}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="flex-1 truncate">{col.name}</span>
              <span className="text-gray-400">{colVideos.length}</span>

              {showAssign && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(isExpanded ? null : col.id) }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity ml-1"
                  title="Assign videos"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm(`Delete collection "${col.name}"? Videos will be unassigned.`)) {
                    dispatch(deleteCollection(col.id))
                  }
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                title="Delete collection"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Assign videos dropdown */}
            {showAssign && isExpanded && (
              <div className="ml-5 mt-1 space-y-0.5">
                {videos.filter((v) => v.status === 'done').map((v) => {
                  const inThisCol = v.collectionId === col.id
                  return (
                    <button
                      key={v.id}
                      onClick={() =>
                        dispatch(assignVideoCollection({ id: v.id, collectionId: inThisCol ? null : col.id }))
                      }
                      className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-left transition-colors ${
                        inThisCol ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-sm border flex-shrink-0 ${
                        inThisCol ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                      }`} />
                      <span className="truncate">{v.title ?? v.youtubeId}</span>
                    </button>
                  )
                })}
                {videos.filter((v) => v.status === 'done').length === 0 && (
                  <p className="text-xs text-gray-400 px-2 py-1">No indexed videos yet</p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Create new */}
      {creating ? (
        <form onSubmit={handleCreate} className="flex gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Collection name"
            className="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
          <button type="submit" className="text-xs text-purple-600 font-medium px-1">Add</button>
          <button type="button" onClick={() => setCreating(false)} className="text-xs text-gray-400 px-1">✕</button>
        </form>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New collection
        </button>
      )}
    </div>
  )
}
