import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function TranslationOptionsForm() {
  return (
    <>
      <div className="text-lg">Translation Options</div>
      <label>Model</label>
      <Input type="text" className="w-[200px]" />
      <label>Batch size</label>
      <Input type="number" className="w-[100px]" />
      <label>System prompt</label>
      <Textarea className="max-h-[25vh] min-h-14" />
    </>
  )
}
