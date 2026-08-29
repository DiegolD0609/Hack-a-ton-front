import type { ReactNode } from 'react'
import type { SectionProps } from '@/runtime/contracts'

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
} as const

const emphasisClasses = {
  normal: 'emphasis-normal',
  warning: 'emphasis-warning',
  critical: 'emphasis-critical',
} as const

interface RuntimeSectionProps extends SectionProps {
  children: ReactNode
}

export default function Section({
  title,
  description,
  columns = 1,
  emphasis = 'normal',
  children,
}: RuntimeSectionProps) {
  return (
    <section className={`rounded-card border p-ui-6 ${emphasisClasses[emphasis]}`}>
      {title || description ? (
        <header className="mb-ui-4">
          {title ? <h2 className="text-ui-section">{title}</h2> : null}
          {description ? <p className="mt-ui-2 text-ui-body opacity-80">{description}</p> : null}
        </header>
      ) : null}
      <div className={`grid gap-ui-4 ${columnClasses[columns]}`}>{children}</div>
    </section>
  )
}
