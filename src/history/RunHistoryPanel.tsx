import type { RunId, RunProjection, RunStatus } from '@/runtime/contracts'
import {
  operationIdFromProjection,
  type RunHistoryEntry,
} from './runHistory'

const statusLabels: Record<RunStatus, string> = {
  created: 'Creado',
  running: 'En curso',
  paused: 'Decisión pendiente',
  completed: 'Completado',
  failed: 'Falló',
}

const statusClasses: Record<RunStatus, string> = {
  created: 'bg-surface-tinted text-content-muted',
  running: 'bg-emphasis-normal-bg text-emphasis-normal-fg',
  paused: 'bg-emphasis-warning-bg text-emphasis-warning-fg',
  completed: 'bg-primary text-white',
  failed: 'bg-emphasis-critical-bg text-emphasis-critical-fg',
}

interface RunHistoryPanelProps {
  entries: RunHistoryEntry[]
  projection: RunProjection | null
  currentRunId: RunId | null
  onSelectRun: (runId: RunId) => void
}

export default function RunHistoryPanel({
  entries,
  projection,
  currentRunId,
  onSelectRun,
}: RunHistoryPanelProps) {
  const activeOperationId = projection ? operationIdFromProjection(projection) : null
  const operationEntries = activeOperationId
    ? entries.filter((entry) => entry.operationId === activeOperationId)
    : entries

  return (
    <aside className="surface-card p-5" aria-labelledby="run-history-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Runs sucesivos</p>
          <h2 id="run-history-title" className="mt-2 text-2xl">Historia de la operación</h2>
        </div>
        <span className="rounded-full bg-surface-tinted px-3 py-2 text-xs font-semibold text-content-muted">
          {operationEntries.length} {operationEntries.length === 1 ? 'run' : 'runs'}
        </span>
      </div>

      {operationEntries.length ? (
        <ol className="mt-5 space-y-2">
          {operationEntries.map((entry, index) => {
            const active = entry.runId === currentRunId
            return (
              <li key={entry.runId}>
                <button
                  type="button"
                  className={`w-full rounded-control border p-3 text-left transition duration-200 hover:border-primary ${
                    active ? 'border-primary bg-surface-tinted' : 'border-stroke bg-surface'
                  }`}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => onSelectRun(entry.runId)}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">Run {index + 1} · v{entry.workflowVersion}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[entry.status]}`}>
                      {statusLabels[entry.status]}
                    </span>
                  </span>
                  <span className="mt-2 block truncate font-mono text-xs text-content-muted">
                    {entry.runId}
                  </span>
                  {entry.currentStepTitle ? (
                    <span className="mt-1 block text-xs text-content-muted">{entry.currentStepTitle}</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="mt-5 text-sm leading-6 text-content-muted">
          Inicia los momentos 1–3. Cada respuesta con el mismo operationId quedará disponible aquí incluso después de recargar.
        </p>
      )}
    </aside>
  )
}
