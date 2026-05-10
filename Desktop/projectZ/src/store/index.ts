import { configureStore } from '@reduxjs/toolkit'
import videosReducer from './videosSlice'
import chatReducer from './chatSlice'
import playerReducer from './playerSlice'
import collectionsReducer from './collectionsSlice'

export const store = configureStore({
  reducer: {
    videos: videosReducer,
    chat: chatReducer,
    player: playerReducer,
    collections: collectionsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
