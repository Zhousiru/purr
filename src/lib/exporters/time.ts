function splitMs(sec: number) {
  const total = Math.max(0, Math.round(sec * 1000))
  const ms = total % 1000
  const totalSec = Math.floor(total / 1000)
  const s = totalSec % 60
  const totalMin = Math.floor(totalSec / 60)
  const m = totalMin % 60
  const h = Math.floor(totalMin / 60)
  return { h, m, s, ms }
}

function splitCs(sec: number) {
  const total = Math.max(0, Math.floor(sec * 100))
  const cs = total % 100
  const totalSec = Math.floor(total / 100)
  const s = totalSec % 60
  const totalMin = Math.floor(totalSec / 60)
  const m = totalMin % 60
  const h = Math.floor(totalMin / 60)
  return { h, m, s, cs }
}

const pad2 = (n: number) => n.toString().padStart(2, '0')
const pad3 = (n: number) => n.toString().padStart(3, '0')

export function fmtSrt(sec: number): string {
  const { h, m, s, ms } = splitMs(sec)
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(ms)}`
}

export function fmtVtt(sec: number): string {
  const { h, m, s, ms } = splitMs(sec)
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}.${pad3(ms)}`
}

export function fmtAss(sec: number): string {
  const { h, m, s, cs } = splitCs(sec)
  return `${h}:${pad2(m)}:${pad2(s)}.${pad2(cs)}`
}

export function fmtLrc(sec: number): string {
  const { h, m, s, cs } = splitCs(sec)
  const totalMin = h * 60 + m
  return `[${pad2(totalMin)}:${pad2(s)}.${pad2(cs)}]`
}
