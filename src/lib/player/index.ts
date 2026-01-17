import { convertFileSrc } from '@tauri-apps/api/core'
import { isServer } from '../utils/is-server'

interface PlayerCallbacks {
  onPlay: () => void
  onPause: () => void
}

class Player {
  private audioElement: HTMLAudioElement
  public currentSource: string | null = null

  public callbacks: PlayerCallbacks | null = null

  constructor() {
    this.audioElement = new Audio()
    this.audioElement.crossOrigin = ''
    this.audioElement.addEventListener('ended', () => this.pause())
  }

  public bindCallbacks(callbacks: PlayerCallbacks) {
    this.callbacks = callbacks
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
    this.callbacks?.onPlay()

    console.log('Player.PlayStart')
  }

  public pause() {
    this.audioElement.pause()
    this.callbacks?.onPause()

    console.log('Player.Pause')
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

  public subCurrentTime(fn: (time: number) => void): () => void {
    let unsubFlag = false
    let frameId: number | null = null

    const interval = () => {
      if (unsubFlag) {
        return
      }
      frameId = requestAnimationFrame(() => {
        fn(this.audioElement.currentTime)
        interval()
      })
    }
    interval()

    console.log('Player.SubCurrentTime')

    return () => {
      console.log('Player.UnsubCurrentTime')
      unsubFlag = true
      frameId && cancelAnimationFrame(frameId)
    }
  }
}

export const player = (isServer() ? null : new Player())!
