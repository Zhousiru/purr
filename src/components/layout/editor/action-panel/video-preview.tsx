import { player } from '@/lib/player'
import { useEffect, useRef } from 'react'

export function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!videoRef.current) return
    return player.attachMediaElement(videoRef.current)
  }, [])

  return (
    <video
      ref={videoRef}
      className="bg-card w-full"
      playsInline
      preload="auto"
    />
  )
}
