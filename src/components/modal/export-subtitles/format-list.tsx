import { ExportFormat, FORMATS } from '@/lib/exporters'
import { cn } from '@/lib/utils/cn'

export function FormatList({
  value,
  onChange,
}: {
  value: ExportFormat
  onChange: (v: ExportFormat) => void
}) {
  return (
    <div className="border-border divide-border flex flex-col divide-y overflow-hidden rounded-md border">
      {FORMATS.map((f) => {
        const active = f.id === value
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={cn(
              'flex flex-col items-start gap-0.5 px-3 py-2 text-left',
              active ? 'bg-muted' : 'hover:bg-muted/50',
            )}
          >
            <span className="flex w-full items-center gap-1.5 text-sm">
              <span className={cn(active ? 'font-semibold' : 'font-medium')}>
                {f.label}
              </span>
              <span className="ml-auto font-mono text-[10px] opacity-60">
                .{f.extension}
              </span>
            </span>
            <span className="text-[11px] leading-tight opacity-60">
              {f.description}
            </span>
          </button>
        )
      })}
    </div>
  )
}
