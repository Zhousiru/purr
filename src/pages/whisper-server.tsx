import { PageHeader } from '@/components/layout/page-header'
import { WhisperServerConfigForm } from '@/components/layout/whisper-server-config-form'
import { WhisperServerTerminal } from '@/components/layout/whisper-server-terminal'

export function WhisperServerPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader>Whisper Server</PageHeader>
      <div className="flex grow">
        <div className="relative z-10 w-[300px] shadow">
          <WhisperServerConfigForm className="absolute inset-0 overflow-y-auto p-4" />
        </div>
        <WhisperServerTerminal />
      </div>
    </div>
  )
}
