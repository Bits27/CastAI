import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface Collection {
  id: string
  userId: string
  name: string
  createdAt: string
}

interface CollectionsState {
  collections: Collection[]
  activeCollectionId: string | null
  status: 'idle' | 'loading' | 'error'
}

const initialState: CollectionsState = {
  collections: [],
  activeCollectionId: null,
  status: 'idle',
}

async function getClerkToken(): Promise<string> {
  if (typeof window !== 'undefined' && (window as any).__clerkGetToken) {
    return (window as any).__clerkGetToken()
  }
  return ''
}

export const fetchCollections = createAsyncThunk('collections/fetchAll', async () => {
  const token = await getClerkToken()
  const res = await fetch('/api/collections', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch collections')
  return res.json() as Promise<Collection[]>
})

export const createCollection = createAsyncThunk('collections/create', async (name: string) => {
  const token = await getClerkToken()
  const res = await fetch('/api/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Failed to create collection')
  return res.json() as Promise<Collection>
})

export const deleteCollection = createAsyncThunk('collections/delete', async (id: string) => {
  const token = await getClerkToken()
  const res = await fetch(`/api/collections/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to delete collection')
  return id
})

const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    setActiveCollection(state, action: PayloadAction<string | null>) {
      state.activeCollectionId = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCollections.pending, (state) => { state.status = 'loading' })
      .addCase(fetchCollections.fulfilled, (state, action) => {
        state.status = 'idle'
        state.collections = action.payload
      })
      .addCase(fetchCollections.rejected, (state) => { state.status = 'error' })
      .addCase(createCollection.fulfilled, (state, action) => {
        state.collections.push(action.payload)
      })
      .addCase(deleteCollection.fulfilled, (state, action) => {
        state.collections = state.collections.filter((c) => c.id !== action.payload)
        if (state.activeCollectionId === action.payload) state.activeCollectionId = null
      })
  },
})

export const { setActiveCollection } = collectionsSlice.actions
export default collectionsSlice.reducer
