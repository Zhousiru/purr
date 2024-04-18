export function formatSec(seconds: number, withMilli: boolean = true) {
  if (seconds <= 0) {
    return '0:00'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  let secs
  if (withMilli) {
    secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0')
  } else {
    secs = Math.round(seconds % 60)
      .toString()
      .padStart(2, '0')
  }

  let millisecs
  if (withMilli) {
    millisecs =
      '.' +
      Math.round((seconds - Math.floor(seconds)) * 1000)
        .toString()
        .padStart(3, '0')
  } else {
    millisecs = ''
  }

  if (hours === 0) {
    return `${minutes}:${secs}${millisecs}`
  }

  const paddedMinutes = minutes.toString().padStart(2, '0')

  return `${hours}:${paddedMinutes}:${secs}${millisecs}`
}
