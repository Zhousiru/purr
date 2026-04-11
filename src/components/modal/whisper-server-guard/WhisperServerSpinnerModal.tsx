import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils/cn'
import { IconLoader2, IconX } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'

export function WhisperServerSpinnerModal({
  isOpen,
  onClose,
  isFailed,
}: {
  isOpen: boolean
  onClose: (value: boolean) => void
  isFailed: boolean
}) {
  const navigate = useNavigate()

  function handleUserClose() {
    if (isFailed) {
      onClose(false)
    }
  }

  function handleNavigateWhisperServer() {
    onClose(false)
    navigate({ to: '/whisper-server' })
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleUserClose}
        className={cn(!isFailed && 'w-fit')}
        noAutoFocus
      >
        {!isFailed ? (
          <div className="flex w-[250px] flex-col gap-2">
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <IconLoader2 size={18} className="animate-spin" />
                Launching whisper server...
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="text-lg">Something&apos;s Wrong</div>
              <div className="text-muted-foreground">
                <p>Failed to launch or connect whisper server.</p>
                <p>Please check your configuration.</p>
              </div>
              <div className="flex justify-end gap-1">
                <Button
                  icon={<IconX />}
                  variant="ghost"
                  onClick={() => onClose(false)}
                />
                <Button onClick={handleNavigateWhisperServer}>Check now</Button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
