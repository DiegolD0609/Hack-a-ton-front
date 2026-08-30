import type { RunProjection, UISpec } from '@/runtime/contracts'
import StudioIcon from '@/components/studio/StudioIcon'

const eventCopy: Record<string, { label: string; tone: 'quiet' | 'active' | 'done' | 'attention' }> = {
  RUN_STARTED: { label: 'Run inicializado', tone: 'done' },
  STEP_STARTED: { label: 'Nuevo paso en ejecución', tone: 'active' },
  STEP_COMPLETED: { label: 'Resultado integrado al estado', tone: 'done' },
  STATE_UPDATED: { label: 'Estado actualizado', tone: 'done' },
  UI_UPDATED: { label: 'Interfaz recompuesta', tone: 'active' },
  DECISION_REQUIRED: { label: 'Criterio humano requerido', tone: 'attention' },
  ACTION_ACCEPTED: { label: 'Decisión aplicada', tone: 'done' },
  ACTION_REJECTED: { label: 'Decisión rechazada por policy', tone: 'attention' },
  RUN_PAUSED: { label: 'Run en pausa', tone: 'attention' },
  RUN_RESUMED: { label: 'Run reanudado', tone: 'active' },
  RUN_COMPLETED: { label: 'Run completado', tone: 'done' },
  ERROR: { label: 'Error del runtime', tone: 'attention' },
}

interface AgentTraceProps {
  projection: RunProjection | null
  uiSpec: UISpec | null
  transportLabel: string
}

export default function AgentTrace({ projection, uiSpec, transportLabel }: AgentTraceProps) {
  const events = projection?.recentEvents.slice(-7).reverse() ?? []

  return (
    <section className="studio-panel studio-trace-panel" aria-labelledby="trace-title">
      <header className="studio-panel-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="studio-index">02</span>
          <div className="min-w-0">
            <h2 id="trace-title" className="studio-panel-title">Agent trace</h2>
            <p className="studio-panel-subtitle">Decisiones observables, no caja negra</p>
          </div>
        </div>
        <span className="studio-live-badge"><i />{transportLabel}</span>
      </header>

      <div className="studio-trace-current">
        <div className="flex items-start justify-between gap-4">
          <span className="studio-kicker">
            <StudioIcon name="spark" size={14} />
            Ahora
          </span>
          {projection ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/35">
              state {projection.stateVersion}
            </span>
          ) : null}
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-[-0.025em] text-[#171714]">
          {projection?.currentStep?.title ?? (projection?.status === 'completed' ? 'Aprendizaje integrado' : 'Esperando un nuevo objetivo')}
        </h3>
        <p className="mt-2 text-sm leading-6 text-black/55">
          {uiSpec?.reason
            ?? projection?.currentStep?.objective
            ?? 'Cuando inicies un run, este panel explicará qué cambió y qué evidencia usó el agente.'}
        </p>
        {projection?.pendingDecision ? (
          <div className="studio-attention-note">
            <StudioIcon name="message" size={16} />
            <span>{projection.pendingDecision.prompt}</span>
          </div>
        ) : null}
      </div>

      <div className="studio-trace-stream">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">
            Live event log
          </span>
          <span className="font-mono text-[10px] text-black/35">
            {projection ? `${projection.lastSequence} eventos` : 'sin eventos'}
          </span>
        </div>

        {events.length ? (
          <ol className="space-y-1">
            {events.map((event) => {
              const copy = eventCopy[event.type] ?? { label: event.type, tone: 'quiet' as const }
              return (
                <li key={event.eventId} className="studio-trace-event">
                  <span className={`trace-marker is-${copy.tone}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-xs font-semibold text-[#171714]">{copy.label}</p>
                      <span className="shrink-0 font-mono text-[9px] text-black/30">
                        {String(event.sequence).padStart(2, '0')}
                      </span>
                    </div>
                    {event.stepId ? (
                      <p className="mt-0.5 truncate font-mono text-[10px] text-black/40">
                        {event.stepId.replace('step_', '').replaceAll('_', ' ')}
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        ) : (
          <div className="rounded-xl border border-dashed border-black/15 px-4 py-7 text-center text-xs leading-5 text-black/40">
            El log append-only aparecerá aquí en tiempo real.
          </div>
        )}
      </div>

      {uiSpec ? (
        <details className="studio-spec-details">
          <summary>
            <span className="flex items-center gap-2"><StudioIcon name="braces" size={15} />UISpec actual</span>
            <StudioIcon name="chevron" size={14} />
          </summary>
          <pre>{JSON.stringify({ generatedBy: uiSpec.generatedBy, reason: uiSpec.reason, stateVersion: uiSpec.stateVersion }, null, 2)}</pre>
        </details>
      ) : null}
    </section>
  )
}
