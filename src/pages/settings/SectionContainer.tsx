import { forwardRef, ReactNode } from 'react'
import { sectionDomId } from './sections'

type SectionContainerProps = {
  id: string
  title: string
  description?: ReactNode
  children: ReactNode
}

export const SectionContainer = forwardRef<HTMLElement, SectionContainerProps>(
  function SectionContainer({ id, title, description, children }, ref) {
    return (
      <section
        ref={ref}
        id={sectionDomId(id)}
        className="scroll-mt-6 py-8 first:pt-2"
      >
        <h2 className="text-base font-medium">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        )}
        <div className="mt-5 flex flex-col gap-4">{children}</div>
      </section>
    )
  },
)
