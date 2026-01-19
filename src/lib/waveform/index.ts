import { getEffectiveResolution, subZoomLevel } from '@/atoms/editor'
import { cmd } from '../commands'
import { WaveformCache } from './cache'

interface WaveformOptions {
  widthScale: number
  resolution: number
  mergeChannels: boolean
  blockDuration: number
  preload: number
  fillColor: {
    r: number
    g: number
    b: number
  }
  marginBlock: number
}

const BUFFER_SCREENS = 1

export class Waveform {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private container: HTMLElement

  private options: WaveformOptions
  private audioPath: string
  private audioDuration: number

  private cache = new WaveformCache()
  private currentResolution: number
  private visibleBlockRange: { start: number; end: number } = { start: 0, end: 0 }
  private renderScheduled: boolean = false

  private scrollTop: number = 0
  private viewportHeight: number = 0
  private canvasTop: number = 0

  private resizeObserver: ResizeObserver | null = null
  private unsubZoom: (() => void) | null = null

  constructor(
    canvas: HTMLCanvasElement,
    container: HTMLElement,
    path: string,
    duration: number,
    options: WaveformOptions,
  ) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.container = container
    this.audioPath = path
    this.audioDuration = duration
    this.options = options
    this.currentResolution = getEffectiveResolution()

    this.handleScroll = this.handleScroll.bind(this)
    this.handleResize = this.handleResize.bind(this)

    this.container.addEventListener('scroll', this.handleScroll, { passive: true })
    this.resizeObserver = new ResizeObserver(this.handleResize)
    this.resizeObserver.observe(this.container)

    // Subscribe to zoom changes
    this.unsubZoom = subZoomLevel(() => {
      this.handleZoomChange()
    })

    this.handleResize()
  }

  private handleZoomChange() {
    this.currentResolution = getEffectiveResolution()
    this.scheduleRender()
  }

  private handleScroll() {
    this.scrollTop = this.container.scrollTop
    this.updateCanvasPosition()
    this.scheduleRender()
  }

  private handleResize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    const dpr = window.devicePixelRatio
    const canvasHeight = height * (1 + BUFFER_SCREENS * 2)

    this.canvas.width = Math.round(width * dpr)
    this.canvas.height = Math.round(canvasHeight * dpr)
    this.canvas.style.width = width + 'px'
    this.canvas.style.height = canvasHeight + 'px'

    this.viewportHeight = height
    this.updateCanvasPosition()
    this.scheduleRender()
  }

  private updateCanvasPosition() {
    this.canvasTop = Math.max(0, this.scrollTop - this.viewportHeight * BUFFER_SCREENS)
    this.canvas.style.top = this.canvasTop + 'px'
  }

  dispose() {
    this.container.removeEventListener('scroll', this.handleScroll)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.unsubZoom?.()
    this.cache.clear()
  }

  private render() {
    if (this.viewportHeight === 0) return

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.drawVisibleWaveform()
  }

  private scheduleRender() {
    if (this.renderScheduled) return
    this.renderScheduled = true

    requestAnimationFrame(() => {
      this.renderScheduled = false
      this.render()
    })
  }

  private drawVisibleWaveform() {
    const { startBlock, endBlock } = this.getVisibleBlockRange()
    this.visibleBlockRange = { start: startBlock, end: endBlock }

    for (let blockId = startBlock; blockId <= endBlock; blockId++) {
      this.drawBlock(blockId)

      // Load if not cached
      if (!this.cache.has(this.currentResolution, blockId)) {
        this.loadBlock(blockId)
      }
    }

    this.preloadBlocks(startBlock, endBlock)
  }

  private getVisibleBlockRange() {
    const { blockDuration, marginBlock } = this.options
    const resolution = this.currentResolution
    const dpr = window.devicePixelRatio
    const canvasHeight = this.viewportHeight * (1 + BUFFER_SCREENS * 2)

    const startTime = Math.max(
      0,
      ((this.canvasTop - marginBlock) * dpr) / resolution,
    )
    const endTime =
      ((this.canvasTop + canvasHeight - marginBlock) * dpr) / resolution

    const totalBlocks = Math.ceil(this.audioDuration / blockDuration)
    const startBlock = Math.max(0, Math.floor(startTime / blockDuration))
    const endBlock = Math.min(totalBlocks - 1, Math.ceil(endTime / blockDuration))

    return { startBlock, endBlock }
  }

  private drawBlock(blockId: number) {
    let data = this.cache.get(this.currentResolution, blockId)
    let sourceResolution = this.currentResolution

    // Fallback: use closest cached data
    if (!data) {
      const fallback = this.cache.findClosest(blockId, this.currentResolution)
      if (fallback) {
        data = fallback.data
        sourceResolution = fallback.resolution
      }
    }

    if (!data || data.length === 0) return

    const scale = this.currentResolution / sourceResolution
    const { blockDuration, marginBlock, mergeChannels } = this.options
    const dpr = window.devicePixelRatio

    const blockStartY =
      marginBlock + (blockId * blockDuration * this.currentResolution) / dpr
    const canvasY = (blockStartY - this.canvasTop) * dpr

    if (mergeChannels) {
      this.drawChannelDataScaled(data, 0, canvasY, this.canvas.width, scale)
    } else {
      const channelWidth = Math.floor(this.canvas.width / data.length)
      for (let i = 0; i < data.length; i++) {
        this.drawChannelDataScaled([data[i]], i * channelWidth, canvasY, channelWidth, scale)
      }
    }
  }

  private drawChannelDataScaled(
    data: Float32Array[],
    putX: number,
    putY: number,
    channelWidth: number,
    scale: number,
  ) {
    if (data[0].length === 0) return

    const sourceHeight = data[0].length / 2
    const targetHeight = Math.round(sourceHeight * scale)

    if (targetHeight <= 0) return

    const imageData = this.ctx.createImageData(channelWidth, targetHeight)
    const width = imageData.width
    const xCenter = channelWidth / 2

    for (let targetY = 0; targetY < targetHeight; targetY++) {
      const sourceY = Math.min(Math.floor(targetY / scale), sourceHeight - 1)

      let max = data[0][2 * sourceY]
      let min = data[0][2 * sourceY + 1]
      if (data.length > 1) {
        max = Math.max(...data.map((c) => c[2 * sourceY]))
        min = Math.min(...data.map((c) => c[2 * sourceY + 1]))
      }

      let maxX = Math.floor(
        xCenter + ((max * width) / 2) * this.options.widthScale,
      )
      let minX = Math.floor(
        xCenter + ((min * width) / 2) * this.options.widthScale,
      )

      if (maxX - minX <= 1) {
        maxX = minX = xCenter
      }

      const startIndex = (targetY * width + minX) * 4
      const endIndex = (targetY * width + maxX) * 4

      for (let i = startIndex; i <= endIndex; i += 4) {
        imageData.data[i] = this.options.fillColor.r
        imageData.data[i + 1] = this.options.fillColor.g
        imageData.data[i + 2] = this.options.fillColor.b

        if (maxX !== minX && (i === startIndex || i === endIndex)) {
          imageData.data[i + 3] = 180
        } else {
          imageData.data[i + 3] = 255
        }
      }
    }

    this.ctx.putImageData(imageData, putX, putY)
  }

  private async loadBlock(blockId: number) {
    const resolution = this.currentResolution

    if (this.cache.has(resolution, blockId)) return
    if (this.cache.isLoading(resolution, blockId)) return

    this.cache.setLoading(resolution, blockId)

    console.log('Waveform.RequestBlock', resolution, blockId)

    try {
      const result = await cmd.getAudioWaveformData({
        path: this.audioPath,
        pairPerSec: resolution,
        startSec: blockId * this.options.blockDuration,
        endSec: (blockId + 1) * this.options.blockDuration,
      })

      console.log('Waveform.ReceiveBlock', resolution, blockId)

      for (const channelResult of result) {
        if (channelResult.error) {
          throw channelResult.error
        }
      }

      this.cache.set(
        resolution,
        blockId,
        result.map((r) => new Float32Array(r.data!)),
      )

      // Only re-render if resolution matches and block is in visible range
      const { start, end } = this.visibleBlockRange
      if (
        resolution === this.currentResolution &&
        blockId >= start &&
        blockId <= end
      ) {
        this.scheduleRender()
      }
    } catch (e) {
      // Remove from loading on error
      console.error('Waveform.LoadBlockError', resolution, blockId, e)
    }
  }

  private preloadBlocks(startBlock: number, endBlock: number) {
    const { preload } = this.options
    const totalBlocks = Math.ceil(
      this.audioDuration / this.options.blockDuration,
    )

    for (let i = 1; i <= preload; i++) {
      if (startBlock - i >= 0) this.loadBlock(startBlock - i)
      if (endBlock + i < totalBlocks) this.loadBlock(endBlock + i)
    }
  }
}
