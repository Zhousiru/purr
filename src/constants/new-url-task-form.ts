import { NewUrlTask } from '@/types/new-url-task-form'

export const newUrlTaskDefaultValues: NewUrlTask = {
  url: '',
  group: 'Default',
  transcriptionOption: {
    language: '',
    prompt: '',
    vadFilter: true,
  },
  state: {
    createTranscription: true,
    autoLanguage: true,
  },
}
