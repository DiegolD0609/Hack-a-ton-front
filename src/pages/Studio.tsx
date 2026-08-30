import { useState } from 'react'
import StudioCanvas from '@/components/studio/StudioCanvas'
import StudioIcon from '@/components/studio/StudioIcon'
import { generateStudioUI } from '@/studio/api'

export default function Studio() {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState<unknown>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

  const sessionStatus = error
    ? 'Atención requerida'
    : isGenerating
      ? 'Generando en el API'
      : response !== null
        ? 'Interfaz recibida'
        : 'Playground vacío'

  const generate = async () => {
    const exactPrompt = prompt.trim()
    if (!exactPrompt || isGenerating) return

    setIsGenerating(true)
    setError(null)
    setResponse(null)
    try {
      setResponse(await generateStudioUI(apiUrl, exactPrompt))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible generar la interfaz.')
    } finally {
      setIsGenerating(false)
    }
  }

  const clear = () => {
    setPrompt('')
    setResponse(null)
    setError(null)
  }

  return (
    <div className="studio-shell">
      <header className="studio-topbar">
        <a className="studio-brand" href="/" aria-label="Kernel Studio, inicio">
          <span className="studio-brand-mark">K</span>
          <span>
            <b>Kernel</b>
            <small>Standalone UI studio</small>
          </span>
        </a>

        <div className="studio-session-status" role="status">
          <span className={`status-orb ${error ? 'is-paused' : ''}`} />
          <span>{sessionStatus}</span>
        </div>

        <div className="studio-top-actions">
          <span className="hidden text-xs font-medium text-black/45 sm:inline">POST /studio/generate</span>
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

          <section className="studio-api-contract">
            <span className="loop-icon"><StudioIcon name="braces" /></span>
            <div>
              <p>Sin contratos runtime</p>
              <span>El frontend envía únicamente el prompt a <code>/studio/generate</code> y pinta el árbol JSON recibido. No crea runs, workflows, reglas locales ni conexiones WebSocket.</span>
            </div>
          </section>

          <dl className="studio-api-sequence">
            <div><dt>01</dt><dd>Prompt literal</dd></div>
            <div><dt>02</dt><dd>POST /studio/generate</dd></div>
            <div><dt>03</dt><dd>Render directo</dd></div>
          </dl>

          {error ? (
            <div className="studio-error" role="alert">
              <strong>El API no pudo responder</strong>
              <span>{error}</span>
            </div>
          ) : null}
        </aside>

        <div className="studio-main-grid">
          <StudioCanvas response={response} isBuilding={isGenerating} />
        </div>
      </main>
    </div>
  )
}
