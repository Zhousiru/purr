import { marginBlock, resolution } from '@/constants/editor'

export const seekHeight = (time: number) =>
  marginBlock + (time * resolution) / window.devicePixelRatio

export const seekTime = (height: number) =>
  ((height - marginBlock) * window.devicePixelRatio) / resolution
