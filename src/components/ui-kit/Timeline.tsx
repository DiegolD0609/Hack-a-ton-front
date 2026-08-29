import type { StepStatus, TimelineProps } from '@/runtime/contracts'

const statusLabels: Record<StepStatus, string> = {
  pending: 'Pendiente',
  active: 'En curso',
  completed: 'Completado',
  attention: 'Atención',
  failed: 'Falló',
}

const markerClasses: Record<StepStatus, string> = {
  pending: 'border-stroke bg-surface',
  active: 'border-primary bg-primary',
  completed: 'border-emphasis-normal-border bg-emphasis-normal-fg',
  attention: 'border-emphasis-warning-border bg-emphasis-warning-fg',
  failed: 'border-emphasis-critical-border bg-emphasis-critical-fg',
}

function displayTimestamp(timestamp?: string | null): string | null {
  if (!timestamp) {
    return null
  }
  const date = new Date(timestamp)
  return Number.isNaN(date.valueOf())
    ? null
    : new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}

export default function Timeline({ title, items }: TimelineProps) {
  return (
    <section className="rounded-control border border-stroke bg-surface p-ui-4">
      {title ? <h3 className="text-ui-title font-semibold">{title}</h3> : null}
      <ol className="mt-ui-4 space-y-ui-3">
        {items.map((item, index) => {
          const timestamp = displayTimestamp(item.timestamp)
          return (
            <li key={item.id} className="relative grid grid-cols-[1.25rem_1fr] gap-ui-3">
              {index < items.length - 1 ? (
                <span className="absolute bottom-[-0.75rem] left-[0.59375rem] top-5 w-px bg-stroke" />
              ) : null}
              <span
                className={`mt-1 h-5 w-5 rounded-full border-4 ${markerClasses[item.status]}`}
                aria-hidden="true"
              />
              <div className="pb-ui-2">
                <div className="flex flex-wrap items-baseline justify-between gap-ui-2">
                  <p className="text-ui-label font-semibold text-content">{item.title}</p>
                  <span className="text-ui-caption font-semibold text-content-muted">
                    {statusLabels[item.status]}
                  </span>
                </div>
                {item.detail ? <p className="mt-ui-1 text-ui-caption text-content-muted">{item.detail}</p> : null}
                {timestamp ? <time className="mt-ui-1 block text-ui-caption text-content-muted">{timestamp}</time> : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
