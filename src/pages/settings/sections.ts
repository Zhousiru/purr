import {
  IconEar,
  IconInfoCircle,
  IconSparkles,
} from '@tabler/icons-react'

export type SettingsSection = {
  id: string
  label: string
  icon: typeof IconEar
}

// Single source of truth for left-nav buttons and right-column section titles.
// Keep `label` identical to the title rendered inside each section.
export const SETTINGS_SECTIONS = [
  { id: 'whisper-server', label: 'Whisper Server', icon: IconEar },
  { id: 'llm-provider', label: 'LLM Provider', icon: IconSparkles },
  { id: 'about', label: 'About', icon: IconInfoCircle },
] as const satisfies readonly SettingsSection[]

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]['id']

export const sectionDomId = (id: string) => `settings-section-${id}`
