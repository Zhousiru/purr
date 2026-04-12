import { convertFileSrc } from '@tauri-apps/api/core'

type PlayStateListener = (isPlaying: boolean) => void
type TimeListener = (time: number) => void

class Player {
  private audioElement: HTMLAudioElement
  public currentSource: string | null = null

  private playStateListeners = new Set<PlayStateListener>()
  private timeListeners = new Set<TimeListener>()
  private rafId: number | null = null
  private lastEmittedTime = -1

  constructor() {
    this.audioElement = new Audio()
    this.audioElement.crossOrigin = ''
    this.audioElement.addEventListener('ended', () => this.pause())
  }

  public subPlayState(fn: PlayStateListener): () => void {
    this.playStateListeners.add(fn)
    return () => {
      this.playStateListeners.delete(fn)
    }
  }

  private emitPlayState() {
    const isPlaying = this.isPlaying
    for (const fn of this.playStateListeners) fn(isPlaying)
  }

  public async load(path: string) {
    return new Promise<void>((resolve, reject) => {
      this.currentSource = path
      this.audioElement.src = convertFileSrc(this.currentSource)

      this.audioElement.oncanplay = () => {
        this.audioElement.oncanplay = null
        this.audioElement.onerror = null
        resolve()
      }

      this.audioElement.onerror = () => {
        this.audioElement.oncanplay = null
        this.audioElement.onerror = null
        reject(new Error('Failed to load audio.'))
      }
    })
  }

  public async play() {
    await this.audioElement.play()
    this.emitPlayState()
  }

  public pause() {
    this.audioElement.pause()
    this.emitPlayState()
  }

  public async togglePlay() {
    if (this.audioElement.paused) {
      await this.play()
    } else {
      this.pause()
    }
  }

  public seek(time: number) {
    this.audioElement.currentTime = time
  }

  public get currentTime(): number {
    return this.audioElement.currentTime
  }

  public get isPlaying(): boolean {
    return !this.audioElement.paused
  }

  public subCurrentTime(fn: TimeListener): () => void {
    this.timeListeners.add(fn)
    fn(this.audioElement.currentTime)
    this.startTimeLoopIfNeeded()
    return () => {
      this.timeListeners.delete(fn)
      if (this.timeListeners.size === 0 && this.rafId !== null) {
        cancelAnimationFrame(this.rafId)
        this.rafId = null
      }
    }
  }

  private startTimeLoopIfNeeded() {
    if (this.rafId !== null) return
    const tick = () => {
      const time = this.audioElement.currentTime
      if (time !== this.lastEmittedTime) {
        this.lastEmittedTime = time
        for (const fn of this.timeListeners) fn(time)
      }
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }
}

export const player = new Player()
