import { IconBrandGithub, IconBug } from '@tabler/icons-react'
import { openUrl } from '@tauri-apps/plugin-opener'
import { forwardRef, ReactNode } from 'react'
import { SectionContainer } from '../SectionContainer'

const REPO_URL = 'https://github.com/zhousiru/purr'
const ISSUES_URL = `${REPO_URL}/issues`

export const AboutSection = forwardRef<HTMLElement>(
  function AboutSection(_, ref) {
    return (
      <SectionContainer ref={ref} id="about" title="About">
        <div className="flex flex-col gap-3 text-sm">
          <Row label="Version">
            <span className="tabular-nums">{__APP_VERSION__}</span>
          </Row>

          <Row label="GitHub">
            <ExternalLink href={REPO_URL}>
              <IconBrandGithub size={14} />
              zhousiru/purr
            </ExternalLink>
          </Row>

          <Row label="Feedback">
            <ExternalLink href={ISSUES_URL}>
              <IconBug size={14} />
              Report an issue
            </ExternalLink>
          </Row>
        </div>
      </SectionContainer>
    )
  },
)

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function ExternalLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <button
      onClick={() => openUrl(href)}
      className="hover:text-foreground text-muted-foreground inline-flex items-center gap-1.5"
    >
      {children}
    </button>
  )
}
