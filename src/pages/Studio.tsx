import { useEffect, useMemo, useState } from 'react'
import type { DecisionActionRequest } from '@/components/ui-kit'
import AgentTrace from '@/components/studio/AgentTrace'
import RunGraph from '@/components/studio/RunGraph'
import StudioCanvas from '@/components/studio/StudioCanvas'
import StudioIcon from '@/components/studio/StudioIcon'
import {
  ID_PATTERNS,
  type JsonValue,
  type RunId,
  type RunProjection,
} from '@/runtime/contracts'
import useRunSocket from '@/runtime/useRunSocket'

const WAITING_RUN_ID = 'run_waiting_for_studio' as RunId
const DEFAULT_PROMPT = 'Crea una interfaz operativa que priorice la anomalía, mantenga la decisión humana visible y explique por qué cambia cada componente.'

interface WorkflowVersionResponse {
  workflowId: string
  workflowVersionId: string
  version: number
}

interface GuideRule {
  id: string
  text: string
  source: 'brief' | 'feedback'
}

const seedRules: GuideRule[] = [
  { id: 'primary-action', text: 'Mantén visible la acción principal.', source: 'brief' },
  { id: 'explain-change', text: 'Explica por qué cambió la interfaz.', source: 'brief' },
]

type RequestPhase = 'idle' | 'preparing' | 'advancing' | 'submitting'
type FeedbackRating = 'useful' | 'not-useful' | null

function apiEndpoint(apiUrl: string, path: string): string {
  const url = new URL(apiUrl, window.location.origin)
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path}`
  url.search = ''
  return url.toString()
}

async function postJSON<T>(apiUrl: string, path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(apiEndpoint(apiUrl, path), {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: unknown } | null
    const detail = typeof payload?.detail === 'string' ? payload.detail : `El backend respondió ${response.status}.`
    throw new Error(detail)
  }
  return response.json() as Promise<T>
}

function learnedObjective(prompt: string, rules: GuideRule[]): string {
  const guide = rules.map((rule) => rule.text).join(' ')
  return `${prompt.trim()} Guía aprendida: ${guide}`.slice(0, 500)
}

function transportLabel(transport: 'offline' | 'websocket' | 'polling'): string {
  if (transport === 'websocket') return 'Live'
  if (transport === 'polling') return 'Polling'
  return 'Offline'
}

export default function Studio() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [committedPrompt, setCommittedPrompt] = useState('')
  const [runId, setRunId] = useState<RunId | null>(null)
  const [runNumber, setRunNumber] = useState(1)
  const [guideRules, setGuideRules] = useState<GuideRule[]>(seedRules)
  const [phase, setPhase] = useState<RequestPhase>('idle')
  const [autoMode, setAutoMode] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState<FeedbackRating>(null)
  const [feedback, setFeedback] = useState('')
  const [guideOpen, setGuideOpen] = useState(true)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
  const token = import.meta.env.VITE_DEMO_TOKEN || 'placeholder'
  const pollingEnabled = import.meta.env.VITE_RUNTIME_POLLING === 'true'
  const runtime = useRunSocket({
    runId: runId ?? WAITING_RUN_ID,
    apiUrl,
    token,
    enabled: runId !== null,
    pollingEnabled,
  })

  const projection = runtime.projection
  const isLearningReview = Boolean(
    projection?.status === 'paused' && projection.currentStep?.type === 'studio.learning',
  )
  const isPreparing = phase === 'preparing'
  const isBuilding = isPreparing || phase === 'advancing' || projection?.status === 'running'
  const canAdvance = Boolean(
    runId && projection?.status === 'running' && phase === 'idle' && runtime.transport !== 'offline',
  )

  const sessionStatus = useMemo(() => {
    if (error) return 'Atención requerida'
    if (isPreparing) return 'Preparando run'
    if (!runId) return 'Studio listo'
    if (projection?.status === 'completed') return 'Run completado'
    if (projection?.status === 'paused') return isLearningReview ? 'Esperando feedback' : 'Esperando decisión'
    if (projection?.status === 'running') return 'Agente trabajando'
    return 'Conectando runtime'
  }, [error, isLearningReview, isPreparing, projection?.status, runId])

  const createRun = async () => {
    const cleanPrompt = prompt.trim()
    if (!cleanPrompt || phase !== 'idle') return

    setPhase('preparing')
    setError(null)
    setRating(null)
    setFeedback('')
    try {
      // The seed run gives us the backend-owned workflow id. The visible run
      // then targets an immutable new version that contains this exact brief.
      const seed = await postJSON<RunProjection>(apiUrl, '/runs')
      const stepId = `studio-${Date.now().toString(36)}`
      const version = await postJSON<WorkflowVersionResponse>(
        apiUrl,
        `/workflows/${encodeURIComponent(seed.workflowId)}/versions`,
        {
          baseVersion: seed.workflowVersion,
          steps: [
            {
              id: stepId,
              type: 'studio.learning',
              title: 'Adaptar la interfaz al brief',
              objective: learnedObjective(cleanPrompt, guideRules),
              inputs: [
                'booking_received.data.booking.destination',
                'transshipment_anomaly.data.delay_days',
                'delivery_eta.data.final_eta',
              ],
              requiresHumanReview: true,
            },
          ],
        },
      )
      const created = await postJSON<RunProjection>(apiUrl, '/runs', {
        workflowVersionId: version.workflowVersionId,
      })
      if (!created.runId || !ID_PATTERNS.run.test(created.runId)) {
        throw new Error('El backend no devolvió un runId válido.')
      }
      setCommittedPrompt(cleanPrompt)
      setRunId(created.runId)
      setAutoMode(true)
      setRunNumber((current) => runId ? current + 1 : current)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible iniciar el run.')
    } finally {
      setPhase('idle')
    }
  }

  const advance = async () => {
    if (!runId || !canAdvance) return
    setPhase('advancing')
    setError(null)
    try {
      await postJSON<RunProjection>(apiUrl, '/demo/advance', { runId })
    } catch (requestError) {
      setAutoMode(false)
      setError(requestError instanceof Error ? requestError.message : 'No fue posible avanzar el run.')
    } finally {
      setPhase('idle')
    }
  }

  useEffect(() => {
    if (!autoMode || !canAdvance) return
    const waitingForUpgrade = runtime.uiSpec?.generatedBy === 'deterministic'
    const timer = window.setTimeout(() => void advance(), waitingForUpgrade ? 3600 : 2200)
    return () => window.clearTimeout(timer)
    // advance is intentionally represented by the state dependencies below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoMode,
    canAdvance,
    projection?.stateVersion,
    runtime.uiSpec?.generatedBy,
  ])

  const submitRuntimeAction = (request: DecisionActionRequest, payload: JsonValue = {}) => {
    const sent = runtime.submitAction(request, payload)
    if (!sent) setError('La acción no pudo salir por el canal en tiempo real.')
  }

  const submitFeedback = () => {
    if (!projection?.pendingDecision || !projection.availableActions[0] || phase !== 'idle') return
    setPhase('submitting')
    const cleanFeedback = feedback.trim()
    if (cleanFeedback) {
      setGuideRules((rules) => [
        ...rules,
        { id: `feedback-${Date.now().toString(36)}`, text: cleanFeedback, source: 'feedback' },
      ])
    } else if (rating === 'useful') {
      setGuideRules((rules) => [
        ...rules,
        { id: `feedback-${Date.now().toString(36)}`, text: 'Conservar la jerarquía visual de este resultado.', source: 'feedback' },
      ])
    }
    submitRuntimeAction({
      decisionId: projection.pendingDecision.decisionId,
      actionId: projection.availableActions[0].actionId,
    })
    window.setTimeout(() => setPhase('idle'), 500)
  }

  return (
    <div className="studio-shell">
      <header className="studio-topbar">
        <a className="studio-brand" href="/" aria-label="Kernel Studio, inicio">
          <span className="studio-brand-mark">K</span>
          <span>
            <b>Kernel</b>
            <small>Agent learning studio</small>
          </span>
        </a>

        <div className="studio-session-status" role="status">
          <span className={`status-orb ${projection?.status === 'paused' ? 'is-paused' : ''}`} />
          <span>{sessionStatus}</span>
          {runId ? <code>{runId.slice(-8)}</code> : null}
        </div>

        <div className="studio-top-actions">
          <span className="hidden text-xs font-medium text-black/45 sm:inline">NextWave · Challenge 03</span>
          <button type="button" className="studio-icon-button" aria-label="Reiniciar vista" onClick={() => window.location.reload()}>
            <StudioIcon name="refresh" />
          </button>
        </div>
      </header>

      <main className="studio-workspace">
        <aside className="studio-sidebar" aria-label="Brief y guía de aprendizaje">
          <section className="studio-brief-block">
            <div className="flex items-center justify-between">
              <span className="studio-sidebar-label">Brief</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/30">Input 01</span>
            </div>
            <label className="sr-only" htmlFor="studio-prompt">Objetivo para el agente</label>
            <textarea
              id="studio-prompt"
              className="studio-prompt"
              value={prompt}
              maxLength={390}
              disabled={isPreparing}
              onChange={(event) => setPrompt(event.target.value)}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] text-black/35">{prompt.length}/390</span>
              <button
                type="button"
                className="studio-run-button"
                disabled={!prompt.trim() || phase !== 'idle'}
                onClick={() => void createRun()}
              >
                {isPreparing ? <StudioIcon name="refresh" className="animate-spin" /> : <StudioIcon name="play" />}
                {isPreparing ? 'Versionando…' : runId ? 'Nuevo run' : 'Run agent'}
              </button>
            </div>
          </section>

          <section className="studio-guide-block">
            <button type="button" className="studio-guide-heading" aria-expanded={guideOpen} onClick={() => setGuideOpen((value) => !value)}>
              <span className="flex items-center gap-2">
                <StudioIcon name="layers" size={16} />
                Learning guide
              </span>
              <span className="flex items-center gap-2 font-mono text-[10px] text-black/35">
                {guideRules.length} reglas
                <StudioIcon name="chevron" size={13} className={guideOpen ? 'rotate-90' : ''} />
              </span>
            </button>

            {guideOpen ? (
              <ol className="studio-guide-list">
                {guideRules.map((rule, index) => (
                  <li key={rule.id}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <p>{rule.text}</p>
                    <i className={rule.source === 'feedback' ? 'is-learned' : ''}>
                      {rule.source === 'feedback' ? 'learned' : 'seed'}
                    </i>
                  </li>
                ))}
              </ol>
            ) : null}
          </section>

          {isLearningReview ? (
            <section className="studio-feedback-card" aria-labelledby="feedback-title">
              <span className="studio-kicker"><StudioIcon name="message" size={14} />Feedback loop</span>
              <h2 id="feedback-title">¿Este resultado te acerca al objetivo?</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" className={rating === 'useful' ? 'is-selected' : ''} onClick={() => setRating('useful')}>
                  <StudioIcon name="thumbUp" size={16} /> Sí
                </button>
                <button type="button" className={rating === 'not-useful' ? 'is-selected' : ''} onClick={() => setRating('not-useful')}>
                  <StudioIcon name="thumbDown" size={16} /> Todavía no
                </button>
              </div>
              <label htmlFor="studio-feedback">¿Qué debe recordar para el siguiente run?</label>
              <textarea
                id="studio-feedback"
                value={feedback}
                maxLength={180}
                placeholder="Ej. Mantén la decisión al lado de la anomalía."
                onChange={(event) => setFeedback(event.target.value)}
              />
              <button type="button" className="studio-feedback-submit" disabled={!rating || phase !== 'idle'} onClick={submitFeedback}>
                Integrar a la guía <StudioIcon name="arrow" size={15} />
              </button>
            </section>
          ) : (
            <section className="studio-loop-note">
              <span className="loop-icon"><StudioIcon name="workflow" /></span>
              <div>
                <p>El resultado no termina el proceso.</p>
                <span>Tu evaluación se convierte en contexto para el siguiente run.</span>
              </div>
            </section>
          )}

          {error || runtime.error ? (
            <div className="studio-error" role="alert">
              <strong>No se pudo continuar</strong>
              <span>{error || runtime.error}</span>
            </div>
          ) : null}
        </aside>

        <div className="studio-main-grid">
          <StudioCanvas
            uiSpec={runtime.uiSpec}
            decisionFeedback={runtime.decisionFeedback}
            onAction={(request) => submitRuntimeAction(request)}
            isBuilding={Boolean(isBuilding)}
            stateVersion={projection?.stateVersion ?? null}
          />
          <AgentTrace
            projection={projection}
            uiSpec={runtime.uiSpec}
            transportLabel={transportLabel(runtime.transport)}
          />
          <RunGraph
            projection={projection}
            prompt={committedPrompt || prompt}
            runNumber={runNumber}
            autoMode={autoMode}
            onToggleAuto={() => setAutoMode((value) => !value)}
            onAdvance={() => void advance()}
            canAdvance={canAdvance}
          />
        </div>
      </main>
    </div>
  )
}
