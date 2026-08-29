import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { appConfig } from '@/config/app'
import { ID_PATTERNS } from '@/runtime/contracts'
import { createRun, createWorkflowVersion, loadRunProjection } from './api'
import {
  EMPTY_STEP_FORM,
  buildStepDefinition,
  type WorkflowBaseline,
  type WorkflowStepForm,
  type WorkflowVersionResponse,
} from './types'

interface WorkflowEditorProps {
  onRunCreated?: (runId: string) => void
}

function linkedRunId(): string | null {
  const runId = new URLSearchParams(window.location.search).get('runId')
  return runId && ID_PATTERNS.run.test(runId) ? runId : null
}

function baselineFromProjection(projection: {
  workflowId: WorkflowBaseline['workflowId']
  workflowVersion: number
  runId: WorkflowBaseline['sourceRunId']
}): WorkflowBaseline {
  return {
    workflowId: projection.workflowId,
    version: projection.workflowVersion,
    sourceRunId: projection.runId,
  }
}

export default function WorkflowEditor({ onRunCreated }: WorkflowEditorProps) {
  const [form, setForm] = useState<WorkflowStepForm>(EMPTY_STEP_FORM)
  const [inputPath, setInputPath] = useState('')
  const [baseline, setBaseline] = useState<WorkflowBaseline | null>(null)
  const [createdVersion, setCreatedVersion] = useState<WorkflowVersionResponse | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading-base' | 'creating' | 'running'>('idle')
  const [error, setError] = useState<string | null>(null)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
  const sourceRunId = useMemo(linkedRunId, [])
  const step = useMemo(() => buildStepDefinition(form), [form])
  const locked = createdVersion !== null || status !== 'idle'
  const formValid = form.title.trim().length > 0 && form.objective.trim().length > 0

  useEffect(() => {
    if (!sourceRunId) return

    let active = true
    setStatus('loading-base')
    void loadRunProjection(apiUrl, sourceRunId)
      .then((projection) => {
        if (!active) return
        setBaseline(baselineFromProjection(projection))
        setError(null)
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(
          reason instanceof Error
            ? reason.message
            : 'No se pudo cargar el workflow del run enlazado.',
        )
      })
      .finally(() => {
        if (active) setStatus('idle')
      })

    return () => {
      active = false
    }
  }, [apiUrl, sourceRunId])

  const updateField = <Key extends keyof WorkflowStepForm>(
    field: Key,
    value: WorkflowStepForm[Key],
  ) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const addInput = () => {
    const value = inputPath.trim()
    if (!value || form.inputs.includes(value)) return
    updateField('inputs', [...form.inputs, value])
    setInputPath('')
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    addInput()
  }

  const removeInput = (path: string) => {
    updateField(
      'inputs',
      form.inputs.filter((input) => input !== path),
    )
  }

  const resolveBaseline = async (): Promise<WorkflowBaseline> => {
    if (baseline) return baseline
    const projection = sourceRunId
      ? await loadRunProjection(apiUrl, sourceRunId)
      : await createRun(apiUrl)
    const resolved = baselineFromProjection(projection)
    setBaseline(resolved)
    return resolved
  }

  const submitVersion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formValid || locked) return

    setStatus('creating')
    setError(null)
    try {
      const resolvedBaseline = await resolveBaseline()
      const response = await createWorkflowVersion(
        apiUrl,
        resolvedBaseline.workflowId,
        resolvedBaseline.version,
        [step],
      )
      setCreatedVersion(response)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear la nueva versión.')
    } finally {
      setStatus('idle')
    }
  }

  const runCreatedVersion = async () => {
    if (!createdVersion || status !== 'idle') return
    setStatus('running')
    setError(null)
    try {
      const projection = await createRun(apiUrl, createdVersion.workflowVersionId)
      if (onRunCreated) {
        onRunCreated(projection.runId)
      } else {
        window.location.assign(`${appConfig.routes.demo}?runId=${encodeURIComponent(projection.runId)}`)
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo iniciar el run.')
      setStatus('idle')
    }
  }

  const startAnotherVersion = () => {
    if (!createdVersion) return
    setBaseline((current) =>
      current
        ? { ...current, version: createdVersion.version }
        : current,
    )
    setCreatedVersion(null)
    setForm(EMPTY_STEP_FORM)
    setInputPath('')
    setError(null)
  }

  return (
    <div className="app-shell flex flex-col">
      <header className="border-b border-stroke bg-surface">
        <div className="page-container flex items-center justify-between gap-4 py-4">
          <a href={appConfig.routes.landing} className="font-display text-xl">
            {appConfig.name}
          </a>
          <a href={appConfig.routes.demo} className="btn-quiet">
            Volver al runtime
          </a>
        </div>
      </header>

      <main className="page-container flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="eyebrow">Phase 4 · workflow editor</p>
            <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">Inventa un paso en runtime.</h1>
            <p className="mt-4 text-lg text-content-muted">
              El formulario genera un objeto ejecutable, crea una versión inmutable y abre un run
              nuevo sin reiniciar el backend.
            </p>
          </div>

          {error ? (
            <div
              className="mt-6 rounded-control border border-emphasis-critical-border bg-emphasis-critical-bg p-4 text-sm text-emphasis-critical-fg"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
            <form className="surface-card p-5 sm:p-7" onSubmit={submitVersion}>
              <div className="flex items-start justify-between gap-4 border-b border-stroke pb-5">
                <div>
                  <p className="eyebrow">Definición</p>
                  <h2 className="mt-2 text-2xl">Objeto StepDefinition</h2>
                </div>
                <span className="rounded-full bg-surface-tinted px-3 py-2 font-mono text-xs text-content-muted">
                  {step.id}
                </span>
              </div>

              <div className="mt-6 space-y-6">
                <label className="block">
                  <span className="field-label">Title</span>
                  <input
                    className="field-control"
                    name="title"
                    aria-label="Title"
                    value={form.title}
                    maxLength={120}
                    required
                    disabled={locked}
                    placeholder="Validar condiciones de entrega"
                    onChange={(event) => updateField('title', event.target.value)}
                  />
                  <span className="mt-2 block text-xs text-content-muted">
                    Genera automáticamente un ID válido y estable.
                  </span>
                </label>

                <label className="block">
                  <span className="field-label">Objective</span>
                  <textarea
                    className="field-control min-h-32 resize-y"
                    name="objective"
                    aria-label="Objective"
                    value={form.objective}
                    maxLength={500}
                    required
                    disabled={locked}
                    placeholder="Describe qué debe verificar el agente usando únicamente los inputs declarados."
                    onChange={(event) => updateField('objective', event.target.value)}
                  />
                  <span className="mt-2 block text-right text-xs text-content-muted">
                    {form.objective.length}/500
                  </span>
                </label>

                <div>
                  <label className="field-label" htmlFor="input-path">
                    Input picker
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="input-path"
                      className="field-control"
                      value={inputPath}
                      disabled={locked}
                      placeholder="step_id.data.field"
                      onChange={(event) => setInputPath(event.target.value)}
                      onKeyDown={handleInputKeyDown}
                    />
                    <button
                      type="button"
                      className="btn-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={locked || !inputPath.trim()}
                      onClick={addInput}
                    >
                      Agregar input
                    </button>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-content-muted">
                    Usa rutas punteadas del estado. Si una ruta no existe, el executor la reporta
                    como faltante en vez de inventar un valor. El paso se anexa al final del flow
                    base, por lo que puede consumir resultados de pasos anteriores.
                  </p>
                  <div className="mt-3 flex min-h-10 flex-wrap gap-2" aria-label="Inputs seleccionados">
                    {form.inputs.length ? (
                      form.inputs.map((path) => (
                        <button
                          key={path}
                          type="button"
                          className="rounded-full border border-stroke bg-surface-tinted px-3 py-2 font-mono text-xs text-primary disabled:cursor-default"
                          disabled={locked}
                          aria-label={`Quitar ${path}`}
                          onClick={() => removeInput(path)}
                        >
                          {path} <span aria-hidden="true">×</span>
                        </button>
                      ))
                    ) : (
                      <span className="py-2 text-sm text-content-muted">Sin inputs: también es válido.</span>
                    )}
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-control border border-stroke bg-surface-tinted p-4">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-impact"
                    aria-label="Requires human review"
                    checked={form.requiresHumanReview}
                    disabled={locked}
                    onChange={(event) => updateField('requiresHumanReview', event.target.checked)}
                  />
                  <span>
                    <span className="block text-sm font-semibold">Requires human review</span>
                    <span className="mt-1 block text-xs leading-5 text-content-muted">
                      Pausa el run y solicita una decisión humana al terminar el paso.
                    </span>
                  </span>
                </label>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-stroke pt-5">
                {createdVersion ? (
                  <>
                    <button
                      type="button"
                      className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={status === 'running'}
                      onClick={() => void runCreatedVersion()}
                    >
                      {status === 'running'
                        ? 'Iniciando run…'
                        : `Run with v${createdVersion.version}`}
                    </button>
                    <button type="button" className="btn-secondary" onClick={startAnotherVersion}>
                      Crear otra versión
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!formValid || locked}
                  >
                    {status === 'creating'
                      ? 'Creando versión…'
                      : status === 'loading-base'
                        ? 'Cargando workflow…'
                        : 'Crear v(n+1)'}
                  </button>
                )}
                <span className="text-xs text-content-muted">
                  {baseline
                    ? `${baseline.workflowId} · base v${baseline.version}`
                    : 'La primera acción identifica el workflow base.'}
                </span>
              </div>
            </form>

            <div className="space-y-6">
              <section className="surface-card overflow-hidden">
                <div className="border-b border-stroke px-5 py-4">
                  <p className="eyebrow">Objeto generado</p>
                </div>
                <pre
                  className="max-h-[30rem] overflow-auto bg-primary p-5 text-xs leading-6 text-white"
                  aria-label="Vista previa JSON del paso"
                >
                  {JSON.stringify(step, null, 2)}
                </pre>
              </section>

              <section className="surface-card p-5" aria-labelledby="flow-diff-title">
                <p className="eyebrow">Flow diff</p>
                <h2 id="flow-diff-title" className="mt-2 text-2xl">
                  {createdVersion ? 'Versión creada' : 'Cambio propuesto'}
                </h2>
                <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                  <span className="font-semibold text-content-muted">Base</span>
                  <span>{baseline ? `v${baseline.version}` : 'v(n)'}</span>
                  <span className="font-semibold text-content-muted">Nueva</span>
                  <span className="font-semibold text-emphasis-normal-fg">
                    {createdVersion
                      ? `v${createdVersion.version}`
                      : 'v(n+1)'}
                  </span>
                  <span className="font-semibold text-content-muted">Cambio</span>
                  <span>
                    <span className="mr-2 font-mono text-emphasis-normal-fg">+</span>
                    {step.title || 'Nuevo paso generado'}
                  </span>
                  <span className="font-semibold text-content-muted">Inputs</span>
                  <span>{step.inputs.length}</span>
                  <span className="font-semibold text-content-muted">Pasos</span>
                  <span>
                    {createdVersion
                      ? `${createdVersion.steps.length - 1} base + 1 nuevo = ${createdVersion.steps.length}`
                      : 'flow base + 1 nuevo'}
                  </span>
                  <span className="font-semibold text-content-muted">Review</span>
                  <span>{step.requiresHumanReview ? 'Humana obligatoria' : 'Automática'}</span>
                </div>
                <p className="mt-5 border-t border-stroke pt-4 text-xs leading-5 text-content-muted">
                  La API copia la versión base y anexa el paso generado en una definición
                  inmutable. El run nuevo ejecuta exactamente esa versión; no modifica runs
                  anteriores.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
