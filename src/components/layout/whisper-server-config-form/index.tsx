'use client'

import {
  useWhisperServerConfig,
  WhisperServerConfig,
} from '@/atoms/whisper-server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils/cn'
import { IconFolderOpen } from '@tabler/icons-react'
import { Controller, useForm } from 'react-hook-form'
import { ModelSwitch } from '../model-switch'

export function WhisperServerConfigForm({ className }: { className?: string }) {
  const [config, setConfig] = useWhisperServerConfig()
  const { register, handleSubmit, control, formState, reset } =
    useForm<WhisperServerConfig>({ defaultValues: config })

  function handleSaveConfig(data: WhisperServerConfig) {
    // TODO: Validate config
    setConfig(data)
    reset(data)
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label text="Startup path">
        <div className="flex gap-1">
          <Input type="text" {...register('startupPath')} />
          <Button icon={<IconFolderOpen />} />
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
      <Label text="Model">
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
