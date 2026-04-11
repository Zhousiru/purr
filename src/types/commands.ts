export interface DurationResult {
  path: string
  duration: number | null
  error: string | null
}

export interface WaveformResult {
  data: number[] | null
  error: string | null
}

export interface UrlMetadata {
  title: string
  duration: number | null
  uploader: string | null
}

export interface DownloadResult {
  path: string
  duration: number
}

export interface DownloadProgress {
  downloaded: number
  total: number
}
