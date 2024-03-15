'use client'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { IconX } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'

export function WhisperServerNeedConfigure({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: (value: false) => void
}) {
  const router = useRouter()

  function handleNavigateWhisperServer() {
    onClose(false)
    router.push('/whisper-server')
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="flex max-w-md flex-col gap-2">
          <div className="text-lg">Need Configure</div>

          <div className="text-gray-600">
            <p>Whisper server is not configured yet.</p>
            <p>Please configure it first.</p>
          </div>

          <div className="flex justify-end gap-1">
            <Button
              icon={<IconX />}
              variant="ghost"
              onClick={() => onClose(false)}
            />
            <Button onClick={handleNavigateWhisperServer}>Let&apos;s go</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
