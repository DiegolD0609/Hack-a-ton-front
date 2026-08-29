import type { ComparableValue, CompareProps } from '@/runtime/contracts'

const outcomeLabels = {
  same: 'Sin cambio',
  changed: 'Cambió',
  improved: 'Mejoró',
  worse: 'Empeoró',
  attention: 'Atención',
} as const

const outcomeClasses = {
  same: 'bg-surface-tinted text-content-muted',
  changed: 'bg-emphasis-normal-bg text-emphasis-normal-fg',
  improved: 'bg-emphasis-normal-bg text-emphasis-normal-fg',
  worse: 'bg-emphasis-critical-bg text-emphasis-critical-fg',
  attention: 'bg-emphasis-warning-bg text-emphasis-warning-fg',
} as const

function displayValue(value: ComparableValue): string {
  if (value === null) {
    return '—'
  }
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }
  return String(value)
}

export default function Compare({ title, leftLabel, rightLabel, rows }: CompareProps) {
  return (
    <section className="overflow-hidden rounded-control border border-stroke bg-surface">
      <div className="border-b border-stroke px-ui-4 py-ui-3">
        <h3 className="text-ui-title font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-ui-body">
          <thead className="bg-surface-tinted text-ui-caption uppercase tracking-wide text-content-muted">
            <tr>
              <th className="px-ui-4 py-ui-3" scope="col">Dato</th>
              <th className="px-ui-4 py-ui-3" scope="col">{leftLabel}</th>
              <th className="px-ui-4 py-ui-3" scope="col">{rightLabel}</th>
              <th className="px-ui-4 py-ui-3" scope="col">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-stroke first:border-t-0">
                <th className="px-ui-4 py-ui-3 font-semibold text-content" scope="row">
                  {row.label}
                </th>
                <td className="px-ui-4 py-ui-3 text-content-muted">{displayValue(row.before)}</td>
                <td className="px-ui-4 py-ui-3 font-semibold text-content">{displayValue(row.after)}</td>
                <td className="px-ui-4 py-ui-3">
                  <span className={`rounded-full px-ui-2 py-ui-1 text-ui-caption font-semibold ${outcomeClasses[row.outcome]}`}>
                    {outcomeLabels[row.outcome]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
