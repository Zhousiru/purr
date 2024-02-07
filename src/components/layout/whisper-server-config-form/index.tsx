'use client'

import {
  useWhisperServerConfig,
  WhisperServerConfig,
} from '@/atoms/whisper-server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { commands } from '@/lib/commands'
import { cn } from '@/lib/utils/cn'
import { IconFolderOpen, IconRefresh } from '@tabler/icons-react'
import { open } from '@tauri-apps/api/dialog'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ModelSwitch } from '../model-switch'

export function WhisperServerConfigForm({ className }: { className?: string }) {
  const [config, setConfig] = useWhisperServerConfig()
  const {
    register,
    handleSubmit,
    control,
    formState,
    reset,
    setValue,
    getValues,
  } = useForm<WhisperServerConfig>({ defaultValues: config })

  const [isRefreshing, setIsRefreshing] = useState(false)

  function handleSaveConfig(data: WhisperServerConfig) {
    // TODO: Validate config
    setConfig(data)
    reset(data)
  }

  async function handleSelectDir(
    field: keyof WhisperServerConfig,
    onSuccess?: () => void,
  ) {
    const selected = await open({
      directory: true,
    })
    if (typeof selected === 'string') {
      setValue(field, selected, { shouldDirty: true })
      onSuccess && onSuccess()
    }
  }

  async function handleRefreshModel() {
    setIsRefreshing(true)

    console.log(await commands.listModels({ path: getValues('modelDir') }))

    setIsRefreshing(false)
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label text="Startup path">
        <div className="flex gap-1">
          <Input type="text" {...register('startupDir')} />
          <Button
            icon={<IconFolderOpen />}
            onClick={() => handleSelectDir('startupDir')}
          />
        </div>
      </Label>
      <div className="flex gap-1">
        <Label text="Host">
          <Input type="text" {...register('host')} />
        </Label>
        <Label text="Port" className="w-[6em]">
          <Input type="number" {...register('port')} />
        </Label>
      </div>
      <Label text="Device">
        <Controller
          control={control}
          name="device"
          render={({ field }) => (
            <Select
              items={[
                { name: 'Auto detect', key: 'auto' },
                { name: 'GPU', key: 'gpu' },
                { name: 'CPU', key: 'cpu' },
              ]}
              {...field}
            />
          )}
        />
      </Label>
      <Label text="Quantization type">
        <Input type="text" {...register('quantizationType')} />
      </Label>
      <Label text="Model" className="flex flex-col gap-1.5">
        <div className="flex gap-1">
          <Input type="text" {...register('modelDir')} />
          <Button
            icon={<IconFolderOpen />}
            onClick={() => handleSelectDir('modelDir', handleRefreshModel)}
          />
        </div>
        <Controller
          control={control}
          name="model"
          render={({ field }) => (
            <ModelSwitch
              models={[
                {
                  name: 'faster-whisper-large-v3',
                  size: 233330,
                },
                {
                  name: 'faster-whisper-large-v2',
                  size: 233330,
                },
                {
                  name: 'faster-whisper-large-v1',
                  size: 233330,
                },
                {
                  name: 'faster-whisper-medium',
                  size: 233330,
                },
              ]}
              {...field}
            />
          )}
        />

        <div>
          <Button
            icon={<IconRefresh />}
            variant="ghost"
            onClick={handleRefreshModel}
            loading={isRefreshing}
          />
        </div>
      </Label>

      <div className="mt-auto flex justify-end gap-1">
        {formState.isDirty && (
          <Button variant="outline" onClick={handleSubmit(handleSaveConfig)}>
            Save
          </Button>
        )}
        <Button onClick={handleSubmit((d) => console.log(d))}>
          {formState.isDirty ? 'Save and launch' : 'Launch'}
        </Button>
      </div>
    </div>
  )
}
