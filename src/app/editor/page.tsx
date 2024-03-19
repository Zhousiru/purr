'use client'

import { ClientOnly } from '@/components/common/client-only'
import { Waveform } from '@/components/common/waveform'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { cmd } from '@/lib/commands'
import { useState } from 'react'

export default function Page() {
  const [data, setData] = useState<Array<Float32Array> | null>(null)

  async function handleDebugGetWaveform() {
    const result = await cmd.getAudioWaveformData({
      path: String.raw`C:\Users\Syrhu\Desktop\foxfox.wav`,
      startSec: 460,
      endSec: 540,
      pairPerSec: 15,
    })
    const typed = result.map((x) => {
      if (!x.error) {
        return new Float32Array(x.data!)
      }
      throw new Error(x.error)
    })

    setData(typed)
  }

  return (
    <div className="flex h-screen flex-col">
      <PageHeader>Editor</PageHeader>
      <div className="flex flex-grow divide-x">
        <div className="w-[80px] bg-gray-100"></div>
        <div className="flex w-[350px] bg-gray-100">
          <ClientOnly>{data && <Waveform data={data[0]} />}</ClientOnly>
        </div>
      </div>

      <div className="absolute bottom-2 right-2">
        <Button onClick={handleDebugGetWaveform}>Get waveform</Button>
      </div>
    </div>
  )
}
