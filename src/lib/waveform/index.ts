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
}

interface WaveformHooks {
  onLoaded: (duration: number) => void
  onSizeUpdate: (w: number, h: number) => void
}

export class Waveform {
  private containerRef: HTMLDivElement
  private canvasRef: HTMLCanvasElement
  private canvasCtx: CanvasRenderingContext2D

  private options: WaveformOptions
  private hooks: WaveformHooks

  private audioPath: string | null = null
  private audioDuration: number | null = null
  private waveformBlocks: Array<Float32Array[]> | null = null

  private drawnBlocks = new Set<number>()

  constructor(
    containerRef: HTMLDivElement,
    canvasRef: HTMLCanvasElement,
    options: WaveformOptions,
    hooks: WaveformHooks,
  ) {
    this.containerRef = containerRef
    this.canvasRef = canvasRef
    this.options = options
    this.hooks = hooks

    const ctx = this.canvasRef.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context not supported.')
    this.canvasCtx = ctx

    this.containerRef.addEventListener('scroll', this.displayVisibleBlocks)
    this.resizeObserver.observe(this.containerRef)
  }

  public async load(path: string) {
    if (this.audioPath !== null) {
      throw new Error('Waveform already loaded.')
    }

    console.log('Waveform.Load', path)

    this.audioPath = path
    this.audioDuration = await this.getDuration()

    console.log('Waveform.Duration', this.audioDuration)

    const blockCount = Math.ceil(
      this.audioDuration / this.options.blockDuration,
    )
    this.waveformBlocks = Array(blockCount).fill([])
    this.updateSize()
    this.displayVisibleBlocks()

    this.hooks.onLoaded(this.audioDuration)
  }

  public dispose() {
    console.log('Waveform.Dispose', this.audioPath)

    this.containerRef.removeEventListener('scroll', this.displayVisibleBlocks)
    this.resizeObserver.unobserve(this.containerRef)
    this.audioPath = null
    this.audioDuration = null
    this.waveformBlocks = null
    this.drawnBlocks.clear()
  }

  private async tryDisplayBlock(blockId: number) {
    if (!this.waveformBlocks) {
      return
    }

    if (this.drawnBlocks.has(blockId)) {
      return
    }
    this.drawnBlocks.add(blockId)

    if (this.waveformBlocks[blockId].length === 0) {
      await this.requestBlock(blockId)
    }
    this.drawBlock(blockId)
  }

  private async requestBlock(blockId: number) {
    const startSec = blockId * this.options.blockDuration
    const endSec = (blockId + 1) * this.options.blockDuration

    if (!this.audioPath) {
      return
    }

    const result = await cmd.getAudioWaveformData({
      path: this.audioPath,
      pairPerSec: this.options.resolution,
      startSec,
      endSec,
    })

    for (const channelResult of result) {
      if (channelResult.error) {
        throw channelResult.error
      }
    }

    if (!this.waveformBlocks) {
      return
    }

    this.waveformBlocks[blockId] = result.map((r) => new Float32Array(r.data!))
  }

  private drawBlock(blockId: number) {
    if (!this.waveformBlocks) {
      return
    }

    const block = this.waveformBlocks[blockId]
    const blockStartY =
      this.options.blockDuration * this.options.resolution * blockId

    if (block.length === 0) {
      return
    }

    console.log('Waveform.DrawBlock', blockId)

    if (this.options.mergeChannels) {
      this.drawChannel(this.canvasRef.width, block, 0, blockStartY)
      return
    }

    const channelWidth = Math.floor(this.canvasRef.width / block.length)

    for (const [index, channelData] of block.entries()) {
      this.drawChannel(
        channelWidth,
        [channelData],
        index * channelWidth,
        blockStartY,
      )
    }
  }

  private drawChannel(
    channelWidth: number,
    data: Float32Array[],
    putX: number,
    putY: number,
  ) {
    if (data[0].length === 0) {
      return
    }

    const imageData = this.canvasCtx.createImageData(
      channelWidth,
      data[0].length / 2,
    )

    const width = imageData.width
    const height = imageData.height
    const xCenter = channelWidth / 2

    for (let y = 0; y < height; y++) {
      let max = data[0][2 * y]
      let min = data[0][2 * y + 1]
      if (data.length > 1) {
        // Merge channels.
        max = Math.max(...data.map((c) => c[2 * y]))
        min = Math.min(...data.map((c) => c[2 * y + 1]))
      }

      let maxX = Math.floor(
        xCenter + ((max * width) / 2) * this.options.widthScale,
      )
      let minX = Math.floor(
        xCenter + ((min * width) / 2) * this.options.widthScale,
      )

      // Make it prettier...
      if (maxX - minX <= 1) {
        maxX = minX = xCenter
      }

      let startIndex = (y * width + minX) * 4
      let endIndex = (y * width + maxX) * 4

      for (let i = startIndex; i <= endIndex; i += 4) {
        imageData.data[i] = this.options.fillColor.r
        imageData.data[i + 1] = this.options.fillColor.g
        imageData.data[i + 2] = this.options.fillColor.b

        // Fake aliasing effect.
        if (maxX !== minX && (i === startIndex || i === endIndex)) {
          imageData.data[i + 3] = 180
        } else {
          imageData.data[i + 3] = 255
        }
      }
    }

    this.canvasCtx.putImageData(imageData, putX, putY)
  }

  private async getDuration() {
    if (!this.audioPath) {
      throw new Error('Audio path is null.')
    }

    const result = await cmd.getAudioDurations({ paths: [this.audioPath] })
    if (result[0].error) throw result[0].error
    return result[0].duration!
  }

  private updateSize() {
    const dpr = window.devicePixelRatio

    const containerWidth = this.containerRef.clientWidth

    const width = containerWidth
    const height = this.audioDuration! * this.options.resolution

    this.canvasRef.width = Math.ceil(width * dpr)
    this.canvasRef.height = height

    this.canvasRef.style.width = width + 'px'
    this.canvasRef.style.height = height / dpr + 'px'

    this.hooks.onSizeUpdate(width, height / dpr)
  }

  private resizeObserver = new ResizeObserver(() => {
    // Since the width of container is fixed.
    // We call `displayVisibleBlocks` only.
    this.displayVisibleBlocks()
  })

  private displayVisibleBlocks = async () => {
    if (!this.waveformBlocks) {
      return
    }

    const visibility = this.calcVisibility()

    if (!visibility) {
      return
    }

    let visibleStartBlockId = 0
    for (let i = 0; i < this.waveformBlocks.length; i++) {
      const blockStart =
        i * this.options.blockDuration * this.options.resolution
      const blockEnd =
        (i + 1) * this.options.blockDuration * this.options.resolution
      if (visibility.start >= blockStart && visibility.start < blockEnd) {
        visibleStartBlockId = i
        break
      }
    }

    let visibleEndBlockId = this.waveformBlocks.length
    for (let i = visibleStartBlockId; i < this.waveformBlocks.length; i++) {
      const blockStart =
        i * this.options.blockDuration * this.options.resolution
      if (visibility.end < blockStart) {
        visibleEndBlockId = i
        break
      }
    }

    const startBlockId = Math.max(0, visibleStartBlockId - this.options.preload)
    const endBlockId = Math.min(
      this.waveformBlocks.length,
      visibleEndBlockId + this.options.preload,
    )

    const promises = []
    for (let i = startBlockId; i < endBlockId; i++) {
      promises.push(this.tryDisplayBlock(i))
    }

    await Promise.all(promises)
  }

  private calcVisibility(): {
    start: number
    end: number
  } | null {
    const containerVisibleStart = this.containerRef.scrollTop
    const containerVisibleEnd =
      containerVisibleStart + this.containerRef.clientHeight

    const canvasStart = this.canvasRef.offsetTop
    const canvasEnd = this.canvasRef.offsetTop + this.canvasRef.clientHeight

    const canvasVisibleStart = Math.max(containerVisibleStart, canvasStart)
    const canvasVisibleEnd = Math.min(containerVisibleEnd, canvasEnd)

    if (canvasVisibleStart >= canvasVisibleEnd) {
      return null
    }

    return {
      start: (canvasVisibleStart - canvasStart) * window.devicePixelRatio,
      end: (canvasVisibleEnd - canvasStart) * window.devicePixelRatio,
    }
  }
}
