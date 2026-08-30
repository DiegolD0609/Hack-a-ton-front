import type { RunProjection } from '@/runtime/contracts'
import StudioIcon from '@/components/studio/StudioIcon'

const knownTitles: Record<string, string> = {
  booking_received: 'Interpretar contexto',
  vessel_departure: 'Construir baseline',
  transshipment_anomaly: 'Detectar señal',
  route_resolution: 'Aplicar decisión',
  delivery_eta: 'Recomponer salida',
}

interface GraphStep {
  id: string
  title: string
  status: 'pending' | 'active' | 'done' | 'attention'
}

interface RunGraphProps {
  projection: RunProjection | null
  prompt: string
  runNumber: number
  autoMode: boolean
  onToggleAuto: () => void
  onAdvance: () => void
  canAdvance: boolean
}

export default function RunGraph({
  projection,
  prompt,
  runNumber,
  autoMode,
  onToggleAuto,
  onAdvance,
  canAdvance,
}: RunGraphProps) {
  const steps = buildSteps(projection)

  return (
    <section className="studio-panel studio-flow-panel" aria-labelledby="flow-title">
      <header className="studio-panel-header studio-flow-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="studio-index">03</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="flow-title" className="studio-panel-title">Workflow</h2>
              <span className="studio-run-chip">RUN {String(runNumber).padStart(2, '0')}</span>
            </div>
            <p className="studio-panel-subtitle truncate">{prompt || 'La secuencia del agente aparecerá aquí'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="studio-compact-button" onClick={onToggleAuto} aria-pressed={autoMode}>
            <StudioIcon name={autoMode ? 'pause' : 'play'} size={14} />
            {autoMode ? 'Pausar auto' : 'Reproducir'}
          </button>
          <button type="button" className="studio-icon-button" disabled={!canAdvance} onClick={onAdvance} aria-label="Avanzar un paso">
            <StudioIcon name="arrow" />
          </button>
        </div>
      </header>

      <div className="studio-flow-scroll">
        <ol className="studio-flow-track">
          {steps.map((step, index) => (
            <li key={step.id} className={`studio-flow-step is-${step.status}`}>
              <div className="flow-step-node">
                {step.status === 'done' ? (
                  <StudioIcon name="check" size={15} />
                ) : step.status === 'active' ? (
                  <StudioIcon name="bolt" size={14} />
                ) : step.status === 'attention' ? (
                  <span>!</span>
                ) : (
                  <span>{String(index + 1).padStart(2, '0')}</span>
                )}
              </div>
              <div className="flow-step-copy">
                <span>{step.status === 'active' ? 'Ejecutando' : step.status === 'attention' ? 'Revisión' : step.status === 'done' ? 'Listo' : 'Siguiente'}</span>
                <p>{step.title}</p>
              </div>
              {index < steps.length - 1 ? <span className="flow-connector" /> : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function buildSteps(projection: RunProjection | null): GraphStep[] {
  const ids = ['booking_received', 'vessel_departure', 'transshipment_anomaly', 'route_resolution', 'delivery_eta', 'studio_learning']
  const completed = new Set(
    projection?.recentEvents
      .filter((event) => event.type === 'STEP_COMPLETED' && event.stepId)
      .map((event) => event.stepId!.replace('step_', '')) ?? [],
  )
  const active = projection?.currentStep?.id.replace('step_', '')
  const isPaused = projection?.status === 'paused'

  return ids.map((id) => {
    const isStudio = id === 'studio_learning'
    const actualActive = isStudio ? active?.startsWith('studio-') : active === id
    const actualCompleted = isStudio
      ? [...completed].some((stepId) => stepId.startsWith('studio-'))
      : completed.has(id)
    return {
      id,
      title: isStudio ? 'Aprender del feedback' : knownTitles[id],
      status: actualCompleted ? 'done' : actualActive ? (isPaused ? 'attention' : 'active') : 'pending',
    }
  })
}
