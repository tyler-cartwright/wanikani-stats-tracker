import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

/**
 * One lazily-created HTMLAudioElement for the whole session. Exposing play()
 * lets the reveal handler trigger autoplay synchronously inside the user's
 * click/keydown — keeping it in the gesture chain that autoplay policies
 * require. Failures (offline, stale URL, blocked autoplay) only flag the
 * button; they never block the card flow.
 */
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  const play = useCallback((url: string) => {
    if (!audioRef.current) audioRef.current = new Audio()
    const audio = audioRef.current
    audio.src = url
    audio.play().catch(() => setFailedUrl(url))
  }, [])

  useEffect(() => {
    return () => audioRef.current?.pause()
  }, [])

  return { play, failedUrl }
}

interface AudioButtonProps {
  url: string
  onPlay: (url: string) => void
  failed: boolean
}

export function AudioButton({ url, onPlay, failed }: AudioButtonProps) {
  if (failed) {
    return (
      <span
        className="p-2 rounded-md text-ink-400 dark:text-paper-300 opacity-50"
        title="Audio unavailable"
      >
        <VolumeX className="w-5 h-5" />
      </span>
    )
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onPlay(url)
      }}
      className="p-2 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring"
      aria-label="Play pronunciation"
    >
      <Volume2 className="w-5 h-5 text-ink-400 dark:text-paper-300" />
    </button>
  )
}
