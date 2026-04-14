import { Button } from '@/components/ui/button'
import { FormCheckbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { newUrlTaskDefaultValues } from '@/constants/new-url-task-form'
import { addTaskFromUrl } from '@/lib/task-manager/utils'
import { DownloadResult, UrlMetadata } from '@/types/commands'
import { NewUrlTask } from '@/types/new-url-task-form'
import { IconCheck, IconX } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'

export function ConfigStep({
  metadata,
  downloadResult,
  onCancel,
}: {
  metadata: UrlMetadata
  downloadResult: DownloadResult
  onCancel: () => void
}) {
  const { register, handleSubmit, control, watch } = useForm<NewUrlTask>({
    defaultValues: newUrlTaskDefaultValues,
  })

  function onSubmit(data: NewUrlTask) {
    addTaskFromUrl(
      metadata.title,
      downloadResult.path,
      downloadResult.duration,
      data.group,
      data.transcriptionOption,
    )
    onCancel()
  }

  return (
    <form
      className="flex min-h-[340px] flex-col gap-2"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="text-lg">Transcription Options</div>

      <Label text="Task group">
        <Input type="text" className="w-[200px]" {...register('group')} />
      </Label>

      <Label text="Language">
        <FormCheckbox control={control} name="state.autoLanguage">
          Auto detect
        </FormCheckbox>

        {!watch('state.autoLanguage') && (
          <Input
            type="text"
            className="w-[200px]"
            placeholder="e.g. English / Japanese"
            {...register('transcriptionOption.language')}
          />
        )}
      </Label>

      <Label text="Initial prompt">
        <Textarea
          className="max-h-[25vh] min-h-14"
          {...register('transcriptionOption.prompt')}
        />
      </Label>

      <div className="flex flex-col gap-1">
        <FormCheckbox control={control} name="transcriptionOption.vadFilter">
          Use VAD filter
        </FormCheckbox>
      </div>

      <div className="grow" />

      <div className="mt-2 flex justify-end gap-1">
        <Button
          icon={<IconX />}
          variant="ghost"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button icon={<IconCheck />} type="submit" />
      </div>
    </form>
  )
}
