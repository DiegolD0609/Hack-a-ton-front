import type { ReactNode } from 'react'
import type { PageProps } from '@/runtime/contracts'

interface RuntimePageProps extends PageProps {
  children: ReactNode
}

export default function Page({ title, subtitle, eyebrow, children }: RuntimePageProps) {
  return (
    <section className="space-y-ui-8" aria-labelledby="runtime-page-title">
      <header className="max-w-3xl">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 id="runtime-page-title" className="mt-ui-2 text-ui-display text-content">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-ui-3 text-ui-body text-content-muted">{subtitle}</p>
        ) : null}
      </header>
      <div className="space-y-ui-6">{children}</div>
    </section>
  )
}
