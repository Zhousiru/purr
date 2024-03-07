import { NewTasks } from '@/types/new-tasks-form'

export const newTasksDefaultValues: NewTasks = {
  files: [],
  transcribeOption: {
    language: '',
    prompt: '',
    vadFilter: true,
  },
  translationOption: { model: 'gpt-3.5-turbo', batchSize: 20, prompt: '' },
  state: {
    autoLanguage: true,
    createTranslation: true,
  },
}
