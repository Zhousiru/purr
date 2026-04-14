import { Modal } from '@/components/ui/modal'
import { DownloadResult, UrlMetadata } from '@/types/commands'
import { useState } from 'react'
import { ConfigStep } from './config-step'
import { ImportStep } from './import-step'

interface Completed {
  metadata: UrlMetadata
  downloadResult: DownloadResult
}

export function NewUrlTaskModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: (value: boolean) => void
}) {
  const [completed, setCompleted] = useState<Completed | null>(null)
  const [downloading, setDownloading] = useState(false)

  // React's "reset state on prop change" pattern — fresh flow each reopen.
  const [prevOpen, setPrevOpen] = useState(isOpen)
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      setCompleted(null)
      setDownloading(false)
    }
  }

  function close() {
    onClose(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} dismissible={!downloading}>
      {completed ? (
        <ConfigStep
          metadata={completed.metadata}
          downloadResult={completed.downloadResult}
          onCancel={close}
        />
      ) : (
        <ImportStep
          onCancel={close}
          onStartDownload={() => setDownloading(true)}
          onComplete={(metadata, downloadResult) => {
            setDownloading(false)
            setCompleted({ metadata, downloadResult })
          }}
        />
      )}
    </Modal>
  )
}
