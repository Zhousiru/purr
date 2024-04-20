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
  onContainerVisibleAreaUpdate: (startY: number, endY: number) => void
}

export class Waveform {
  private scrollContainerRef: HTMLDivElement
  private canvasContainerRef: HTMLDivElement

  private options: WaveformOptions
  private hooks: WaveformHooks

  private audioPath: string | null = null
  private audioDuration: number | null = null
  private canvasRefs: Array<HTMLCanvasElement | null> | null = null
  private waveformBlocks: Array<Float32Array[]> | null = null

  private attachedBlocks = new Set<number>()

  constructor(
    scrollContainerRef: HTMLDivElement,
    canvasContainerRef: HTMLDivElement,
    path: string,
    duration: number,
    options: WaveformOptions,
    hooks: WaveformHooks,
  ) {
    this.scrollContainerRef = scrollContainerRef
    this.canvasContainerRef = canvasContainerRef
    this.options = options
    this.hooks = hooks

    this.scrollContainerRef.addEventListener(
      'scroll',
      this.displayVisibleBlocks,
    )
    this.resizeObserver.observe(this.scrollContainerRef)

    this.audioPath = path
    this.audioDuration = duration

    const blockCount = Math.ceil(
      this.audioDuration / this.options.blockDuration,
    )

    this.canvasRefs = Array(blockCount).fill(null)
    this.waveformBlocks = Array(blockCount).fill([])

    this.updateSize()
    this.displayVisibleBlocks()
  }

  public dispose() {
    console.log('Waveform.Dispose', this.audioPath)

    this.canvasContainerRef.replaceChildren()
    this.scrollContainerRef.removeEventListener(
      'scroll',
      this.displayVisibleBlocks,
    )
    this.resizeObserver.disconnect()
    this.audioPath = null
    this.audioDuration = null
    this.canvasRefs = null
    this.waveformBlocks = null
    this.attachedBlocks.clear()
  }

  private async tryDisplayBlock(blockId: number) {
    if (!this.waveformBlocks || !this.canvasRefs) {
      return
    }

    if (this.attachedBlocks.has(blockId)) {
      return
    }
    this.attachedBlocks.add(blockId)

    if (this.waveformBlocks[blockId].length === 0) {
      await this.requestBlock(blockId)
    }

    if (!this.attachedBlocks.has(blockId)) {
      // Check if current block still need to be drawn.
      return
    }

    if (!this.canvasRefs[blockId]) {
      this.createBlockCanvas(blockId)
    }
    this.canvasContainerRef.appendChild(this.canvasRefs[blockId]!)

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

  private createBlockCanvas(blockId: number) {
    if (!this.canvasRefs) {
      return
    }

    const blockCanvas = document.createElement('canvas')
    this.canvasRefs[blockId] = blockCanvas

    const blockStartY =
      this.options.blockDuration * this.options.resolution * blockId

    blockCanvas.style.position = 'absolute'
    blockCanvas.style.top = blockStartY / window.devicePixelRatio + 'px'
    blockCanvas.style.width = this.canvasContainerRef.clientWidth + 'px'
    blockCanvas.style.height =
      (this.options.blockDuration * this.options.resolution) /
        window.devicePixelRatio +
      'px'

    blockCanvas.width = Math.round(
      this.canvasContainerRef.clientWidth * window.devicePixelRatio,
    )
    blockCanvas.height = this.options.blockDuration * this.options.resolution
  }

  private drawBlock(blockId: number) {
    if (!this.waveformBlocks || !this.canvasRefs) {
      return
    }

    const block = this.waveformBlocks[blockId]
    if (block.length === 0) {
      return
    }

    const blockCanvas = this.canvasRefs[blockId]
    if (!blockCanvas) {
      throw new Error('Please create block first.')
    }

    const canvasCtx = blockCanvas.getContext('2d')
    if (!canvasCtx) throw new Error('Failed to get `2d` context.')

    console.log('Waveform.DrawBlock', blockId)

    if (this.options.mergeChannels) {
      this.draw(canvasCtx, blockCanvas.width, block, 0, 0)
      return
    }

    const channelWidth = Math.floor(blockCanvas.width / block.length)

    for (let i = block.length - 1; i >= 0; i--) {
      const channelData = block[i]
      const reversed = block.length - 1 - i
      this.draw(
        canvasCtx,
        channelWidth,
        [channelData],
        reversed * channelWidth,
        0,
      )
    }
  }

  private draw(
    canvasCtx: CanvasRenderingContext2D,
    channelWidth: number,
    data: Float32Array[],
    putX: number,
    putY: number,
  ) {
    if (data[0].length === 0) {
      return
    }

    const imageData = canvasCtx.createImageData(
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

    canvasCtx.putImageData(imageData, putX, putY)
  }

  private updateSize() {
    const height =
      (this.audioDuration! * this.options.resolution) / window.devicePixelRatio

    this.canvasContainerRef.style.height = height + 'px'
  }

  private resizeObserver = new ResizeObserver(() => {
    // Since the width of container is fixed.
    // We call `displayVisibleBlocks` only.
    this.displayVisibleBlocks()
  })

  private displayVisibleBlocks = async () => {
    if (!this.waveformBlocks || !this.canvasRefs) {
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

    // Remove canvases out of view.
    for (let i = 0; i < startBlockId; i++) {
      this.attachedBlocks.delete(i)
      this.canvasRefs[i]?.remove()
    }
    for (let i = endBlockId; i < this.canvasRefs.length; i++) {
      this.attachedBlocks.delete(i)
      this.canvasRefs[i]?.remove()
    }

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
    const containerVisibleStart = this.scrollContainerRef.scrollTop
    const containerVisibleEnd =
      containerVisibleStart + this.scrollContainerRef.clientHeight

    this.hooks.onContainerVisibleAreaUpdate(
      containerVisibleStart,
      containerVisibleEnd,
    )

    const canvasStart = this.canvasContainerRef.offsetTop
    const canvasEnd =
      this.canvasContainerRef.offsetTop + this.canvasContainerRef.clientHeight

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
