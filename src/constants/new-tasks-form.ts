import { NewTasks } from '@/types/new-tasks-form'

export const newTasksDefaultValues: NewTasks = {
  files: [],
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
