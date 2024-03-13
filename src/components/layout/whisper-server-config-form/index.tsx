'use client'

import { isRunningAtom, useWhisperServerConfig } from '@/atoms/whisper-server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { cmd } from '@/lib/commands'
import { cn } from '@/lib/utils/cn'
import { killWhisperServer, startWhisperServer } from '@/lib/whisper-server'
import { ModelItem, WhisperServerConfig } from '@/types/whisper-server'
import { IconFolderOpen, IconRefresh } from '@tabler/icons-react'
import { open } from '@tauri-apps/api/dialog'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ModelSwitch } from '../model-switch'
import { ConnectionBadge } from './ConnectionBadge'

export function WhisperServerConfigForm({ className }: { className?: string }) {
  const isRunning = useAtomValue(isRunningAtom)
  const [config, setConfig] = useWhisperServerConfig()
  const {
    register,
    handleSubmit,
    control,
    formState,
    reset,
    setValue,
    getValues,
    watch,
  } = useForm<WhisperServerConfig>({ defaultValues: config })

  const [models, setModels] = useState<ModelItem[]>([])

  function handleLaunch(data: WhisperServerConfig) {
    startWhisperServer(data)
  }

  function handleKill() {
    killWhisperServer()
  }

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

  const handleRefreshModel = useCallback(async () => {
    setModels(await cmd.listModels({ path: getValues('modelDir') }))
  }, [getValues])

  useEffect(() => {
    handleRefreshModel()
  }, [handleRefreshModel])

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label text="Startup directory">
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
      <Label text="Model">
        <div className="flex gap-1">
          <Input type="text" {...register('modelDir')} />
          <Button
            icon={<IconFolderOpen />}
            onClick={() => handleSelectDir('modelDir', handleRefreshModel)}
          />
        </div>

        <div className="mt-2 flex flex-col gap-1">
          {watch('modelDir') && (
            <Controller
              control={control}
              name="model"
              render={({ field }) => <ModelSwitch models={models} {...field} />}
            />
          )}

          <div>
            <Button
              icon={<IconRefresh />}
              variant="ghost"
              onClick={handleRefreshModel}
            />
          </div>
        </div>
      </Label>

      <div className="mt-auto flex justify-end">
        <ConnectionBadge />
      </div>

      <div className="flex justify-end gap-1">
        {formState.isDirty && (
          <>
            <Button variant="outline" onClick={handleSubmit(handleSaveConfig)}>
              Save
            </Button>

            {isRunning && (
              <Button
                onClick={handleSubmit(async (data) => {
                  handleSaveConfig(data)
                  await handleKill()
                  handleLaunch(data)
                })}
              >
                Save & restart
              </Button>
            )}

            {!isRunning && (
              <Button
                onClick={handleSubmit((data) => {
                  handleSaveConfig(data)
                  handleLaunch(data)
                })}
              >
                Save & launch
              </Button>
            )}
          </>
        )}

        {!formState.isDirty && !isRunning && (
          <Button onClick={() => handleLaunch(config)}>Launch</Button>
        )}

        {isRunning && <Button onClick={handleKill}>Stop</Button>}
      </div>
    </div>
  )
}
