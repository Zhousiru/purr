import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { IconX } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'

export function WhisperServerNeedConfigureModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: (value: boolean) => void
}) {
  const navigate = useNavigate()

  function handleNavigateWhisperServer() {
    onClose(false)
    navigate({ to: '/whisper-server' })
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
