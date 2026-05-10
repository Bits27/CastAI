import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

interface PlayerState {
  activeVideoId: string | null
  playing: boolean
  currentTime: number
  seekTarget: number | null
}

const initialState: PlayerState = {
  activeVideoId: null,
  playing: false,
  currentTime: 0,
  seekTarget: null,
}

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setActiveVideo(state, action: PayloadAction<string>) {
      state.activeVideoId = action.payload
      state.seekTarget = null
    },
    seekTo(state, action: PayloadAction<number>) {
      state.seekTarget = action.payload
      state.currentTime = action.payload
    },
    clearSeekTarget(state) {
      state.seekTarget = null
    },
    setPlaying(state, action: PayloadAction<boolean>) {
      state.playing = action.payload
    },
    setCurrentTime(state, action: PayloadAction<number>) {
      state.currentTime = action.payload
    },
  },
})

export const { setActiveVideo, seekTo, clearSeekTarget, setPlaying, setCurrentTime } = playerSlice.actions
export default playerSlice.reducer
