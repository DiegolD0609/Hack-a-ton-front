import type { KeyValueProps } from '@/runtime/contracts'

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
} as const

const emphasisClasses = {
  normal: 'border-stroke bg-surface',
  warning: 'border-emphasis-warning-border bg-emphasis-warning-bg',
  critical: 'border-emphasis-critical-border bg-emphasis-critical-bg',
} as const

function displayValue(value: string | number | boolean): string {
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }
  return String(value)
}

export default function KeyValue({ title, items, columns = 1 }: KeyValueProps) {
  return (
    <section className="rounded-control border border-stroke bg-surface p-ui-4">
      {title ? <h3 className="text-ui-title font-semibold">{title}</h3> : null}
      <dl className={`mt-ui-4 grid gap-ui-3 ${columnClasses[columns]}`}>
        {items.map((item) => (
          <div
            key={item.key}
            className={`rounded-control border p-ui-3 ${emphasisClasses[item.emphasis ?? 'normal']}`}
          >
            <dt className="text-ui-caption font-semibold uppercase tracking-wide text-content-muted">
              {item.label}
            </dt>
            <dd className="mt-ui-1 break-words text-ui-body font-semibold text-content">
              {displayValue(item.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
