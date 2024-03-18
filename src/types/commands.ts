export interface DurationResult {
  path: string
  duration: number | null
  error: string | null
}

export interface WaveformResult {
  data: number[] | null
  error: string | null
}
