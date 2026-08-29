import type { StepStatus } from '@/runtime/contracts'

const statusLabels: Record<StepStatus, string> = {
  pending: 'Pendiente',
  active: 'En curso',
  completed: 'Completado',
  attention: 'Requiere atención',
  failed: 'Falló',
}

interface GenericStepCardProps {
  title: string
  stepId?: string | null
  objective?: string | null
  summary?: string | null
  status?: StepStatus
}

export default function GenericStepCard({
  title,
  stepId,
  objective,
  summary,
  status = 'attention',
}: GenericStepCardProps) {
  return (
    <article className="rounded-control border border-emphasis-warning-border bg-emphasis-warning-bg p-ui-4 text-emphasis-warning-fg">
      <div className="flex flex-wrap items-start justify-between gap-ui-3">
        <div>
          <p className="text-ui-caption font-semibold uppercase tracking-wide opacity-75">
            Paso genérico
          </p>
          <h3 className="mt-ui-1 text-ui-title font-semibold">{title}</h3>
        </div>
        <span className="rounded-full border border-current/25 px-ui-2 py-ui-1 text-ui-caption font-semibold">
          {statusLabels[status]}
        </span>
      </div>
      {stepId ? <p className="mt-ui-2 font-mono text-ui-caption opacity-70">{stepId}</p> : null}
      {objective ? <p className="mt-ui-3 text-ui-body">{objective}</p> : null}
      {summary ? <p className="mt-ui-2 text-ui-caption opacity-80">{summary}</p> : null}
    </article>
  )
}
