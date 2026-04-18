import { LabelCheckbox } from '@/components/ui/checkbox'
import { ColorPicker } from '@/components/ui/color-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectItem } from '@/components/ui/select'
import { AssStyle } from '@/lib/exporters'

const ALIGNMENT_ITEMS: SelectItem[] = [
  { key: '7', name: 'Top-left' },
  { key: '8', name: 'Top-center' },
  { key: '9', name: 'Top-right' },
  { key: '4', name: 'Mid-left' },
  { key: '5', name: 'Mid-center' },
  { key: '6', name: 'Mid-right' },
  { key: '1', name: 'Bot-left' },
  { key: '2', name: 'Bot-center' },
  { key: '3', name: 'Bot-right' },
]

export function AssStyleControls({
  value,
  onChange,
}: {
  value: AssStyle
  onChange: (v: AssStyle) => void
}) {
  const set = <K extends keyof AssStyle>(key: K, v: AssStyle[K]) =>
    onChange({ ...value, [key]: v })

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <Label text="Font">
          <Input
            type="text"
            value={value.fontName}
            onChange={(e) => set('fontName', e.target.value)}
          />
        </Label>

        <Label text="Size">
          <Input
            type="number"
            min={8}
            max={200}
            value={value.fontSize}
            onChange={(e) => set('fontSize', Number(e.target.value) || 1)}
          />
        </Label>

        <Label text="V-Margin">
          <Input
            type="number"
            min={0}
            value={value.marginV}
            onChange={(e) => set('marginV', Number(e.target.value) || 0)}
          />
        </Label>

        <Label text="Primary">
          <ColorPicker
            value={value.primaryColor}
            onChange={(v) => set('primaryColor', v)}
          />
        </Label>

        <Label text="Outline">
          <ColorPicker
            value={value.outlineColor}
            onChange={(v) => set('outlineColor', v)}
          />
        </Label>

        <Label text="Outline px">
          <Input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={value.outline}
            onChange={(e) => set('outline', Number(e.target.value) || 0)}
          />
        </Label>

        <Label text="Alignment">
          <Select
            items={ALIGNMENT_ITEMS}
            value={String(value.alignment)}
            onChange={(v) =>
              set('alignment', Number(v) as AssStyle['alignment'])
            }
          />
        </Label>

        <Label text="Style">
          <div className="flex h-9 items-center gap-4">
            <LabelCheckbox
              checked={value.bold}
              onChange={(v) => set('bold', v)}
            >
              Bold
            </LabelCheckbox>
            <LabelCheckbox
              checked={value.italic}
              onChange={(v) => set('italic', v)}
            >
              Italic
            </LabelCheckbox>
          </div>
        </Label>
      </div>
    </div>
  )
}
