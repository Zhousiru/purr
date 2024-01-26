import Modal from '@/components/ui/modal'

export function NewTaskModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: (value: false) => void
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      233
    </Modal>
  )
}
