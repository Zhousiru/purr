import { useCurrentEditingAudioPathValue } from '@/atoms/editor'
import { player } from '@/lib/player'
import { useEffect, useRef } from 'react'

export function VideoPreview() {
  const sourcePath = useCurrentEditingAudioPathValue()
  const videoRef = useRef<HTMLVideoElement>(null)

  const isVideo = !!sourcePath && sourcePath.toLowerCase().endsWith('.mp4')

  useEffect(() => {
    if (!isVideo || !videoRef.current) return
    return player.attachMediaElement(videoRef.current)
  }, [isVideo])

  if (!isVideo) return null

  return (
    <video
      ref={videoRef}
      className="bg-card w-full rounded"
      playsInline
      preload="auto"
    />
  )
}
