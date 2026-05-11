import { useState } from 'react'
import { useAppDispatch } from '../store/hooks'
import { ingestVideo } from '../store/videosSlice'

export default function AddVideoInput() {
  const dispatch = useAppDispatch()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || loading) return
    setError('')
    setLoading(true)
    try {
      await dispatch(ingestVideo(url.trim())).unwrap()
      setUrl('')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add video')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Adding...
            </span>
          ) : (
            'Add Video'
          )}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
