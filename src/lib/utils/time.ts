export function formatSec(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')
  const millisecs = Math.round((seconds - Math.floor(seconds)) * 1000)
    .toString()
    .padStart(3, '0')

  if (hours === 0) {
    return `${minutes}:${secs}.${millisecs}`
  }

  const paddedMinutes = minutes.toString().padStart(2, '0')

  return `${hours}:${paddedMinutes}:${secs}.${millisecs}`
}
