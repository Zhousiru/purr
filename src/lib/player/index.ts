import { convertFileSrc } from '@tauri-apps/api/core'

type PlayStateListener = (isPlaying: boolean) => void
type SeekListener = (time: number) => void
type TimeListener = (time: number) => void

type MediaSnapshot = {
  sourcePath: string | null
  currentTime: number
  isPlaying: boolean
}

class Player {
  private readonly fallbackElement: HTMLAudioElement
  private activeElement: HTMLMediaElement
  public currentSource: string | null = null

  private playStateListeners = new Set<PlayStateListener>()
  private seekListeners = new Set<SeekListener>()
  private timeListeners = new Set<TimeListener>()
  private rafId: number | null = null
  private lastEmittedTime = -1
  private unbindActiveElement: (() => void) | null = null

  constructor() {
    this.fallbackElement = new Audio()
    this.configureMediaElement(this.fallbackElement)
    this.activeElement = this.fallbackElement
    this.bindActiveElement(this.activeElement)
  }

  private configureMediaElement(element: HTMLMediaElement) {
    element.crossOrigin = ''
    element.preload = 'auto'
  }

  private bindActiveElement(element: HTMLMediaElement) {
    const handlePlayStateChange = () => this.emitPlayState()
    element.addEventListener('play', handlePlayStateChange)
    element.addEventListener('pause', handlePlayStateChange)
    this.unbindActiveElement = () => {
      element.removeEventListener('play', handlePlayStateChange)
      element.removeEventListener('pause', handlePlayStateChange)
    }
  }

  private createSnapshot(): MediaSnapshot {
    return {
      sourcePath: this.currentSource,
      currentTime: this.activeElement.currentTime,
      isPlaying: !this.activeElement.paused,
    }
  }

  private emitPlayState() {
    const isPlaying = this.isPlaying
    for (const fn of this.playStateListeners) fn(isPlaying)
  }

  private emitCurrentTime(time: number) {
    this.lastEmittedTime = time
    for (const fn of this.timeListeners) fn(time)
  }

  private setElementSource(element: HTMLMediaElement, sourcePath: string | null) {
    if (!sourcePath) {
      if (!element.getAttribute('src')) return false
      element.removeAttribute('src')
      element.load()
      return true
    }

    const nextSrc = convertFileSrc(sourcePath)
    if (element.src === nextSrc) return false
    element.src = nextSrc
    element.load()
    return true
  }

  private syncSnapshotToActiveElement(snapshot: MediaSnapshot) {
    const element = this.activeElement
    const sourceChanged = this.setElementSource(element, snapshot.sourcePath)

    if (!snapshot.sourcePath) {
      this.emitCurrentTime(0)
      this.emitPlayState()
      return
    }

    const applySnapshot = () => {
      if (this.activeElement !== element) return
      if (this.currentSource !== snapshot.sourcePath) return

      const targetTime = Math.max(0, snapshot.currentTime)
      if (Math.abs(element.currentTime - targetTime) > 0.01) {
        element.currentTime = targetTime
      }

      this.emitCurrentTime(element.currentTime)

      if (snapshot.isPlaying) {
        element.play().catch(() => this.emitPlayState())
      } else {
        this.emitPlayState()
      }
    }

    if (!sourceChanged && element.readyState >= HTMLMediaElement.HAVE_METADATA) {
      applySnapshot()
      return
    }

    const handleLoadedMetadata = () => {
      element.removeEventListener('loadedmetadata', handleLoadedMetadata)
      applySnapshot()
    }

    element.addEventListener('loadedmetadata', handleLoadedMetadata)
  }

  private swapActiveElement(nextElement: HTMLMediaElement) {
    if (this.activeElement === nextElement) return

    const snapshot = this.createSnapshot()
    const prevElement = this.activeElement

    this.unbindActiveElement?.()
    this.unbindActiveElement = null
    prevElement.pause()
    this.setElementSource(prevElement, null)

    this.configureMediaElement(nextElement)
    this.activeElement = nextElement
    this.bindActiveElement(nextElement)
    this.syncSnapshotToActiveElement(snapshot)
  }

  public attachMediaElement(element: HTMLMediaElement): () => void {
    this.swapActiveElement(element)

    return () => {
      if (this.activeElement !== element) return
      this.swapActiveElement(this.fallbackElement)
    }
  }

  public subPlayState(fn: PlayStateListener): () => void {
    this.playStateListeners.add(fn)
    fn(this.isPlaying)
    return () => {
      this.playStateListeners.delete(fn)
    }
  }

  public async load(path: string) {
    this.currentSource = path
    this.setElementSource(this.activeElement, path)
    this.emitCurrentTime(0)
    this.emitPlayState()

    if (this.activeElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      return
    }

    return new Promise<void>((resolve, reject) => {
      const element = this.activeElement

      const handleCanPlay = () => {
        cleanup()
        resolve()
      }

      const handleError = () => {
        cleanup()
        reject(new Error('Failed to load media.'))
      }

      const cleanup = () => {
        element.removeEventListener('canplay', handleCanPlay)
        element.removeEventListener('error', handleError)
      }

      element.addEventListener('canplay', handleCanPlay)
      element.addEventListener('error', handleError)
    })
  }

  public async play() {
    await this.activeElement.play()
  }

  public pause() {
    this.activeElement.pause()
    this.emitPlayState()
  }

  public async togglePlay() {
    if (this.activeElement.paused) {
      await this.play()
    } else {
      this.pause()
    }
  }

  public subSeek(fn: SeekListener): () => void {
    this.seekListeners.add(fn)
    return () => {
      this.seekListeners.delete(fn)
    }
  }

  private emitSeek(time: number) {
    for (const fn of this.seekListeners) fn(time)
  }

  public seek(time: number) {
    this.activeElement.currentTime = time
    const currentTime = this.activeElement.currentTime
    this.emitSeek(currentTime)
    this.emitCurrentTime(currentTime)
  }

  public get currentTime(): number {
    return this.activeElement.currentTime
  }

  public get isPlaying(): boolean {
    return !this.activeElement.paused
  }

  public get playbackRate(): number {
    return this.activeElement.playbackRate
  }

  public setPlaybackRate(rate: number) {
    this.activeElement.playbackRate = rate
  }

  public subCurrentTime(fn: TimeListener): () => void {
    this.timeListeners.add(fn)
    fn(this.activeElement.currentTime)
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
      const time = this.activeElement.currentTime
      if (time !== this.lastEmittedTime) {
        this.emitCurrentTime(time)
      }
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }
}

export const player = new Player()
