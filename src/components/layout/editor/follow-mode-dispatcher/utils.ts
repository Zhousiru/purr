import { getCurrentEditingTask } from '@/atoms/editor'

export function determineCurrentTextIndex(time: number) {
  const data = getCurrentEditingTask().result?.data
  if (!data) {
    return -1
  }

  let left = 0
  let right = data.length

  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    const { start, end } = data[mid]

    if (time >= start && time < end) {
      return mid
    } else if (time < start) {
      right = mid
    } else {
      left = mid + 1
    }
  }

  return -1
}
