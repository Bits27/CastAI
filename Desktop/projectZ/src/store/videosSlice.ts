import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface VideoInsights {
  summary: string
  speakers: string[]
  keyClaims: { claim: string; timestamp: number }[]
  topQuotes: string[]
  topics: string[]
}

export interface Video {
  id: string
  userId: string
  collectionId: string | null
  youtubeId: string
  title: string | null
  channel: string | null
  thumbnailUrl: string | null
  durationSeconds: number | null
  transcriptText: string | null
  status: 'queued' | 'processing' | 'done' | 'failed'
  createdAt: string
  insights?: VideoInsights
}

interface VideosState {
  videos: Video[]
  status: 'idle' | 'loading' | 'error'
  selectedVideoIds: string[]
}

const initialState: VideosState = {
  videos: [],
  status: 'idle',
  selectedVideoIds: [],
}

export const fetchVideos = createAsyncThunk('videos/fetchAll', async () => {
  const token = await getClerkToken()
  const res = await fetch('/api/videos', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch videos')
  return res.json() as Promise<Video[]>
})

export const ingestVideo = createAsyncThunk('videos/ingest', async (url: string) => {
  const token = await getClerkToken()
  const res = await fetch('/api/videos/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to ingest video' }))
    throw new Error(err.error || 'Failed to ingest video')
  }
  return res.json() as Promise<Video>
})

export const deleteVideo = createAsyncThunk('videos/delete', async (id: string) => {
  const token = await getClerkToken()
  const res = await fetch(`/api/videos/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to delete video')
  return id
})

export const assignVideoCollection = createAsyncThunk(
  'videos/assignCollection',
  async ({ id, collectionId }: { id: string; collectionId: string | null }) => {
    const token = await getClerkToken()
    const res = await fetch(`/api/videos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ collectionId }),
    })
    if (!res.ok) throw new Error('Failed to update video')
    return res.json() as Promise<Video>
  }
)

async function getClerkToken(): Promise<string> {
  // Clerk exposes the session token via a global helper set up in ClerkProvider
  if (typeof window !== 'undefined' && (window as any).__clerkGetToken) {
    return (window as any).__clerkGetToken()
  }
  return ''
}

const videosSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    setSelectedVideoIds(state, action: PayloadAction<string[]>) {
      state.selectedVideoIds = action.payload
    },
    toggleVideoSelected(state, action: PayloadAction<string>) {
      const id = action.payload
      if (state.selectedVideoIds.includes(id)) {
        state.selectedVideoIds = state.selectedVideoIds.filter((v) => v !== id)
      } else {
        state.selectedVideoIds.push(id)
      }
    },
    updateVideoStatus(state, action: PayloadAction<{ id: string; status: Video['status'] }>) {
      const video = state.videos.find((v) => v.id === action.payload.id)
      if (video) video.status = action.payload.status
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideos.pending, (state) => { state.status = 'loading' })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.status = 'idle'
        state.videos = action.payload
      })
      .addCase(fetchVideos.rejected, (state) => { state.status = 'error' })
      .addCase(ingestVideo.pending, (state) => { state.status = 'loading' })
      .addCase(ingestVideo.fulfilled, (state, action) => {
        state.status = 'idle'
        const existing = state.videos.findIndex((v) => v.id === action.payload.id)
        if (existing >= 0) {
          state.videos[existing] = action.payload
        } else {
          state.videos.unshift(action.payload)
        }
      })
      .addCase(ingestVideo.rejected, (state) => { state.status = 'error' })
      .addCase(deleteVideo.fulfilled, (state, action) => {
        state.videos = state.videos.filter((v) => v.id !== action.payload)
        state.selectedVideoIds = state.selectedVideoIds.filter((id) => id !== action.payload)
      })
      .addCase(assignVideoCollection.fulfilled, (state, action) => {
        const idx = state.videos.findIndex((v) => v.id === action.payload.id)
        if (idx >= 0) state.videos[idx] = { ...state.videos[idx], ...action.payload }
      })
  },
})

export const { setSelectedVideoIds, toggleVideoSelected, updateVideoStatus } = videosSlice.actions
export default videosSlice.reducer
