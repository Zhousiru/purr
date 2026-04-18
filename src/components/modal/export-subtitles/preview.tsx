import { cn } from '@/lib/utils/cn'

const PREVIEW_CHAR_CAP = 20000

export function Preview({
  text,
  note,
}: {
  text: string
  note?: string
}) {
  const truncated = text.length > PREVIEW_CHAR_CAP
  const shown = truncated ? text.slice(0, PREVIEW_CHAR_CAP) : text

  return (
    <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
      <div className="bg-muted/50 text-muted-foreground flex items-center justify-between px-2 py-1 text-[11px]">
        <span>Preview</span>
        {truncated && (
          <span>Showing first {PREVIEW_CHAR_CAP.toLocaleString()} characters</span>
        )}
      </div>
      <pre
        className={cn(
          'flex-1 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed whitespace-pre',
        )}
      >
        {shown}
      </pre>
      {note && (
        <div className="text-muted-foreground border-border border-t px-2 py-1 text-[11px]">
          {note}
        </div>
      )}
    </div>
  )
}
