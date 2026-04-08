# 波形图缩放功能实现详解

## 改动文件清单

```
src/
├── atoms/editor.ts                    # 新增 zoom 状态管理
├── lib/waveform/
│   ├── cache.ts                       # 新建：多级缓存类
│   └── index.ts                       # 重构：支持缩放和 fallback 渲染
├── hooks/useWaveformScroll.ts         # 修改：使用动态 resolution
└── components/layout/editor/waveform-canvas/
    ├── utils.ts                       # 修改：新增纯函数版本
    ├── index.tsx                      # 修改：添加 Ctrl+滚轮缩放
    └── VirtualMarks.tsx               # 修改：响应 zoom 变化
```

---

## 1. 状态管理 (`src/atoms/editor.ts`)

### 新增内容

```typescript
import { resolution } from '@/constants/editor'

// 离散的 zoom 级别，避免连续值导致缓存命中率低
export const ZOOM_LEVELS = [0.5, 1, 2, 4, 8, 16] as const
export type ZoomLevel = (typeof ZOOM_LEVELS)[number]

// zoom 状态
const zoomLevelAtom = atom<ZoomLevel>(1)
export const useZoomLevel = () => useAtom(zoomLevelAtom)
export const useZoomLevelValue = () => useAtomValue(zoomLevelAtom)
export const getZoomLevel = () => store.get(zoomLevelAtom)
export const setZoomLevel = (level: ZoomLevel) => store.set(zoomLevelAtom, level)

// 订阅函数，供非 React 代码使用
export const subZoomLevel = (callback: () => void) => store.sub(zoomLevelAtom, callback)

// 派生状态：实际的 resolution 值
// Math.round 确保是整数，因为 Rust 后端期望 usize
const effectiveResolutionAtom = atom((get) => Math.round(resolution * get(zoomLevelAtom)))
export const useEffectiveResolution = () => useAtomValue(effectiveResolutionAtom)
export const getEffectiveResolution = () => store.get(effectiveResolutionAtom)
```

### 设计要点

1. **离散 zoom 级别**：`[0.5, 1, 2, 4, 8, 16]`，而非连续值
   - 提高缓存命中率
   - 用户切换时直接跳到下一级，体验更清晰

2. **`subZoomLevel` 函数**：封装 `store.sub(zoomLevelAtom, callback)`
   - Jotai 的 `store.sub` 需要传入已存在的 atom
   - 不能在订阅时创建新 atom（我最初的错误）

3. **`Math.round`**：确保 resolution 是整数
   - `15 * 0.5 = 7.5` 会导致 Rust 后端报错
   - 取整后：0.5x → 8, 1x → 15, 2x → 30, 4x → 60

---

## 2. 多级缓存 (`src/lib/waveform/cache.ts`)

### 完整实现

```typescript
export class WaveformCache {
  // 二级 Map：resolution -> blockId -> data
  private cache = new Map<number, Map<number, Float32Array[]>>()
  private loading = new Set<string>()
  private maxBlocksPerLevel = 50

  // 检查是否已缓存
  has(resolution: number, blockId: number): boolean

  // 获取缓存（同时更新 LRU 顺序）
  get(resolution: number, blockId: number): Float32Array[] | undefined

  // 检查是否正在加载
  isLoading(resolution: number, blockId: number): boolean

  // 标记为正在加载
  setLoading(resolution: number, blockId: number): void

  // 存入缓存（带 LRU 淘汰）
  set(resolution: number, blockId: number, data: Float32Array[]): void

  // 查找最接近的已缓存数据（用于 fallback）
  findClosest(blockId: number, targetResolution: number): { resolution: number; data: Float32Array[] } | null

  // 清空缓存
  clear(): void
}
```

### 关键方法详解

#### `get()` - LRU 更新

```typescript
get(resolution: number, blockId: number): Float32Array[] | undefined {
  const levelCache = this.cache.get(resolution)
  if (!levelCache) return undefined

  const data = levelCache.get(blockId)
  if (!data) return undefined

  // LRU: 删除再插入，移到 Map 末尾
  levelCache.delete(blockId)
  levelCache.set(blockId, data)

  return data
}
```

Map 的迭代顺序是插入顺序，所以"删除再插入"可以把元素移到末尾，实现 LRU。

#### `set()` - LRU 淘汰

```typescript
set(resolution: number, blockId: number, data: Float32Array[]) {
  // ...
  // 超出限制时，删除最早插入的（Map 第一个元素）
  if (levelCache.size >= this.maxBlocksPerLevel) {
    const oldest = levelCache.keys().next().value
    levelCache.delete(oldest)
  }
  levelCache.set(blockId, data)
}
```

#### `findClosest()` - Fallback 查找

```typescript
findClosest(blockId: number, targetResolution: number) {
  // 按优先级查找：当前级别 > 相邻级别 > 更远级别
  const priorities = [
    targetResolution,
    targetResolution * 2,
    targetResolution / 2,
    targetResolution * 4,
    targetResolution / 4,
  ]

  for (const res of priorities) {
    const data = this.cache.get(res)?.get(blockId)
    if (data) return { resolution: res, data }
  }
  return null
}
```

优先使用相邻级别的数据，因为缩放比例更接近，显示效果更好。

---

## 3. Waveform 类重构 (`src/lib/waveform/index.ts`)

### 主要改动

#### 3.1 使用 WaveformCache 替代原有的 Map

```typescript
// 旧代码
private waveformBlocks: Map<number, Float32Array[]> = new Map()
private loadingBlocks: Set<number> = new Set()

// 新代码
private cache = new WaveformCache()
private currentResolution: number
```

#### 3.2 订阅 zoom 变化

```typescript
constructor(...) {
  // ...
  this.currentResolution = getEffectiveResolution()

  // 订阅 zoom 变化
  this.unsubZoom = subZoomLevel(() => {
    this.handleZoomChange()
  })
}

private handleZoomChange() {
  this.currentResolution = getEffectiveResolution()
  this.scheduleRender()  // 触发重绘
}

dispose() {
  this.unsubZoom?.()  // 取消订阅
  // ...
}
```

#### 3.3 Fallback 渲染

```typescript
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

  if (!data) return  // 真的没有数据，只能空白

  // 计算缩放比例
  const scale = this.currentResolution / sourceResolution
  this.drawChannelDataScaled(data, blockId, scale)
}
```

#### 3.4 缩放绘制

```typescript
private drawChannelDataScaled(data, putX, putY, channelWidth, scale) {
  const sourceHeight = data[0].length / 2
  const targetHeight = Math.round(sourceHeight * scale)

  // scale = 1: 正常绘制
  // scale = 2: 拉伸（放大时用低精度数据）
  // scale = 0.5: 压缩（缩小时用高精度数据）

  for (let targetY = 0; targetY < targetHeight; targetY++) {
    // 映射到源数据位置
    const sourceY = Math.floor(targetY / scale)
    // ... 绘制像素
  }
}
```

#### 3.5 请求管理

```typescript
private async loadBlock(blockId: number) {
  const resolution = this.currentResolution  // 捕获当前 resolution

  if (this.cache.has(resolution, blockId)) return
  if (this.cache.isLoading(resolution, blockId)) return

  this.cache.setLoading(resolution, blockId)

  const result = await cmd.getAudioWaveformData({
    pairPerSec: resolution,  // 使用捕获的 resolution
    // ...
  })

  // 总是存入缓存（即使 zoom 已经变了）
  this.cache.set(resolution, blockId, result)

  // 只有 resolution 匹配 且 在可见范围内 才触发渲染
  if (resolution === this.currentResolution && blockId in visibleRange) {
    this.scheduleRender()
  }
}
```

---

## 4. 工具函数 (`src/components/layout/editor/waveform-canvas/utils.ts`)

### 改动

```typescript
// 旧代码：使用固定 resolution
import { marginBlock, resolution } from '@/constants/editor'

export const seekHeight = (time: number) =>
  marginBlock + (time * resolution) / window.devicePixelRatio

// 新代码：支持动态 resolution
import { marginBlock } from '@/constants/editor'
import { getEffectiveResolution } from '@/atoms/editor'

// 纯函数版本：显式传入 resolution
export const seekHeightWithResolution = (time: number, resolution: number) =>
  marginBlock + (time * resolution) / window.devicePixelRatio

export const seekTimeWithResolution = (height: number, resolution: number) =>
  ((height - marginBlock) * window.devicePixelRatio) / resolution

// 便捷版本：使用当前 zoom level
export const seekHeight = (time: number) =>
  seekHeightWithResolution(time, getEffectiveResolution())

export const seekTime = (height: number) =>
  seekTimeWithResolution(height, getEffectiveResolution())
```

### 为什么需要纯函数版本？

缩放时计算滚动位置需要用到新旧两个 resolution：

```typescript
// 缩放前，用旧 resolution 计算鼠标对应的时间
const oldResolution = getEffectiveResolution()
const mouseTime = seekTimeWithResolution(scrollTop + mouseY, oldResolution)

setZoomLevel(newZoom)  // 改变 zoom

// 缩放后，用新 resolution 计算新的高度
const newResolution = getEffectiveResolution()
const newMouseHeight = seekHeightWithResolution(mouseTime, newResolution)
```

如果只用便捷版本，两次调用都会用新 resolution，导致计算错误。

---

## 5. useWaveformScroll Hook (`src/hooks/useWaveformScroll.ts`)

### 改动

```typescript
// 旧代码
interface UseWaveformScrollOptions {
  duration: number
  resolution: number  // 固定值
  marginBlock: number
}

const totalHeight = options.marginBlock * 2 +
  (options.duration * options.resolution) / window.devicePixelRatio

// 新代码
interface UseWaveformScrollOptions {
  duration: number
  // 移除 resolution 和 marginBlock
}

const effectiveResolution = useEffectiveResolution()  // 响应式

const totalHeight = marginBlock * 2 +
  (options.duration * effectiveResolution) / window.devicePixelRatio
```

当 zoom 变化时，`effectiveResolution` 变化 → `totalHeight` 变化 → 触发 React 重渲染 → Scroll Shim 高度更新。

---

## 6. WaveformCanvas 组件 (`src/components/layout/editor/waveform-canvas/index.tsx`)

### 新增：Ctrl + 滚轮缩放

```typescript
useEffect(() => {
  const container = containerRef.current
  if (!container) return

  const handleWheel = (e: WheelEvent) => {
    if (!e.ctrlKey) return  // 只响应 Ctrl + 滚轮
    e.preventDefault()

    const currentZoom = getZoomLevel()
    const currentIndex = ZOOM_LEVELS.indexOf(currentZoom)

    // 计算新的 zoom 级别
    const newIndex = e.deltaY > 0
      ? Math.max(0, currentIndex - 1)      // 向下滚 = 缩小
      : Math.min(ZOOM_LEVELS.length - 1, currentIndex + 1)  // 向上滚 = 放大
    const newZoom = ZOOM_LEVELS[newIndex]

    if (newZoom === currentZoom) return

    // 保持鼠标位置对应的时间点不变
    const mouseY = e.clientY - container.getBoundingClientRect().top
    const scrollTop = container.scrollTop
    const oldResolution = getEffectiveResolution()
    const mouseTime = seekTimeWithResolution(scrollTop + mouseY, oldResolution)

    setZoomLevel(newZoom)

    // 调整滚动位置
    requestAnimationFrame(() => {
      const newResolution = getEffectiveResolution()
      const newMouseHeight = seekHeightWithResolution(mouseTime, newResolution)
      container.scrollTop = newMouseHeight - mouseY
    })
  }

  container.addEventListener('wheel', handleWheel, { passive: false })
  return () => container.removeEventListener('wheel', handleWheel)
}, [])
```

### 滚动位置计算图解

```
缩放前 (1x, resolution=15):
┌─────────────────┐
│                 │ ← scrollTop = 100
│    ○ 鼠标位置    │ ← mouseY = 50 (相对容器)
│                 │    mouseTime = seekTime(150) = 10s
└─────────────────┘

缩放后 (2x, resolution=30):
┌─────────────────┐
│                 │
│                 │
│    ○ 鼠标位置    │ ← 仍然对应 10s
│                 │    newHeight = seekHeight(10s) = 300
│                 │    newScrollTop = 300 - 50 = 250
└─────────────────┘
```

---

## 7. VirtualMarks 组件 (`src/components/layout/editor/waveform-canvas/VirtualMarks.tsx`)

### 改动

```typescript
export function VirtualMarks() {
  // ...

  // 订阅 zoom 变化，触发重渲染
  useZoomLevelValue()

  // seekHeight 内部使用 getEffectiveResolution()
  // zoom 变化后，这里会重新计算
  const totalMarks = (task.result?.data ?? []).map(
    (d, index) => [index, seekHeight(d.start), seekHeight(d.end)] as const,
  )

  // ...
}
```

`useZoomLevelValue()` 的作用是让组件订阅 `zoomLevelAtom`，当 zoom 变化时触发重渲染。重渲染时 `seekHeight()` 会使用新的 resolution，从而更新标记位置。

---

## 数据流总结

```
用户 Ctrl+滚轮
    ↓
setZoomLevel(newZoom)
    ↓
zoomLevelAtom 变化
    ↓
┌───────────────────────────────────────────────────────┐
│ effectiveResolutionAtom 重新计算                       │
│     ↓                                                 │
│ ┌─────────────────┐  ┌─────────────────┐             │
│ │ useWaveformScroll│  │ VirtualMarks    │             │
│ │ totalHeight 变化 │  │ 重新计算位置     │             │
│ └─────────────────┘  └─────────────────┘             │
│                                                       │
│ subZoomLevel 回调触发                                  │
│     ↓                                                 │
│ Waveform.handleZoomChange()                          │
│     ↓                                                 │
│ scheduleRender() → drawBlock() → fallback 渲染        │
│     ↓                                                 │
│ loadBlock() → 请求新 resolution 数据                   │
│     ↓                                                 │
│ 数据返回 → cache.set() → scheduleRender() → 清晰渲染   │
└───────────────────────────────────────────────────────┘
```

---

## 用户体验

| 操作 | 效果 |
|------|------|
| Ctrl + 滚轮向上 | 放大（时间轴拉长） |
| Ctrl + 滚轮向下 | 缩小（时间轴压缩） |
| 缩放瞬间 | 用已有缓存数据缩放显示（可能略模糊） |
| 数据加载完成 | 自动替换为清晰版本 |
| 切回已访问的 zoom | 直接使用缓存，无需等待 |
