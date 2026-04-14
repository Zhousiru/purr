import { useCurrentEditingAudioPathValue } from '@/atoms/editor'
import { player } from '@/lib/player'
import { convertFileSrc } from '@tauri-apps/api/core'
import { useEffect, useRef } from 'react'

export function VideoPreview() {
  const path = useCurrentEditingAudioPathValue()
  const videoRef = useRef<HTMLVideoElement>(null)

  const isVideo = !!path && path.toLowerCase().endsWith('.mp4')

  useEffect(() => {
    if (!isVideo || !videoRef.current) return
    const v = videoRef.current

    v.muted = true
    v.src = convertFileSrc(path!)
    v.currentTime = player.currentTime
    if (player.isPlaying) v.play().catch(() => {})

    const offState = player.subPlayState((playing) => {
      if (playing) v.play().catch(() => {})
      else v.pause()
    })

    const offTime = player.subCurrentTime((t) => {
      if (Math.abs(v.currentTime - t) > 0.15) v.currentTime = t
    })

    return () => {
      offState()
      offTime()
      v.pause()
      v.removeAttribute('src')
      v.load()
    }
  }, [path, isVideo])

  if (!isVideo) return null

  return (
    <video
      ref={videoRef}
      className="bg-card w-full rounded"
      playsInline
      preload="metadata"
    />
  )
}
