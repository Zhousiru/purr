import { NewTasks } from '@/types/new-tasks-form'

export const newTasksDefaultValues: NewTasks = {
  files: [],
  transcriptionOption: {
    language: '',
    prompt: '',
    vadFilter: true,
  },
  translationOption: { model: 'gpt-3.5-turbo', batchSize: 20, prompt: '' },
  state: {
    createTranscription: true,
    createTranslation: true,
    autoLanguage: true,
  },
}
