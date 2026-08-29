import { useState } from 'react'
import { Link } from 'react-router-dom'
import { appConfig } from '@/config/app'
import Renderer from '@/runtime/Renderer'
import { ID_PATTERNS, type RunId } from '@/runtime/contracts'
import type { ConnectionStatus } from '@/runtime/reducer'
import useRunSocket from '@/runtime/useRunSocket'

const DEFAULT_RUN_ID = 'run_demo_skeleton' as RunId

const connectionLabels: Record<ConnectionStatus, string> = {
  idle: 'Sin iniciar',
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

function currentRunId(): RunId {
  const requested = new URLSearchParams(window.location.search).get('runId')
  return requested && ID_PATTERNS.run.test(requested) ? (requested as RunId) : DEFAULT_RUN_ID
}

function demoSkeletonUrl(apiUrl: string): string {
  const url = new URL(apiUrl, window.location.origin)
  url.pathname = `${url.pathname.replace(/\/$/, '')}/demo/skeleton`
  url.search = ''
  return url.toString()
}

export default function Demo() {
  const [runId] = useState(currentRunId)
  const [triggerState, setTriggerState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [triggerError, setTriggerError] = useState<string | null>(null)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
  const token = import.meta.env.VITE_DEMO_TOKEN || 'replace-with-a-shared-demo-token'
  const runtime = useRunSocket({ runId, apiUrl, token })

  const triggerSkeleton = async () => {
    setTriggerState('loading')
    setTriggerError(null)

    try {
      const response = await fetch(demoSkeletonUrl(apiUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ runId }),
      })
      if (!response.ok) {
        throw new Error(`El backend respondió ${response.status}.`)
      }
      setTriggerState('sent')
    } catch (error) {
      setTriggerState('error')
      setTriggerError(error instanceof Error ? error.message : 'No se pudo iniciar el skeleton.')
    }
  }

  return (
    <div className="app-shell flex flex-col">
      <header className="border-b border-stroke bg-surface">
        <div className="page-container flex items-center justify-between gap-4 py-4">
          <Link to={appConfig.routes.home} className="font-display text-xl">
            {appConfig.name}
          </Link>
          <span
            className={`rounded-full px-3 py-2 text-xs font-semibold ${connectionClasses[runtime.connectionStatus]}`}
            role="status"
          >
            {connectionLabels[runtime.connectionStatus]}
          </span>
        </div>
      </header>

      <main className="page-container flex-1 py-10 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-6 border-b border-stroke pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Phase 1 · walking skeleton</p>
              <h1 className="mt-3 max-w-3xl text-4xl leading-tight sm:text-5xl">
                Una operación logística entendible en menos de un minuto.
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-content-muted">
                Esta pantalla la compone una UISpec recibida por WebSocket. La decisión vuelve al
                backend como un ActionEvent tipado.
              </p>
            </div>

            <button
              type="button"
              className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={runtime.connectionStatus !== 'open' || triggerState === 'loading'}
              onClick={() => void triggerSkeleton()}
            >
              {triggerState === 'loading' ? 'Solicitando…' : 'Emitir UISpec de prueba'}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-content-muted">
            <span className="font-mono">{runId}</span>
            {triggerState === 'sent' ? <span>Solicitud enviada al backend.</span> : null}
          </div>

          {runtime.error || triggerError ? (
            <div
              className="mt-6 rounded-control border border-emphasis-critical-border bg-emphasis-critical-bg p-4 text-sm text-emphasis-critical-fg"
              role="alert"
            >
              {triggerError || runtime.error}
            </div>
          ) : null}

          <section className="surface-card mt-8 min-h-80 p-5 sm:p-8" aria-live="polite">
            {runtime.uiSpec ? (
              <Renderer
                uiSpec={runtime.uiSpec}
                onAction={runtime.submitAction}
                decisionFeedback={runtime.decisionFeedback}
              />
            ) : (
              <div className="flex min-h-64 items-center justify-center text-center">
                <div className="max-w-lg">
                  <p className="eyebrow">Esperando UISpec</p>
                  <h2 className="mt-3 text-2xl">El renderer está listo.</h2>
                  <p className="mt-3 text-content-muted">
                    Conecta el backend de Phase 1 y emite el skeleton. No hay una pantalla fija
                    escondida detrás de este estado vacío.
                  </p>
                </div>
              </div>
            )}
          </section>

          <p className="mt-4 text-xs text-content-muted">
            Mensajes rechazados por contrato en esta sesión: {runtime.invalidMessageCount}
          </p>
        </div>
      </main>
    </div>
  )
}
