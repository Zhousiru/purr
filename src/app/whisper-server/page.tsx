'use client'

import { useWhisperServerConfig } from '@/atoms/whisper-server'
import { ModelSwitch } from '@/components/layout/model-switch'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { IconFolderOpen } from '@tabler/icons-react'
import { Controller, useForm } from 'react-hook-form'

export default function Page() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<{
    in: string
    select: string
  }>()
  const [config, setConfig] = useWhisperServerConfig()

  return (
    <div className="flex h-screen flex-col">
      <PageHeader>Whisper Server</PageHeader>
      <div className="flex flex-grow">
        <div className="relative min-w-[300px] shadow">
          <div className="absolute inset-0 flex min-h-full flex-col gap-2 overflow-y-auto p-4">
            <Label text="Startup path">
              <div className="flex gap-1">
                <Input type="text" />
                <Button icon={<IconFolderOpen />} />
              </div>
            </Label>
            <div className="flex gap-1">
              <Label text="Host">
                <Input type="text" />
              </Label>
              <Label text="Port" className="w-[6em]">
                <Input type="number" />
              </Label>
            </div>
            <Label text="Device">
              <Select
                items={[
                  { name: 'Auto detect', key: 'auto' },
                  { name: 'GPU', key: 'gpu' },
                  { name: 'CPU', key: 'cpu' },
                ]}
              />
            </Label>
            <Label text="Quantization type">
              <Input type="text" />
            </Label>
            <Label text="Model">
              <Controller
                name="select"
                control={control}
                defaultValue="faster-whisper-large-v2"
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
              <Button variant="outline">Save</Button>
              <Button onClick={handleSubmit((d) => console.log(d))}>
                Save and launch
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-grow bg-gray-600 p-4 font-mono text-white">
          Terminal
        </div>
      </div>
    </div>
  )
}
