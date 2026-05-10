import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { clearSeekTarget, setPlaying } from '../store/playerSlice'

interface YTPlayer {
  loadVideoById(videoId: string): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  playVideo(): void
  destroy(): void
}

interface YTPlayerConstructor {
  new (
    el: HTMLElement,
    options: {
      width?: string | number
      height?: string | number
      videoId?: string
      playerVars?: Record<string, number | string>
      events?: {
        onStateChange?: (e: { data: number }) => void
        onReady?: () => void
      }
    }
  ): YTPlayer
}

declare global {
  interface Window {
    YT: { Player: YTPlayerConstructor }
    onYouTubeIframeAPIReady: () => void
  }
}

export default function YouTubePlayer() {
  const dispatch = useAppDispatch()
  const { activeVideoId, seekTarget } = useAppSelector((s) => s.player)
  const playerRef = useRef<YTPlayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window.YT === 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.head.appendChild(script)
      window.onYouTubeIframeAPIReady = initPlayer
    } else {
      initPlayer()
    }
    return () => {
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [])

  function initPlayer() {
    if (!containerRef.current) return
    playerRef.current = new window.YT.Player(containerRef.current, {
      width: '100%',
      height: '100%',
      videoId: '',
      playerVars: { autoplay: 0, rel: 0, modestbranding: 1 },
      events: {
        onStateChange: (event) => {
          dispatch(setPlaying(event.data === 1))
        },
      },
    })
  }

  useEffect(() => {
    if (!activeVideoId || !playerRef.current) return
    playerRef.current.loadVideoById(activeVideoId)
  }, [activeVideoId])

  useEffect(() => {
    if (seekTarget === null || !playerRef.current) return
    playerRef.current.seekTo(seekTarget, true)
    playerRef.current.playVideo()
    dispatch(clearSeekTarget())
  }, [seekTarget, dispatch])

  if (!activeVideoId) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-900 rounded-lg text-gray-500 text-xs text-center px-4">
        Select a video to play
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
