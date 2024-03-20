'use client'

import { ClientOnly } from '@/components/common/client-only'
import { WaveformCanvas } from '@/components/common/waveform-canvas'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const paths = [
  null,
  String.raw`C:\Users\Syrhu\Desktop\foxfox.wav`,
  String.raw`C:\Users\Syrhu\Desktop\mili.flac`,
]

export default function Page() {
  const [path, setPath] = useState(0)
  const [merge, setMerge] = useState(false)

  async function handleDebugToggleFile() {
    setPath((prev) => (prev + 1) % 3)
  }

  async function handleDebugToggleMerge() {
    setMerge((prev) => !prev)
  }

  return (
    <div className="flex h-screen flex-col">
      <PageHeader>Editor</PageHeader>
      <div className="flex flex-grow divide-x">
        <div className="w-[80px] bg-gray-100"></div>
        <div className="flex w-[350px] bg-gray-100">
          <ClientOnly>
            {paths[path] && (
              <WaveformCanvas path={paths[path]!} mergeChannels={merge} />
            )}
          </ClientOnly>
        </div>
      </div>

      <div className="absolute bottom-2 right-2 flex gap-1">
        <Button onClick={handleDebugToggleFile}>Toggle file</Button>
        <Button onClick={handleDebugToggleMerge}>Toggle merge</Button>
      </div>
    </div>
  )
}
