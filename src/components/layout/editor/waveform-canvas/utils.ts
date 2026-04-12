import { getEffectiveResolution, getMarginBlock } from '@/atoms/editor'

export const seekHeightWithResolution = (time: number, resolution: number) =>
  getMarginBlock() + (time * resolution) / window.devicePixelRatio

export const seekTimeWithResolution = (height: number, resolution: number) =>
  ((height - getMarginBlock()) * window.devicePixelRatio) / resolution

export const seekHeight = (time: number) =>
  seekHeightWithResolution(time, getEffectiveResolution())

export const seekTime = (height: number) =>
  seekTimeWithResolution(height, getEffectiveResolution())
