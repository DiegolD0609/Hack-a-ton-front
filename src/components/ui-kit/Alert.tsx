import type { AlertProps } from '@/runtime/contracts'

const emphasisClasses = {
  normal: 'emphasis-normal',
  warning: 'emphasis-warning',
  critical: 'emphasis-critical',
} as const

export default function Alert({ title, message, emphasis }: AlertProps) {
  return (
    <aside
      className={`rounded-control border-l-4 p-ui-4 ${emphasisClasses[emphasis]}`}
      role={emphasis === 'critical' ? 'alert' : 'status'}
    >
      <p className="text-ui-caption font-semibold uppercase tracking-wide opacity-75">
        Hallazgo del agente
      </p>
      <h3 className="mt-ui-1 text-ui-title font-semibold">{title}</h3>
      <p className="mt-ui-2 text-ui-body">{message}</p>
    </aside>
  )
}
