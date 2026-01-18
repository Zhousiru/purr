'use client'

import { FileList } from '@/components/layout/file-list'
import { TranslationOptionsForm } from '@/components/layout/translation-options-form'
import { Button } from '@/components/ui/button'
import { FormCheckbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { newTasksDefaultValues } from '@/constants/new-tasks-form'
import { addTasksFromForm } from '@/lib/task-manager/utils'
import { NewTasks } from '@/types/new-tasks-form'
import {
  IconCheck,
  IconChevronRight,
  IconPlus,
  IconRestore,
  IconX,
} from '@tabler/icons-react'
import { open } from '@tauri-apps/plugin-dialog'
import { useLayoutEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

export function NewTaskModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: (value: boolean) => void
}) {
  const { register, handleSubmit, control, setValue, getValues, watch, reset } =
    useForm<NewTasks>({
      defaultValues: newTasksDefaultValues,
    })

  const [currentStep, setCurrentStep] = useState<
    'file' | 'transcription' | 'translation'
  >('file')

  useLayoutEffect(() => {
    if (!isOpen) {
      return
    }
    setCurrentStep('file')
    reset()
  }, [isOpen, reset])

  let isCurrentValid = false
  if (currentStep === 'file') {
    isCurrentValid = watch('files').length !== 0
  }
  if (currentStep === 'transcription') {
    isCurrentValid = true
  }
  if (currentStep === 'translation') {
    isCurrentValid =
      watch('translationOption.batchSize') > 0 &&
      watch('translationOption.model') !== '' &&
      watch('translationOption.prompt') !== ''
  }

  const nextDone =
    (currentStep === 'transcription' && !watch('state.createTranslation')) ||
    currentStep === 'translation'

  function handleNextStep() {
    if (currentStep === 'file') {
      setCurrentStep('transcription')
    }
    if (currentStep === 'transcription') {
      setCurrentStep('translation')
    }
  }

  function handleAddTasks(data: NewTasks) {
    addTasksFromForm(data)
    onClose(false)
  }

  async function handleAddFiles() {
    const selected = await open({
      multiple: true,
      filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'm4a'] }],
    })

    const prev = getValues('files')

    if (selected !== null) {
      const paths = Array.isArray(selected) ? selected : [selected]
      setValue('files', [...new Set([...prev, ...paths])])
    }
  }

  function handleResetFiles() {
    setValue('files', [])
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex min-h-[400px] flex-col gap-2">
        {currentStep === 'file' && (
          <>
            <div className="text-lg">Select Files</div>

            <div className="flex gap-1">
              <Button
                icon={<IconPlus />}
                variant="outline"
                onClick={handleAddFiles}
              />
              <Button
                icon={<IconRestore />}
                variant="ghost"
                onClick={handleResetFiles}
              >
                Reset
              </Button>
            </div>

            <Controller
              control={control}
              name="files"
              render={({ field }) => (
                <FileList {...field} className="grow" />
              )}
            />
          </>
        )}

        {currentStep === 'transcription' && (
          <>
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
              <FormCheckbox
                control={control}
                name="transcriptionOption.vadFilter"
              >
                Use VAD filter
              </FormCheckbox>
              <FormCheckbox control={control} name="state.createTranslation">
                Create translation task
              </FormCheckbox>
            </div>
          </>
        )}

        {currentStep === 'translation' && (
          <>
            <div className="text-lg">Translation Options</div>
            <TranslationOptionsForm register={register} />
          </>
        )}

        <div className="mt-auto flex justify-end gap-1">
          <Button
            icon={<IconX />}
            variant="ghost"
            onClick={() => onClose(false)}
          >
            Cancel
          </Button>
          <Button
            icon={nextDone ? <IconCheck /> : <IconChevronRight />}
            onClick={nextDone ? handleSubmit(handleAddTasks) : handleNextStep}
            disabled={!isCurrentValid}
          />
        </div>
      </div>
    </Modal>
  )
}
