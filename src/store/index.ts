import { configureStore } from '@reduxjs/toolkit'
import videosReducer from './videosSlice'
import chatReducer, { saveChatMessages } from './chatSlice'
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

let prevMessages = store.getState().chat.messages
store.subscribe(() => {
  const messages = store.getState().chat.messages
  if (messages !== prevMessages) {
    prevMessages = messages
    saveChatMessages(messages)
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
