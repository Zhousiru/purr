export class WaveformCache {
  private cache = new Map<number, Map<number, Float32Array[]>>()
  private loading = new Set<string>()
  private maxBlocksPerLevel = 50

  has(resolution: number, blockId: number): boolean {
    return this.cache.get(resolution)?.has(blockId) ?? false
  }

  get(resolution: number, blockId: number): Float32Array[] | undefined {
    const levelCache = this.cache.get(resolution)
    if (!levelCache) return undefined

    const data = levelCache.get(blockId)
    if (!data) return undefined

    // LRU: move to end (delete and re-insert)
    levelCache.delete(blockId)
    levelCache.set(blockId, data)

    return data
  }

  isLoading(resolution: number, blockId: number): boolean {
    return this.loading.has(`${resolution}:${blockId}`)
  }

  setLoading(resolution: number, blockId: number) {
    this.loading.add(`${resolution}:${blockId}`)
  }

  set(resolution: number, blockId: number, data: Float32Array[]) {
    this.loading.delete(`${resolution}:${blockId}`)

    if (!this.cache.has(resolution)) {
      this.cache.set(resolution, new Map())
    }
    const levelCache = this.cache.get(resolution)!

    // LRU eviction
    if (levelCache.size >= this.maxBlocksPerLevel) {
      const oldest = levelCache.keys().next().value
      if (oldest !== undefined) {
        levelCache.delete(oldest)
      }
    }

    levelCache.set(blockId, data)
  }

  findClosest(
    blockId: number,
    targetResolution: number,
  ): { resolution: number; data: Float32Array[] } | null {
    const priorities = [
      targetResolution,
      targetResolution * 2,
      targetResolution / 2,
      targetResolution * 4,
      targetResolution / 4,
    ]

    for (const res of priorities) {
      const data = this.cache.get(res)?.get(blockId)
      if (data) {
        return { resolution: res, data }
      }
    }

    return null
  }

  clear() {
    this.cache.clear()
    this.loading.clear()
  }
}
