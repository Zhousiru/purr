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
  thumbnail: string | null
  webpageUrl: string | null
  isLive: boolean
}

export interface DownloadResult {
  path: string
  duration: number
  title: string
}

export type DownloadStatus =
  | 'downloading'
  | 'finished'
  | 'error'
  | 'unknown'

export interface DownloadProgress {
  status: DownloadStatus
  ext: string
  percent: number
}
