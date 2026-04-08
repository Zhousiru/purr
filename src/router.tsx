import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'
import { RootLayout } from './components/layout/root-layout'
import { EditorPage } from './pages/editor'
import { SettingsPage } from './pages/settings'
import { TasksPage } from './pages/tasks'
import { WhisperServerPage } from './pages/whisper-server'

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/tasks' })
  },
})

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  component: TasksPage,
})

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/editor',
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || undefined,
  }),
  component: EditorPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const whisperServerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/whisper-server',
  component: WhisperServerPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  tasksRoute,
  editorRoute,
  settingsRoute,
  whisperServerRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
