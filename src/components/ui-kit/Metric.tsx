import type { MetricProps } from '@/runtime/contracts'

const emphasisClasses = {
  normal: 'emphasis-normal',
  warning: 'emphasis-warning',
  critical: 'emphasis-critical',
} as const

const trendLabels = {
  up: 'Tendencia ascendente',
  down: 'Tendencia descendente',
  flat: 'Sin cambio',
} as const

export default function Metric({
  label,
  value,
  supportingText,
  trend,
  emphasis = 'normal',
}: MetricProps) {
  return (
    <article className={`rounded-control border p-ui-4 ${emphasisClasses[emphasis]}`}>
      <p className="text-ui-label font-semibold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-ui-2 text-2xl font-bold" data-testid="runtime-metric-value">
        {value}
      </p>
      {supportingText || trend ? (
        <p className="mt-ui-2 text-ui-caption opacity-75">
          {supportingText}
          {supportingText && trend ? ' · ' : null}
          {trend ? trendLabels[trend] : null}
        </p>
      ) : null}
    </article>
  )
}
