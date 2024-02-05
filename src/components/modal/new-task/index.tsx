import { FileList } from '@/components/layout/file-list'
import { TranslationOptionsForm } from '@/components/layout/translation-options-form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import {
  IconChevronRight,
  IconPlus,
  IconRestore,
  IconX,
} from '@tabler/icons-react'
import { useState } from 'react'

export function NewTaskModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: (value: false) => void
}) {
  const [fileData, setFileData] = useState<string[]>([
    '/test/1.mp3',
    '/test/22.mp3',
    '/test/32.mp3',
    '/test/43221.mp3',
    '/test/5322311.mp3',
    '/data/132131233.mp3',
    '/data/2321.mp3',
    '/data/data/data/data/data/data/data/data/data/data/data/data/data/data/data/data/data/data/data/data/data/data/data/data/data/data/2.mp3',
  ])

  let step: number = 3

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-2">
        {step === 1 && (
          <>
            <div className="text-lg">Select files</div>

            <div className="flex gap-1">
              <Button icon={<IconPlus />} variant="outline" />
              <Button icon={<IconRestore />} variant="ghost">
                Reset
              </Button>
            </div>

            <FileList data={fileData} onChange={setFileData} />
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-lg">Transcription Options</div>
            <label>Language</label>
            <Checkbox>Auto detect</Checkbox>
            <Input
              type="text"
              className="w-[200px]"
              placeholder="e.g. English / Japanese"
            />
            <label>Initial prompt</label>
            <Textarea className="max-h-[25vh] min-h-14" />
            <Checkbox>Use VAD filter</Checkbox>
            <Checkbox>Create translation task</Checkbox>
          </>
        )}

        {step === 3 && <TranslationOptionsForm />}

        <div className="flex justify-end gap-1">
          <Button icon={<IconX />} variant="ghost">
            Cancel
          </Button>
          <Button icon={<IconChevronRight />} />
        </div>
      </div>
    </Modal>
  )
}
