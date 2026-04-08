# 波形图缩放功能实现方案

## 当前实现分析

### 架构概览

```
Container (overflow-y-auto)
  └─ Scroll Shim (height: totalHeight)
      ├─ Canvas (absolute, top: canvasTop)
      └─ VirtualMarks (absolute positioning)
```

### 核心参数

| 参数            | 值    | 说明                 |
| --------------- | ----- | -------------------- |
| `resolution`    | 15    | 每秒 15 对极值数据点 |
| `blockDuration` | 20s   | 每块 20 秒           |
| `marginBlock`   | 100px | 上下边距             |
| `widthScale`    | 0.8   | 水平振幅缩放         |

### 时间-高度映射

```typescript
// 时间 → 高度
seekHeight = marginBlock + (time * resolution) / devicePixelRatio

// 高度 → 时间
seekTime = ((height - marginBlock) * devicePixelRatio) / resolution

// 总高度
totalHeight = marginBlock * 2 + (duration * resolution) / devicePixelRatio
```

### 关键设计

1. **分块加载**：按需加载 + 预加载 10 块
2. **Canvas 缓冲**：3 屏高度（上缓冲 + 视口 + 下缓冲）
3. **虚拟化标记**：只渲染可见区域的 VirtualMarks
4. **Scroll Shim**：Canvas 和 VirtualMarks 在同一容器内同步滚动

---

## 缩放功能需求

- **交互方式**：Ctrl + 滚轮
- **缩放对象**：波形图垂直方向（时间轴）
- **同步要求**：字幕标记跟随缩放

---

## 实现方案

### 方案概述

1. 将 `resolution` 从常量改为响应式状态
2. 使用离散 zoom 级别 + 多级缓存
3. 统一的请求管理：不取消请求，数据总是存入缓存
4. Fallback 渲染：避免缩放时白屏

### 离散 Zoom 级别

```typescript
// 预定义的 zoom 级别，避免连续值导致缓存命中率低
const ZOOM_LEVELS = [0.5, 1, 2, 4] as const
type ZoomLevel = (typeof ZOOM_LEVELS)[number]

// 对应的 resolution 值
// 0.5 → 7.5 pairs/sec (缩小，更稀疏)
// 1   → 15 pairs/sec  (默认)
// 2   → 30 pairs/sec  (放大，更密集)
// 4   → 60 pairs/sec  (最大放大)
```

### 多级缓存策略

与当前实现保持一致：数据总是存入缓存，按条件决定是否触发渲染。

```typescript
class WaveformCache {
  // resolution -> blockId -> data
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

    // LRU: 移到末尾（删除再插入）
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

    // LRU 淘汰：删除最早插入的（Map 迭代顺序 = 插入顺序）
    if (levelCache.size >= this.maxBlocksPerLevel) {
      const oldest = levelCache.keys().next().value
      levelCache.delete(oldest)
    }

    levelCache.set(blockId, data)
  }

  // 查找最接近的已缓存数据（用于 fallback 渲染）
  findClosest(
    blockId: number,
    targetResolution: number,
  ): { resolution: number; data: Float32Array[] } | null {
    // 优先级：当前级别 > 相邻级别 > 其他级别
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

  // 清理非当前级别的缓存（可选，用于内存压力大时）
  pruneOtherLevels(currentResolution: number, keepAdjacent = true) {
    const adjacent = keepAdjacent
      ? [currentResolution * 0.5, currentResolution * 2]
      : []

    for (const res of this.cache.keys()) {
      if (res !== currentResolution && !adjacent.includes(res)) {
        this.cache.delete(res)
      }
    }
  }
}
```

### 请求管理策略

与当前实现统一：不取消请求，数据总是存入缓存，只按条件决定是否触发渲染。

```typescript
class Waveform {
  private cache = new WaveformCache()
  private currentResolution: number = 15

  handleZoomChange(newResolution: number) {
    this.currentResolution = newResolution
    // 不取消请求，不清空缓存，只触发重绘
    this.scheduleRender()
  }

  private async loadBlock(blockId: number) {
    const resolution = this.currentResolution

    if (this.cache.has(resolution, blockId)) return
    if (this.cache.isLoading(resolution, blockId)) return

    this.cache.setLoading(resolution, blockId)

    const result = await cmd.getAudioWaveformData({
      path: this.audioPath,
      pairPerSec: resolution,
      startSec: blockId * this.options.blockDuration,
      endSec: (blockId + 1) * this.options.blockDuration,
    })

    // 总是存入缓存（即使 zoom 已经变了，数据留着下次用）
    this.cache.set(resolution, blockId, result)

    // 只有 resolution 匹配 且 在可见范围内 才触发渲染
    const { start, end } = this.visibleBlockRange
    if (
      resolution === this.currentResolution &&
      blockId >= start &&
      blockId <= end
    ) {
      this.scheduleRender()
    }
  }

  private preloadBlocks(startBlock: number, endBlock: number) {
    // 只预载当前 resolution 的数据
    for (let i = 1; i <= this.options.preload; i++) {
      if (startBlock - i >= 0) this.loadBlock(startBlock - i)
      if (endBlock + i < this.totalBlocks) this.loadBlock(endBlock + i)
    }
  }
}
```

### Fallback 渲染策略

解决问题：缩放后新数据未加载完成时的短暂白屏。

方案：用最接近的已缓存 resolution 数据缩放显示，新数据加载完成后自动替换。

```typescript
class Waveform {
  private drawBlock(blockId: number) {
    // 优先用当前 resolution 的数据
    let data = this.cache.get(this.currentResolution, blockId)
    let sourceResolution = this.currentResolution

    // 没有则找最接近的 fallback
    if (!data) {
      const fallback = this.cache.findClosest(blockId, this.currentResolution)
      if (fallback) {
        data = fallback.data
        sourceResolution = fallback.resolution
      }
    }

    if (!data) return // 真的没有数据，只能空白

    // 计算缩放比例并绘制
    const scale = this.currentResolution / sourceResolution
    this.drawChannelDataScaled(data, blockId, scale)
  }

  private drawChannelDataScaled(
    data: Float32Array[],
    blockId: number,
    scale: number,
  ) {
    // scale = 1: 正常绘制，每个数据点对应 1 行像素
    // scale = 2: 拉伸，每个数据点对应 2 行像素（放大时用低精度数据）
    // scale = 0.5: 压缩，每 2 个数据点合并为 1 行像素（缩小时用高精度数据）

    const { blockDuration, marginBlock } = this.options
    const dpr = window.devicePixelRatio

    const blockStartY =
      marginBlock + (blockId * blockDuration * this.currentResolution) / dpr
    const canvasY = (blockStartY - this.canvasTop) * dpr

    const sourceHeight = data[0].length / 2
    const targetHeight = Math.round(sourceHeight * scale)

    const imageData = this.ctx.createImageData(this.canvas.width, targetHeight)

    for (let targetY = 0; targetY < targetHeight; targetY++) {
      // 映射到源数据的位置
      const sourceY = Math.floor(targetY / scale)
      const max = data[0][2 * sourceY]
      const min = data[0][2 * sourceY + 1]

      // ... 绘制像素（与原有逻辑类似）
    }

    this.ctx.putImageData(imageData, 0, canvasY)
  }
}
```

### 策略总结

| 条件                   | 行为                         |
| ---------------------- | ---------------------------- |
| 请求完成               | 总是存入缓存                 |
| resolution 不匹配      | 不触发渲染（数据留着下次用） |
| blockId 不在可见范围   | 不触发渲染（预载的数据）     |
| 两者都匹配             | 触发渲染                     |
| 当前 resolution 无数据 | 用最接近的缓存数据缩放显示   |

**用户体验**：

| 场景              | 显示效果                                                      |
| ----------------- | ------------------------------------------------------------- |
| 从 1x 放大到 2x   | 立即用 1x 数据拉伸显示（略模糊），2x 数据加载完成后自动变清晰 |
| 从 2x 缩小到 1x   | 立即用 2x 数据压缩显示，1x 数据加载完成后自动替换             |
| 切回已访问的 zoom | 直接使用缓存，无需等待                                        |
| 首次加载          | 可能短暂空白（无 fallback 数据）                              |

### 需要修改的模块

#### 1. 状态管理 (`src/atoms/editor.ts`)

新增 zoom 相关 atom：

```typescript
const zoomLevelAtom = atom(1) // 1 = 100%, 0.5 = 50%, 2 = 200%
export const useZoomLevel = () => useAtom(zoomLevelAtom)
export const getZoomLevel = () => store.get(zoomLevelAtom)
export const setZoomLevel = (level: number) => store.set(zoomLevelAtom, level)

// 派生的实际 resolution
const effectiveResolutionAtom = atom((get) => resolution * get(zoomLevelAtom))
export const useEffectiveResolution = () =>
  useAtomValue(effectiveResolutionAtom)
export const getEffectiveResolution = () => store.get(effectiveResolutionAtom)
```

#### 2. 工具函数 (`src/components/layout/editor/waveform-canvas/utils.ts`)

改为显式传入 resolution，避免隐式全局状态依赖：

```typescript
import { marginBlock } from '@/constants/editor'

// 纯函数版本：显式传入 resolution
export const seekHeightWithResolution = (time: number, resolution: number) =>
  marginBlock + (time * resolution) / window.devicePixelRatio

export const seekTimeWithResolution = (height: number, resolution: number) =>
  ((height - marginBlock) * window.devicePixelRatio) / resolution

// 便捷版本：使用当前 zoom level（用于组件内）
import { getEffectiveResolution } from '@/atoms/editor'

export const seekHeight = (time: number) =>
  seekHeightWithResolution(time, getEffectiveResolution())

export const seekTime = (height: number) =>
  seekTimeWithResolution(height, getEffectiveResolution())
```

**注意**：缩放时计算滚动位置需要用纯函数版本，确保使用正确的 resolution：

```typescript
// 在 setZoomLevel 之前，用旧 resolution 计算时间
const oldResolution = getEffectiveResolution()
const mouseTime = seekTimeWithResolution(scrollTop + mouseY, oldResolution)

setZoomLevel(newZoom)

// 在 setZoomLevel 之后，用新 resolution 计算高度
requestAnimationFrame(() => {
  const newResolution = getEffectiveResolution()
  const newMouseHeight = seekHeightWithResolution(mouseTime, newResolution)
  containerRef.current!.scrollTop = newMouseHeight - mouseY
})
```

#### 3. Waveform 类 (`src/lib/waveform/index.ts`)

主要改动：使用 WaveformCache + fallback 渲染。

```typescript
export class Waveform {
  private cache = new WaveformCache()
  private currentResolution: number
  private unsubZoom: (() => void) | null = null

  constructor(...) {
    this.currentResolution = options.resolution

    this.unsubZoom = subscribeZoomLevel((newResolution) => {
      this.handleZoomChange(newResolution)
    })
  }

  private handleZoomChange(newResolution: number) {
    this.currentResolution = newResolution
    this.scheduleRender()
  }

  private drawBlock(blockId: number) {
    let data = this.cache.get(this.currentResolution, blockId)
    let sourceResolution = this.currentResolution

    // Fallback: 用最接近的已缓存数据
    if (!data) {
      const fallback = this.cache.findClosest(blockId, this.currentResolution)
      if (fallback) {
        data = fallback.data
        sourceResolution = fallback.resolution
      }
    }

    if (!data) return

    const scale = this.currentResolution / sourceResolution
    this.drawChannelDataScaled(data, blockId, scale)
  }

  dispose() {
    this.unsubZoom?.()
    // ...existing cleanup
  }
}
```

#### 4. useWaveformScroll Hook

totalHeight 需要响应 zoom 变化：

```typescript
export function useWaveformScroll(...) {
  const effectiveResolution = useEffectiveResolution()

  const totalHeight =
    options.marginBlock * 2 +
    (options.duration * effectiveResolution) / window.devicePixelRatio

  // ...rest
}
```

#### 5. WaveformCanvas 组件

添加滚轮缩放处理（吸附到离散级别）：

```typescript
const ZOOM_LEVELS = [0.5, 1, 2, 4]

function snapToZoomLevel(value: number): number {
  // 找到最近的离散级别
  return ZOOM_LEVELS.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev,
  )
}

function handleWheel(e: WheelEvent) {
  if (!e.ctrlKey) return
  e.preventDefault()

  const currentZoom = getZoomLevel()
  const currentIndex = ZOOM_LEVELS.indexOf(currentZoom)

  // 直接切换到上/下一个级别
  const newIndex =
    e.deltaY > 0
      ? Math.max(0, currentIndex - 1)
      : Math.min(ZOOM_LEVELS.length - 1, currentIndex + 1)
  const newZoom = ZOOM_LEVELS[newIndex]

  if (newZoom === currentZoom) return

  // 保持鼠标位置对应的时间点不变
  const mouseY = e.clientY - containerRef.current!.getBoundingClientRect().top
  const scrollTop = containerRef.current!.scrollTop
  const mouseTime = seekTime(scrollTop + mouseY)

  setZoomLevel(newZoom)

  // 调整滚动位置
  requestAnimationFrame(() => {
    const newMouseHeight = seekHeight(mouseTime)
    containerRef.current!.scrollTop = newMouseHeight - mouseY
  })
}

useEffect(() => {
  const container = containerRef.current
  container?.addEventListener('wheel', handleWheel, { passive: false })
  return () => container?.removeEventListener('wheel', handleWheel)
}, [])
```

#### 6. VirtualMarks 组件

已经使用 `seekHeight()` 计算位置，只需确保组件在 zoom 变化时重新渲染：

```typescript
export function VirtualMarks() {
  const zoomLevel = useZoomLevelValue() // 触发重渲染
  // ...existing code
}
```

---

## 架构评估

### 是否需要大幅重构？

**不需要。** 当前架构设计良好，支持缩放只需：

1. 将 `resolution` 从常量改为响应式状态
2. 各组件订阅该状态变化
3. 添加滚轮事件处理

### 架构优势

| 特性         | 对缩放的支持                        |
| ------------ | ----------------------------------- |
| 分块加载     | ✅ 多级缓存，切换 zoom 复用已有数据 |
| Canvas 缓冲  | ✅ 无需修改，自动适应新高度         |
| VirtualMarks | ✅ 使用 seekHeight()，自动响应      |
| Scroll Shim  | ✅ totalHeight 响应式更新           |

### 潜在问题

1. **滚动位置跳变**
   - 问题：totalHeight 变化导致滚动位置失效
   - 方案：缩放时用纯函数版本 `seekTimeWithResolution` / `seekHeightWithResolution` 计算，确保使用正确的 resolution

2. **内存占用**
   - 问题：多级缓存会占用更多内存
   - 方案：限制每级 50 块，必要时调用 `pruneOtherLevels()` 清理
   - 估算：4 级 × 50 块 × 2.4KB/块 ≈ 480KB，可接受

3. **Fallback 精度**
   - 问题：缩放显示时可能有轻微模糊
   - 方案：可接受的过渡效果，新数据加载完成后自动变清晰

---

## 最佳实践检查

| 检查项         | 状态 | 说明                                        |
| -------------- | ---- | ------------------------------------------- |
| 单一职责       | ✅   | WaveformCache 只负责缓存，Waveform 负责渲染 |
| 纯函数优先     | ✅   | seekHeight/seekTime 提供纯函数版本          |
| 显式依赖       | ✅   | 避免隐式全局状态，关键计算用显式参数        |
| LRU 正确性     | ✅   | get 时更新访问顺序                          |
| 内存可控       | ✅   | 每级限制 50 块，可选清理                    |
| 渐进增强       | ✅   | Fallback 渲染保证基本体验                   |
| 与现有架构一致 | ✅   | 请求管理策略统一                            |

---

## 实现步骤

1. 新建 `src/lib/waveform/cache.ts`，实现 `WaveformCache` 类
2. 在 `src/atoms/editor.ts` 添加 zoomLevel atom
3. 修改 `utils.ts` 的 seekHeight/seekTime 使用动态 resolution
4. 修改 `useWaveformScroll.ts` 使用动态 resolution
5. 在 `WaveformCanvas` 添加 wheel 事件处理
6. 修改 `Waveform` 类使用 `WaveformCache`
7. 确保 `VirtualMarks` 响应 zoom 变化

---

## 总结

当前架构设计合理，核心的时间-高度映射集中在 `seekHeight`/`seekTime` 函数中。实现缩放功能的关键改动：

1. **离散 zoom 级别**：[0.5, 1, 2, 4]，提高缓存命中率
2. **多级缓存**：按 resolution 分层存储，切换 zoom 时复用已有数据
3. **统一的请求管理**：与现有策略一致，不取消请求，数据总是存入缓存，按条件触发渲染
4. **Fallback 渲染**：新数据未就绪时用最接近的缓存数据缩放显示，避免白屏

不需要大幅重构。预计改动量：~200-250 行代码。
