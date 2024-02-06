import { ClientOnly } from '@/components/common/client-only'
import { PageHeader } from '@/components/layout/page-header'
import { WhisperServerConfigForm } from '@/components/layout/whisper-server-config-form'

export default function Page() {
  return (
    <div className="flex h-screen flex-col">
      <PageHeader>Whisper Server</PageHeader>
      <div className="flex flex-grow">
        <div className="relative min-w-[300px] shadow">
          <ClientOnly>
            <WhisperServerConfigForm className="absolute inset-0 overflow-y-auto p-4" />
          </ClientOnly>
        </div>

        <div className="flex-grow bg-gray-600 p-4 font-mono text-white">
          Terminal
        </div>
      </div>
    </div>
  )
}
