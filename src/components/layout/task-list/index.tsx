import { Task } from '@/types/task'
import { TaskItem } from './TaskItem'

export function TaskList() {
  const mockTasks: Task[] = [
    {
      name: 'Transcription Task 1',
      group: 'Group 1',
      status: 'stopped',
      type: 'transcribe',
      options: {
        sourcePath: '/path/to/audio/file1.mp3',
        sourceMeta: {
          length: 180,
        },
        language: 'en',
        translateWith: {
          batchSize: 20,
          prompt: 'translate this',
        },
      },
      result: {
        progress: 50,
        transcription: [
          {
            start: 0,
            end: 60,
            text: 'This is a sample transcription for the first minute of the audio.',
          },
        ],
      },
    },
    {
      name: 'Transcription Task 2',
      group: 'Group 1',
      status: 'processing',
      type: 'transcribe',
      options: {
        sourcePath: '/path/to/audio/file2.mp3',
        sourceMeta: {
          length: 240,
        },
        language: 'en',
        translateWith: null,
      },
      result: {
        progress: 25,
        transcription: [
          {
            start: 0,
            end: 60,
            text: 'This is a sample transcription for the first minute of the second audio.',
          },
        ],
      },
    },
    {
      name: 'Transcription Task 3',
      group: 'Group 1',
      status: 'queued',
      type: 'transcribe',
      options: {
        sourcePath: '/path/to/audio/file1.mp3',
        sourceMeta: {
          length: 180,
        },
        language: 'en',
        translateWith: {
          batchSize: 20,
          prompt: 'translate this',
        },
      },
      result: null,
    },
    {
      name: 'Transcription Task 4',
      group: 'Group 2',
      status: 'done',
      type: 'transcribe',
      options: {
        sourcePath: '/path/to/audio/file1.mp3',
        sourceMeta: {
          length: 180,
        },
        language: 'en',
        translateWith: {
          batchSize: 20,
          prompt: 'translate this',
        },
      },
      result: {
        progress: 100,
        transcription: [
          {
            start: 0,
            end: 60,
            text: 'This is a sample transcription for the first minute of the second audio.',
          },
        ],
      },
    },
    {
      name: 'Translation Task 1',
      group: 'Group 1',
      status: 'stopped',
      type: 'translate',
      options: {
        transcription: [
          {
            start: 0,
            end: 60,
            text: 'This is a sample transcription for translation.',
          },
        ],
        prompt: 'Translate this text',
        batchSize: 1,
      },
      result: {
        progress: 100,
        translation: [
          {
            start: 0,
            end: 60,
            text: 'This is a sample transcription for translation.',
            translated: '这是一个用于翻译的样本转录。',
          },
        ],
      },
    },
    {
      name: 'Translation Task 2',
      group: 'Group 2',
      status: 'processing',
      type: 'translate',
      options: {
        transcription: [
          {
            start: 0,
            end: 60,
            text: 'This is another sample transcription for translation.',
          },
        ],
        prompt: 'Translate this other text',
        batchSize: 1,
      },
      result: {
        progress: 100,
        translation: [
          {
            start: 0,
            end: 60,
            text: 'This is another sample transcription for translation.',
            translated: '这是另一个用于翻译的样本转录。',
          },
        ],
      },
    },
  ]

  return (
    <div className="flex flex-col gap-2 p-2">
      {mockTasks.map((t) => (
        <TaskItem key={t.name} data={t} />
      ))}
      <div className="flex h-8 items-center justify-center text-sm font-light text-gray-400">
        {mockTasks.length} task(s)
      </div>
    </div>
  )
}
