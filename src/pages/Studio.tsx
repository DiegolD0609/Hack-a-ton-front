import { useEffect, useMemo, useState } from 'react'
import type { DecisionActionRequest } from '@/components/ui-kit'
import AgentTrace from '@/components/studio/AgentTrace'
import RunGraph from '@/components/studio/RunGraph'
import StudioCanvas from '@/components/studio/StudioCanvas'
import StudioIcon from '@/components/studio/StudioIcon'
import type { RunId } from '@/runtime/contracts'
import useRunSocket from '@/runtime/useRunSocket'
import { advancePromptRun, createPromptRun } from '@/studio/api'

const WAITING_RUN_ID = 'run_waiting_for_studio' as RunId

type RequestPhase = 'idle' | 'preparing' | 'advancing'

function transportLabel(transport: 'offline' | 'websocket' | 'polling'): string {
  if (transport === 'websocket') return 'Live'
  if (transport === 'polling') return 'Polling'
  return 'Offline'
}

export default function Studio() {
  const [prompt, setPrompt] = useState('')
  const [committedPrompt, setCommittedPrompt] = useState('')
  const [runId, setRunId] = useState<RunId | null>(null)
  const [runNumber, setRunNumber] = useState(1)
  const [phase, setPhase] = useState<RequestPhase>('idle')
  const [autoMode, setAutoMode] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  const isPreparing = phase === 'preparing'
  const isBuilding = isPreparing || phase === 'advancing' || projection?.status === 'running'
  const canAdvance = Boolean(
    runId && projection?.status === 'running' && phase === 'idle' && runtime.transport !== 'offline',
  )

  const sessionStatus = useMemo(() => {
    if (error) return 'Atención requerida'
    if (isPreparing) return 'Solicitando al API'
    if (!runId) return 'Playground vacío'
    if (projection?.status === 'completed') return 'Respuesta completada'
    if (projection?.status === 'paused') return 'Esperando decisión'
    if (projection?.status === 'running') return 'API procesando'
    return 'Conectando runtime'
  }, [error, isPreparing, projection?.status, runId])

  const createRun = async () => {
    const exactPrompt = prompt.trim()
    if (!exactPrompt || phase !== 'idle') return

    setPhase('preparing')
    setError(null)
    setRunId(null)
    try {
      const created = await createPromptRun(apiUrl, exactPrompt)
      setCommittedPrompt(exactPrompt)
      setRunId(created.runId)
      setAutoMode(true)
      setRunNumber((current) => committedPrompt ? current + 1 : current)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible solicitar la interfaz.')
    } finally {
      setPhase('idle')
    }
  }

  const advance = async () => {
    if (!runId || !canAdvance) return
    setPhase('advancing')
    setError(null)
    try {
      await advancePromptRun(apiUrl, runId)
    } catch (requestError) {
      setAutoMode(false)
      setError(requestError instanceof Error ? requestError.message : 'El API no pudo completar la solicitud.')
    } finally {
      setPhase('idle')
    }
  }

  useEffect(() => {
    if (!autoMode || !canAdvance) return
    const waitingForUpgrade = runtime.uiSpec?.generatedBy === 'deterministic'
    const timer = window.setTimeout(() => void advance(), waitingForUpgrade ? 3600 : 900)
    return () => window.clearTimeout(timer)
    // advance is intentionally represented by the state dependencies below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, canAdvance, projection?.stateVersion, runtime.uiSpec?.generatedBy])

  const submitRuntimeAction = (request: DecisionActionRequest) => {
    const sent = runtime.submitAction(request)
    if (!sent) setError('La acción no pudo salir por el canal en tiempo real.')
  }

  return (
    <div className="studio-shell">
      <header className="studio-topbar">
        <a className="studio-brand" href="/" aria-label="Kernel Studio, inicio">
          <span className="studio-brand-mark">K</span>
          <span>
            <b>Kernel</b>
            <small>API-only UI studio</small>
          </span>
        </a>

        <div className="studio-session-status" role="status">
          <span className={`status-orb ${projection?.status === 'paused' ? 'is-paused' : ''}`} />
          <span>{sessionStatus}</span>
          {runId ? <code>{runId.slice(-8)}</code> : null}
        </div>

        <div className="studio-top-actions">
          <span className="hidden text-xs font-medium text-black/45 sm:inline">Respuesta exclusiva del API</span>
          <button type="button" className="studio-icon-button" aria-label="Limpiar playground" onClick={() => window.location.reload()}>
            <StudioIcon name="refresh" />
          </button>
        </div>
      </header>

      <main className="studio-workspace">
        <aside className="studio-sidebar" aria-label="Solicitud al API">
          <section className="studio-brief-block">
            <div className="flex items-center justify-between">
              <span className="studio-sidebar-label">Solicitud</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/30">API input</span>
            </div>
            <label className="sr-only" htmlFor="studio-prompt">Instrucción exacta para el API</label>
            <textarea
              id="studio-prompt"
              className="studio-prompt"
              value={prompt}
              maxLength={500}
              disabled={isPreparing}
              placeholder="Ej. Genera exclusivamente dos botones: Aceptar y Cancelar."
              onChange={(event) => setPrompt(event.target.value)}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] text-black/35">{prompt.length}/500</span>
              <button
                type="button"
                className="studio-run-button"
                disabled={!prompt.trim() || phase !== 'idle'}
                onClick={() => void createRun()}
              >
                {isPreparing ? <StudioIcon name="refresh" className="animate-spin" /> : <StudioIcon name="arrow" />}
                {isPreparing ? 'Solicitando…' : 'Enviar al API'}
              </button>
            </div>
          </section>

          <section className="studio-api-contract">
            <span className="loop-icon"><StudioIcon name="braces" /></span>
            <div>
              <p>Sin interpretación local</p>
              <span>El frontend envía el prompt literal en el único paso que exige el API; no añade reglas, contenido ni componentes. El playground solo renderiza la UISpec validada del backend.</span>
            </div>
          </section>

          <dl className="studio-api-sequence">
            <div><dt>01</dt><dd>Prompt literal</dd></div>
            <div><dt>02</dt><dd>API runtime</dd></div>
            <div><dt>03</dt><dd>UISpec validada</dd></div>
          </dl>

          {error || runtime.error ? (
            <div className="studio-error" role="alert">
              <strong>El API no pudo responder</strong>
              <span>{error || runtime.error}</span>
            </div>
          ) : null}
        </aside>

        <div className="studio-main-grid">
          <StudioCanvas
            uiSpec={runtime.uiSpec}
            decisionFeedback={runtime.decisionFeedback}
            onAction={submitRuntimeAction}
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
            prompt={committedPrompt}
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
