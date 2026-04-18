import { PageHeader } from '@/components/layout/page-header'
import { useScrollSpy } from '@/hooks/useScrollSpy'
import { cn } from '@/lib/utils/cn'
import { ReactNode, createRef, useMemo, useRef } from 'react'
import { SETTINGS_SECTIONS, sectionDomId } from './sections'
import { AboutSection } from './sections/AboutSection'
import { LLMProviderSection } from './sections/LLMProviderSection'
import { WhisperServerSection } from './sections/WhisperServerSection'

function SectionNavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-9 w-full items-center gap-3 rounded-xl px-2 text-sm',
        active ? 'bg-black/5' : 'hover:bg-black/[0.03]',
      )}
    >
      <span
        className={cn(
          'shrink-0',
          active ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {icon}
      </span>
      <span className={cn(!active && 'text-muted-foreground')}>{label}</span>
    </button>
  )
}

export function SettingsPage() {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Memoize once so refs and array identity stay stable across renders
  const sectionEntries = useMemo(
    () =>
      SETTINGS_SECTIONS.map((section) => ({
        ...section,
        ref: createRef<HTMLElement>(),
      })),
    [],
  )

  const sections = useMemo(
    () => sectionEntries.map(({ id, ref }) => ({ id, ref })),
    [sectionEntries],
  )

  const visible = useScrollSpy({ sections, rootRef: scrollRef })
  // Highlight only the topmost visible section (first one in registry order
  // that is intersecting); fall back to the first section before the observer
  // has fired so the nav is never blank.
  const activeId =
    sectionEntries.find((s) => visible.has(s.id))?.id ?? sectionEntries[0].id

  const scrollToSection = (id: string) => {
    const el = document.getElementById(sectionDomId(id))
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const refByid = (id: string) => sectionEntries.find((s) => s.id === id)!.ref

  return (
    <div className="flex h-full flex-col">
      <PageHeader>Settings</PageHeader>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-4xl px-8">
          <aside className="border-border w-[200px] shrink-0 border-r pr-8">
            <nav className="sticky top-0 flex flex-col gap-0.5 pt-6">
              {sectionEntries.map((section) => (
                <SectionNavButton
                  key={section.id}
                  icon={<section.icon size={18} />}
                  label={section.label}
                  active={section.id === activeId}
                  onClick={() => scrollToSection(section.id)}
                />
              ))}
            </nav>
          </aside>

          <div className="min-w-0 flex-1 py-6 pl-8">
            <WhisperServerSection ref={refByid('whisper-server')} />
            <LLMProviderSection ref={refByid('llm-provider')} />
            <AboutSection ref={refByid('about')} />
          </div>
        </div>
      </div>
    </div>
  )
}
