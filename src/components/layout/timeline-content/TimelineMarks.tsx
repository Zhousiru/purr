import { seekHeight } from '@/components/common/waveform-canvas/utils'
import { Transcript, Translation } from '@/types/tasks'

function Overlay({ data }: { data: Transcript[] | Translation[] }) {
  return (
    <>
      {data.map((d) => (
        <div
          key={`${d.start}${d.end}${d.text}`}
          className="absolute inset-x-0 border-y border-amber-500 bg-amber-500/5"
          style={{
            top: seekHeight(d.start),
            height: seekHeight(d.end) - seekHeight(d.start),
          }}
        />
      ))}
    </>
  )
}

function Content({ data }: { data: Transcript[] | Translation[] }) {
  return (
    <>
      {data.map((d) => (
        <div
          key={`${d.start}${d.end}${d.text}`}
          className="absolute inset-x-0 border-y border-amber-500 bg-amber-500/5 p-2"
          style={{
            top: seekHeight(d.start),
            height: seekHeight(d.end) - seekHeight(d.start),
          }}
        >
          {d.text}
        </div>
      ))}
    </>
  )
}

export const TimelineMarks = { Overlay, Content }
