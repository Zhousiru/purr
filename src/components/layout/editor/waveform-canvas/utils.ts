import { marginBlock } from '@/constants/editor'
import { getEffectiveResolution } from '@/atoms/editor'

export const seekHeightWithResolution = (time: number, resolution: number) =>
  marginBlock + (time * resolution) / window.devicePixelRatio

export const seekTimeWithResolution = (height: number, resolution: number) =>
  ((height - marginBlock) * window.devicePixelRatio) / resolution

export const seekHeight = (time: number) =>
  seekHeightWithResolution(time, getEffectiveResolution())

export const seekTime = (height: number) =>
  seekTimeWithResolution(height, getEffectiveResolution())
