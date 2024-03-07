import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NewTasks } from '@/types/new-tasks-form'
import { UseFormRegister } from 'react-hook-form'

export function TranslationOptionsForm({
  register,
}: {
  register: UseFormRegister<NewTasks>
}) {
  return (
    <>
      <Label text="Model">
        <Input
          type="text"
          className="w-[200px]"
          {...register('translationOption.model')}
        />
      </Label>

      <Label text="Batch size">
        <Input
          type="number"
          className="w-[100px]"
          {...register('translationOption.batchSize')}
        />
      </Label>

      <Label text="System prompt">
        <Textarea
          className="max-h-[25vh] min-h-14"
          {...register('translationOption.prompt')}
        />
      </Label>
    </>
  )
}
