export interface DurationResult {
  path: string
  duration: number | null
  error: string | null
}

export interface WaveformResult {
  data: Array<number[]> | null
  error: string | null
}
