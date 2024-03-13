export interface DurationResult {
  path: string
  duration: number | null
  error: string | null
}

export interface TranscriptionSubmissionResult {
  name: string
  path: string
  error: string | null
}
