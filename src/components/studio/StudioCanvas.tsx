import { useState } from 'react'
import StudioIcon from '@/components/studio/StudioIcon'
import StudioRenderer, { studioResponseMeta } from '@/studio/StudioRenderer'

type CanvasWidth = 'desktop' | 'tablet' | 'mobile'

const widthClasses: Record<CanvasWidth, string> = {
  desktop: 'max-w-none',
  tablet: 'max-w-[760px]',
  mobile: 'max-w-[390px]',
}

interface StudioCanvasProps {
  response: unknown
  isBuilding: boolean
}

export default function StudioCanvas({
  response,
  isBuilding,
}: StudioCanvasProps) {
  const [canvasWidth, setCanvasWidth] = useState<CanvasWidth>('desktop')
  const [showStructure, setShowStructure] = useState(false)
  const responseMeta = studioResponseMeta(response)
  const hasResponse = response !== null

  return (
    <section className="studio-panel studio-canvas-panel" aria-labelledby="canvas-title">
      <header className="studio-panel-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="studio-index">01</span>
          <div className="min-w-0">
            <h2 id="canvas-title" className="studio-panel-title">Playground</h2>
            <p className="studio-panel-subtitle">
              {hasResponse ? 'Layout recibido de POST /studio/generate' : 'Vacío hasta recibir la respuesta del API'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="studio-viewport-switch" aria-label="Ancho del canvas">
            {(['desktop', 'tablet', 'mobile'] as CanvasWidth[]).map((width) => (
              <button
                key={width}
                type="button"
                className={canvasWidth === width ? 'is-active' : ''}
                aria-label={`Vista ${width}`}
                aria-pressed={canvasWidth === width}
                onClick={() => setCanvasWidth(width)}
              >
                <span className={`viewport-glyph viewport-glyph-${width}`} />
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`studio-icon-button ${showStructure ? 'is-active' : ''}`}
            aria-label="Ver estructura"
            aria-pressed={showStructure}
            onClick={() => setShowStructure((value) => !value)}
          >
            <StudioIcon name="braces" />
          </button>
        </div>
      </header>

      <div className="studio-canvas-stage">
        <div className={`studio-browser-frame ${widthClasses[canvasWidth]}`}>
          <div className="studio-browser-bar">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="browser-dot bg-[#ff6a51]" />
              <span className="browser-dot bg-[#f6c453]" />
              <span className="browser-dot bg-[#88c75a]" />
            </div>
            <div className="studio-browser-address">
              <span className="h-1.5 w-1.5 rounded-full bg-[#87a054]" />
              agent.local/preview
            </div>
            <span className="w-10 text-right font-mono text-[10px] text-black/35">
              {hasResponse ? 'API' : '—'}
            </span>
          </div>

          <div className="studio-browser-body">
            {hasResponse ? (
              <div key={responseMeta.generatedBy ?? 'api'} className="studio-runtime-view runtime-payload">
                <StudioRenderer response={response} />
              </div>
            ) : (
              <div className="studio-empty-canvas" aria-label="Playground vacío" />
            )}

            {isBuilding ? (
              <div className="studio-building-pill" role="status">
                <span className="studio-pulse-dot" />
                El API está generando la interfaz
              </div>
            ) : null}

            {showStructure && hasResponse ? (
              <div className="studio-structure-overlay">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
                    Estructura generada
                  </span>
                  <span className="rounded-full bg-[#dbff45] px-2 py-1 font-mono text-[10px] font-bold text-black">
                    {responseMeta.generatedBy ?? 'api'}
                  </span>
                </div>
                <pre>{JSON.stringify(responseMeta.layout, null, 2)}</pre>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <footer className="studio-canvas-footer">
        <span className="flex items-center gap-2">
          <StudioIcon name="eye" size={14} />
          Preview accesible
        </span>
        <span className="font-mono">
          {hasResponse
            ? `${responseMeta.generatedBy ?? 'api'} · ${responseMeta.rootBlocks} bloques raíz`
            : 'canvas vacío'}
        </span>
      </footer>
    </section>
  )
}
