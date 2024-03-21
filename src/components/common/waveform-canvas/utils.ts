import { marginBlock, resolution } from '@/constants/waveform'

export const seekHeight = (time: number) =>
  marginBlock + Math.ceil(time * resolution) / window.devicePixelRatio

export const seekTime = (height: number) =>
  ((height - marginBlock) * window.devicePixelRatio) / resolution
