import { useMemo, useRef, useState } from 'react'
import IterationTree, {
  type IterationStatus,
  type IterationTreeNode,
} from '@/components/studio/IterationTree'
import StudioCanvas from '@/components/studio/StudioCanvas'
import StudioIcon from '@/components/studio/StudioIcon'
import { studioResponseMeta } from '@/studio/StudioRenderer'
import { generateStudioUI } from '@/studio/api'

interface StudioIteration extends IterationTreeNode {
  response: unknown
}

function branchPath(iterations: StudioIteration[], leaf: StudioIteration | null): StudioIteration[] {
  const byId = new Map(iterations.map((iteration) => [iteration.id, iteration]))
  const path: StudioIteration[] = []
  let current = leaf
  while (current) {
    path.push(current)
    current = current.parentId === null ? null : byId.get(current.parentId) ?? null
  }
  return path.reverse()
}

function closestCompletedIteration(
  iterations: StudioIteration[],
  selectedId: number | null,
): StudioIteration | null {
  const byId = new Map(iterations.map((iteration) => [iteration.id, iteration]))
  let current = selectedId === null ? null : byId.get(selectedId) ?? null
  while (current) {
    if (current.status === 'completed') return current
    current = current.parentId === null ? null : byId.get(current.parentId) ?? null
  }
  return null
}

export default function Studio() {
  const [prompt, setPrompt] = useState('')
  const [iterations, setIterations] = useState<StudioIteration[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const iterationCounter = useRef(0)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
  const selectedIteration = useMemo(
    () => iterations.find((iteration) => iteration.id === selectedId) ?? null,
    [iterations, selectedId],
  )
  const selectedResponse = selectedIteration?.status === 'completed'
    ? selectedIteration.response
    : null
  const selectedMeta = studioResponseMeta(selectedResponse)

  const sessionStatus = error
    ? 'Atención requerida'
    : isGenerating
      ? 'Generando en el API'
      : selectedResponse !== null
        ? `Iteración ${String(selectedIteration?.id ?? 0).padStart(2, '0')}`
        : 'Playground vacío'

  const generate = async () => {
    const exactPrompt = prompt.trim()
    if (!exactPrompt || isGenerating) return

    const parent = closestCompletedIteration(iterations, selectedId)
    const ancestry = branchPath(iterations, parent)
    const history = ancestry.flatMap((iteration) => {
      const turns: Array<{ role: 'user' | 'assistant'; content: string }> = [
        { role: 'user', content: iteration.prompt },
      ]
      if (iteration.suggestion) {
        turns.push({ role: 'assistant', content: iteration.suggestion })
      }
      return turns
    }).slice(-20)
    const previousLayout = parent ? studioResponseMeta(parent.response).layout : undefined
    const iterationId = ++iterationCounter.current
    const pending: StudioIteration = {
      id: iterationId,
      parentId: parent?.id ?? null,
      prompt: exactPrompt,
      status: 'generating',
      suggestion: null,
      response: null,
    }

    setIterations((current) => [...current, pending])
    setSelectedId(iterationId)
    setIsGenerating(true)
    setError(null)
    try {
      const generated = await generateStudioUI(apiUrl, exactPrompt, { history, previousLayout })
      const suggestion = studioResponseMeta(generated).reason
      setIterations((current) => current.map((iteration) => (
        iteration.id === iterationId
          ? { ...iteration, status: 'completed' as IterationStatus, suggestion, response: generated }
          : iteration
      )))
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'No fue posible generar la interfaz.'
      setError(message)
      setIterations((current) => current.map((iteration) => (
        iteration.id === iterationId
          ? { ...iteration, status: 'error' as IterationStatus, suggestion: message }
          : iteration
      )))
    } finally {
      setIsGenerating(false)
    }
  }

  const selectIteration = (id: number | null) => {
    setSelectedId(id)
    const selected = iterations.find((iteration) => iteration.id === id)
    setError(selected?.status === 'error' ? selected.suggestion : null)
  }

  const clear = () => {
    setPrompt('')
    setIterations([])
    setSelectedId(null)
    setError(null)
    iterationCounter.current = 0
  }

  return (
    <div className="studio-shell">
      <header className="studio-topbar">
        <a className="studio-brand" href="/" aria-label="Kernel Panic Studio, inicio">
          <span className="studio-brand-mark">K</span>
          <span>
            <b>Kernel Panic</b>
            <small>Standalone UI studio</small>
          </span>
        </a>

        <div className="studio-session-status" role="status">
          <span className={`status-orb ${error ? 'is-paused' : ''}`} />
          <span>{sessionStatus}</span>
        </div>

        <div className="studio-top-actions">
          <button type="button" className="studio-icon-button" aria-label="Limpiar playground" onClick={clear}>
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
              maxLength={2000}
              disabled={isGenerating}
              placeholder="Ej. Genera exclusivamente dos botones: Aceptar y Cancelar."
              onChange={(event) => setPrompt(event.target.value)}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] text-black/35">{prompt.length}/2000</span>
              <button
                type="button"
                className="studio-run-button"
                disabled={!prompt.trim() || isGenerating}
                onClick={() => void generate()}
              >
                {isGenerating ? <StudioIcon name="refresh" className="animate-spin" /> : <StudioIcon name="arrow" />}
                {isGenerating ? 'Generando…' : 'Generar UI'}
              </button>
            </div>
          </section>

          <IterationTree
            iterations={iterations}
            selectedId={selectedId}
            onSelect={selectIteration}
          />

          {error ? (
            <div className="studio-error" role="alert">
              <strong>El API no pudo responder</strong>
              <span>{error}</span>
            </div>
          ) : null}
        </aside>

        <div className="studio-main-grid">
          <StudioCanvas
            response={selectedResponse}
            isBuilding={isGenerating}
            iterationId={selectedIteration?.id ?? null}
          />

          <section className="studio-suggestion-card" aria-labelledby="backend-suggestion-title">
            <div className="studio-suggestion-mark"><StudioIcon name="spark" /></div>
            <div>
              <span className="studio-sidebar-label">Backend output</span>
              <h2 id="backend-suggestion-title">Backend suggestion</h2>
              <p>{selectedMeta.reason ?? 'The backend suggestion will appear here after an iteration.'}</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
