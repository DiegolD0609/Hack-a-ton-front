import { useEffect, useState } from 'react'
import AssistantPanel from '@/assistant/AssistantPanel'
import { appConfig } from '@/config/app'
import WorkflowEditor from '@/editor/WorkflowEditor'
import RunHistoryPanel from '@/history/RunHistoryPanel'
import {
  loadRunHistory,
  rememberRunProjection,
  type RunHistoryEntry,
} from '@/history/runHistory'
import UISpecInspector from '@/inspector/UISpecInspector'
import Renderer from '@/runtime/Renderer'
import { ID_PATTERNS, type RunId, type RunProjection } from '@/runtime/contracts'
import type { ConnectionStatus } from '@/runtime/reducer'
import useRunSocket from '@/runtime/useRunSocket'

const WAITING_RUN_ID = 'run_waiting_for_backend' as RunId

// Auto-advance cadence. When the LLM layout upgrade has already landed we only
// hold briefly so the viewer sees it; otherwise we wait a little longer to give
// the upgrade a chance to arrive before moving to the next step.
const STEP_HOLD_MS = 1600
const UPGRADE_WAIT_MS = 4500

const connectionLabels: Record<ConnectionStatus, string> = {
  idle: 'Sin run activo',
  connecting: 'Conectando',
  open: 'WebSocket conectado',
  closed: 'WebSocket cerrado',
  error: 'Error de conexión',
}

const connectionClasses: Record<ConnectionStatus, string> = {
  idle: 'bg-surface-tinted text-content-muted',
  connecting: 'bg-emphasis-warning-bg text-emphasis-warning-fg',
  open: 'bg-emphasis-normal-bg text-emphasis-normal-fg',
  closed: 'bg-emphasis-warning-bg text-emphasis-warning-fg',
  error: 'bg-emphasis-critical-bg text-emphasis-critical-fg',
}

function requestedRunId(): RunId | null {
  const requested = new URLSearchParams(window.location.search).get('runId')
  return requested && ID_PATTERNS.run.test(requested) ? (requested as RunId) : null
}

function apiEndpoint(apiUrl: string, path: string): string {
  const url = new URL(apiUrl, window.location.origin)
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path}`
  url.search = ''
  return url.toString()
}

async function requestProjection(
  apiUrl: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<RunProjection> {
  const response = await fetch(apiEndpoint(apiUrl, path), {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    throw new Error(`El backend respondió ${response.status}.`)
  }
  const projection = (await response.json()) as Partial<RunProjection>
  if (!projection.runId || !ID_PATTERNS.run.test(projection.runId)) {
    throw new Error('El backend no devolvió un runId válido.')
  }
  return projection as RunProjection
}

export default function Demo() {
  const [runId, setRunId] = useState<RunId | null>(requestedRunId)
  const [runHistory, setRunHistory] = useState<RunHistoryEntry[]>(loadRunHistory)
  const [requestState, setRequestState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [requestError, setRequestError] = useState<string | null>(null)
  const [autoMode, setAutoMode] = useState(true)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
  const token = import.meta.env.VITE_DEMO_TOKEN || 'replace-with-a-shared-demo-token'
  const pollingEnabled = import.meta.env.VITE_RUNTIME_POLLING === 'true'
  const assistantEnabled = import.meta.env.VITE_ASSISTANT_ENABLED !== 'false'
  const runtime = useRunSocket({
    runId: runId ?? WAITING_RUN_ID,
    apiUrl,
    token,
    enabled: runId !== null,
    pollingEnabled,
  })

  const activateRun = (nextRunId: RunId) => {
    setRunId(nextRunId)
    setRequestState('sent')
    setRequestError(null)
    const url = new URL(window.location.href)
    url.pathname = appConfig.routes.demo
    url.searchParams.set('runId', nextRunId)
    window.history.replaceState({}, '', url)
  }

  useEffect(() => {
    const projection = runtime.projection
    if (!projection) return
    setRunHistory((current) => rememberRunProjection(projection, current))
  }, [runtime.projection])

  const performRequest = async (path: string, body?: Record<string, unknown>) => {
    setRequestState('loading')
    setRequestError(null)
    try {
      const projection = await requestProjection(apiUrl, path, body)
      setRunHistory((current) => rememberRunProjection(projection, current))
      activateRun(projection.runId)
    } catch (error) {
      setRequestState('error')
      setRequestError(error instanceof Error ? error.message : 'No se pudo avanzar la demo.')
    }
  }

  const startRun = (path: string, body?: Record<string, unknown>) => {
    setAutoMode(true)
    void performRequest(path, body)
  }

  const startNewRun = () => {
    setRunId(null)
    setRequestState('idle')
    setRequestError(null)
    setAutoMode(true)
    const url = new URL(window.location.href)
    url.pathname = appConfig.routes.demo
    url.search = ''
    window.history.replaceState({}, '', url)
  }

  const status = runtime.projection?.status
  const canAdvance = runtime.transport !== 'offline' && status === 'running'
  const runFinished = status === 'completed'
  const runPaused = status === 'paused'
  const isTrialByFire = (runtime.projection?.workflowVersion ?? 1) > 1
  const isUpgraded = runtime.uiSpec?.generatedBy === 'llm'
  const editorUrl = runId
    ? `${appConfig.routes.editor}?runId=${encodeURIComponent(runId)}`
    : appConfig.routes.editor

  // A failed transition stops the automatic loop so it can't error-spin.
  useEffect(() => {
    if (requestState === 'error') setAutoMode(false)
  }, [requestState])

  // The heart of the guided demo: while a run is actively running, advance it on
  // its own. It halts at the human decision (status "paused") and resumes once a
  // decision is applied and the run is running again. Each step waits for the LLM
  // layout upgrade (up to a cap) so the interface visibly restructures itself.
  useEffect(() => {
    if (!runId || !autoMode) return
    if (requestState === 'loading') return
    if (runtime.transport === 'offline') return
    if (status !== 'running') return
    const delay = isUpgraded ? STEP_HOLD_MS : UPGRADE_WAIT_MS
    const timer = window.setTimeout(() => {
      void performRequest('/demo/advance', { runId })
    }, delay)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    runId,
    autoMode,
    requestState,
    runtime.transport,
    status,
    runtime.projection?.stateVersion,
    isUpgraded,
  ])

  const advancing = requestState === 'loading'
  const autoActive = autoMode && !!runId && !runFinished

  const flowNote = !runId
    ? null
    : runFinished
      ? 'Operación completada. Inicia un nuevo run o revisa la historia.'
      : runPaused
        ? 'En pausa para tu decisión: elígela en el panel o pídele una recomendación a Ari.'
        : autoMode
          ? 'Reproducción automática: la operación avanza sola y se detiene en la decisión humana.'
          : 'Automático en pausa. Usa “Avanzar” para dar un paso, o reanuda la reproducción.'

  return (
    <div className="app-shell flex flex-col">
      <header className="border-b border-stroke bg-surface">
        <div className="page-container flex items-center justify-between gap-4 py-4">
          <a href={appConfig.routes.landing} className="font-display text-xl">
            {appConfig.name}
          </a>
          <div className="flex items-center gap-2">
            <a href={editorUrl} className="btn-quiet">
              Editor
            </a>
            <span
              className={`rounded-full px-3 py-2 text-xs font-semibold ${
                runtime.transport === 'polling'
                  ? 'bg-emphasis-warning-bg text-emphasis-warning-fg'
                  : connectionClasses[runtime.connectionStatus]
              }`}
              role="status"
            >
              {runtime.transport === 'polling'
                ? 'Polling activo'
                : connectionLabels[runtime.connectionStatus]}
            </span>
          </div>
        </div>
      </header>

      <main className="page-container flex-1 py-10 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 border-b border-stroke pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">
                {isTrialByFire
                  ? 'Phase 4 · trial-by-fire'
                  : 'Phase 3 · loop humano inspeccionable'}
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl leading-tight sm:text-5xl">
                El estado del agente se convierte en una interfaz viva.
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-content-muted">
                {isTrialByFire
                  ? 'Recorre el flow base, ejecuta el paso inventado y resuelve su revisión humana sin reiniciar.'
                  : 'Inicia un run: la operación avanza sola, se detiene en la decisión humana y la interfaz se reescribe en cada paso.'}{' '}
                El inspector muestra cada upgrade determinista o LLM.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              {!runId ? (
                <>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={requestState === 'loading'}
                    onClick={() => startRun('/demo/skeleton')}
                  >
                    Skeleton H3
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={requestState === 'loading'}
                    onClick={() => startRun('/runs')}
                  >
                    {requestState === 'loading' ? 'Iniciando…' : 'Iniciar golden path'}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn-secondary" onClick={startNewRun}>
                    Nuevo run
                  </button>
                  <UISpecInspector uiSpec={runtime.uiSpec} />
                  <a
                    className="btn-secondary"
                    href={apiEndpoint(apiUrl, `/runs/${encodeURIComponent(runId)}/events`)}
                    download={`${runId}-events.json`}
                  >
                    Exportar eventos
                  </a>
                  <button
                    type="button"
                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={runFinished}
                    aria-pressed={autoMode}
                    onClick={() => setAutoMode((value) => !value)}
                  >
                    {autoActive ? 'Pausar auto' : 'Reproducir'}
                  </button>
                  <button
                    type="button"
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canAdvance || advancing}
                    onClick={() => void performRequest('/demo/advance', { runId })}
                  >
                    {advancing
                      ? 'Avanzando…'
                      : runFinished
                        ? 'Run completado'
                        : runPaused
                          ? 'Esperando decisión'
                          : 'Avanzar'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-content-muted">
            <span className="font-mono">{runId ?? 'Crea un run para comenzar'}</span>
            {runId && runtime.uiSpec ? (
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  isUpgraded
                    ? 'bg-emphasis-normal-bg text-emphasis-normal-fg'
                    : 'bg-surface-tinted text-content-muted'
                }`}
              >
                {isUpgraded ? 'Interfaz mejorada por LLM' : 'Interfaz determinista'}
              </span>
            ) : null}
            {flowNote ? <span>{flowNote}</span> : null}
          </div>

          {runtime.error || requestError ? (
            <div
              className="mt-6 rounded-control border border-emphasis-critical-border bg-emphasis-critical-bg p-4 text-sm text-emphasis-critical-fg"
              role="alert"
            >
              {requestError || runtime.error}
            </div>
          ) : null}

          <section className="surface-card mt-8 p-5" aria-labelledby="demo-moments-title">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="eyebrow">Caso oficial · M1–M3</p>
                <h2 id="demo-moments-title" className="mt-2 text-2xl">Cada momento crea un run nuevo.</h2>
                <p className="mt-2 text-sm text-content-muted">
                  Los tres runs comparten operationId; la historia conserva y permite reabrir cada interfaz.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((moment) => (
                  <button
                    key={moment}
                    type="button"
                    className={moment === 3 ? 'btn-primary' : 'btn-secondary'}
                    disabled={requestState === 'loading'}
                    onClick={() => startRun(`/demo/moment/${moment}`)}
                  >
                    Momento {moment}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-6">
            <RunHistoryPanel
              entries={runHistory}
              projection={runtime.projection}
              currentRunId={runId}
              onSelectRun={activateRun}
            />
          </div>

          {runId ? (
            <details className="surface-card mt-6 overflow-hidden">
              <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-content marker:text-signal">
                Editor del trial · fallback garantizado sin chat
              </summary>
              <div className="border-t border-stroke px-5 sm:px-7">
                <WorkflowEditor
                  key={runId}
                  embedded
                  sourceRunId={runId}
                  onRunCreated={(createdRunId) => activateRun(createdRunId as RunId)}
                />
              </div>
            </details>
          ) : null}

          <div className={`mt-6 grid items-start gap-6 ${assistantEnabled && runId ? 'lg:grid-cols-[minmax(0,1fr)_21rem]' : ''}`}>
            <section className="surface-card relative min-h-80 p-5 sm:p-8" aria-live="polite">
              {runId && advancing ? (
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center rounded-card bg-surface/70 backdrop-blur-sm"
                  role="status"
                  aria-live="assertive"
                >
                  <div className="flex items-center gap-3 rounded-control bg-surface px-5 py-4 shadow-lg">
                    <svg className="h-6 w-6 animate-spin text-signal" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-content">Avanzando la operación…</p>
                      <p className="text-xs text-content-muted">Ari genera la interfaz del nuevo estado.</p>
                    </div>
                  </div>
                </div>
              ) : null}
              {runtime.uiSpec ? (
                <div
                  key={`${runtime.uiSpec.stateVersion}-${runtime.uiSpec.generatedBy}`}
                  className="runtime-payload"
                  data-testid="runtime-payload"
                >
                  <Renderer
                    uiSpec={runtime.uiSpec}
                    onAction={runtime.submitAction}
                    decisionFeedback={runtime.decisionFeedback}
                  />
                </div>
              ) : (
                <div className="flex min-h-64 items-center justify-center text-center">
                  <div className="max-w-lg">
                    <p className="eyebrow">Esperando UISpec</p>
                    <h2 className="mt-3 text-2xl">El renderer está listo.</h2>
                    <p className="mt-3 text-content-muted">
                      Usa los momentos 1–3 para demostrar runs sucesivos, o el golden path para la compatibilidad v1.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {assistantEnabled && runId ? (
              <AssistantPanel
                key={runId}
                apiUrl={apiUrl}
                runId={runId}
                projection={runtime.projection}
                editorUrl={editorUrl}
                onAction={runtime.submitAction}
                onRunCreated={activateRun}
              />
            ) : null}
          </div>

          <p className="mt-4 text-xs text-content-muted">
            Mensajes rechazados por contrato en esta sesión: {runtime.invalidMessageCount}
          </p>
        </div>
      </main>
    </div>
  )
}
