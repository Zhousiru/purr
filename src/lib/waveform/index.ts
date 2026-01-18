import { cmd } from '../commands'

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

const BUFFER_SCREENS = 1 // Extra screens above and below viewport

export class Waveform {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private container: HTMLElement

  private options: WaveformOptions
  private audioPath: string
  private audioDuration: number

  private waveformBlocks: Map<number, Float32Array[]> = new Map()
  private loadingBlocks: Set<number> = new Set()
  private visibleBlockRange: { start: number; end: number } = { start: 0, end: 0 }
  private renderScheduled: boolean = false

  private scrollTop: number = 0
  private viewportHeight: number = 0
  private canvasTop: number = 0 // Top position of canvas in scroll coordinates

  private resizeObserver: ResizeObserver | null = null

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

    this.handleScroll = this.handleScroll.bind(this)
    this.handleResize = this.handleResize.bind(this)

    this.container.addEventListener('scroll', this.handleScroll, { passive: true })
    this.resizeObserver = new ResizeObserver(this.handleResize)
    this.resizeObserver.observe(this.container)

    this.handleResize()
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
    this.waveformBlocks.clear()
    this.loadingBlocks.clear()
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

    // Draw visible blocks
    for (let blockId = startBlock; blockId <= endBlock; blockId++) {
      if (this.waveformBlocks.has(blockId)) {
        this.drawBlock(blockId)
      } else if (!this.loadingBlocks.has(blockId)) {
        this.loadBlock(blockId)
      }
    }

    this.preloadBlocks(startBlock, endBlock)
  }

  private getVisibleBlockRange() {
    const { blockDuration, resolution, marginBlock } = this.options
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
    const data = this.waveformBlocks.get(blockId)
    if (!data || data.length === 0) return

    const { blockDuration, resolution, marginBlock, mergeChannels } =
      this.options
    const dpr = window.devicePixelRatio

    // Canvas is positioned at canvasTop, so draw relative to that
    const blockStartY =
      marginBlock + (blockId * blockDuration * resolution) / dpr
    const canvasY = (blockStartY - this.canvasTop) * dpr

    if (mergeChannels) {
      this.drawChannelData(data, 0, canvasY, this.canvas.width)
    } else {
      const channelWidth = Math.floor(this.canvas.width / data.length)
      for (let i = 0; i < data.length; i++) {
        this.drawChannelData([data[i]], i * channelWidth, canvasY, channelWidth)
      }
    }
  }

  private drawChannelData(
    data: Float32Array[],
    putX: number,
    putY: number,
    channelWidth: number,
  ) {
    if (data[0].length === 0) return

    const height = data[0].length / 2
    const imageData = this.ctx.createImageData(channelWidth, height)

    const width = imageData.width
    const xCenter = channelWidth / 2

    for (let y = 0; y < height; y++) {
      let max = data[0][2 * y]
      let min = data[0][2 * y + 1]
      if (data.length > 1) {
        max = Math.max(...data.map((c) => c[2 * y]))
        min = Math.min(...data.map((c) => c[2 * y + 1]))
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

      const startIndex = (y * width + minX) * 4
      const endIndex = (y * width + maxX) * 4

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
    if (this.waveformBlocks.has(blockId)) return
    if (this.loadingBlocks.has(blockId)) return
    this.loadingBlocks.add(blockId)

    console.log('Waveform.RequestBlock', blockId)

    try {
      const result = await cmd.getAudioWaveformData({
        path: this.audioPath,
        pairPerSec: this.options.resolution,
        startSec: blockId * this.options.blockDuration,
        endSec: (blockId + 1) * this.options.blockDuration,
      })

      console.log('Waveform.ReceiveBlock', blockId)

      for (const channelResult of result) {
        if (channelResult.error) {
          throw channelResult.error
        }
      }

      this.waveformBlocks.set(
        blockId,
        result.map((r) => new Float32Array(r.data!)),
      )

      // Only re-render if block is in visible range (not preload)
      const { start, end } = this.visibleBlockRange
      if (blockId >= start && blockId <= end) {
        this.scheduleRender()
      }
    } finally {
      this.loadingBlocks.delete(blockId)
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
