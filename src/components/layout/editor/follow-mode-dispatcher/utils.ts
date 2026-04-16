import { getCurrentEditingTask } from '@/atoms/editor'

export function determineCurrentTextId(time: number): string | null {
  const data = getCurrentEditingTask().result?.data
  if (!data) {
    return null
  }

  let left = 0
  let right = data.length

  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    const { start, end } = data[mid]

    if (time >= start && time < end) {
      return data[mid].id
    } else if (time < start) {
      right = mid
    } else {
      left = mid + 1
    }
  }

  return null
}
