import { useState } from 'react'
import Renderer from '@/runtime/Renderer'
import type { UISpec } from '@/runtime/contracts'
import type { DecisionFeedback } from '@/runtime/reducer'
import type { DecisionActionRequest } from '@/components/ui-kit'
import StudioIcon from '@/components/studio/StudioIcon'

type CanvasWidth = 'desktop' | 'tablet' | 'mobile'

const widthClasses: Record<CanvasWidth, string> = {
  desktop: 'max-w-none',
  tablet: 'max-w-[760px]',
  mobile: 'max-w-[390px]',
}

interface StudioCanvasProps {
  uiSpec: UISpec | null
  decisionFeedback: Readonly<Record<string, DecisionFeedback>>
  onAction: (request: DecisionActionRequest) => void
  isBuilding: boolean
  stateVersion: number | null
}

export default function StudioCanvas({
  uiSpec,
  decisionFeedback,
  onAction,
  isBuilding,
  stateVersion,
}: StudioCanvasProps) {
  const [canvasWidth, setCanvasWidth] = useState<CanvasWidth>('desktop')
  const [showStructure, setShowStructure] = useState(false)

  return (
    <section className="studio-panel studio-canvas-panel" aria-labelledby="canvas-title">
      <header className="studio-panel-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="studio-index">01</span>
          <div className="min-w-0">
            <h2 id="canvas-title" className="studio-panel-title">Playground</h2>
            <p className="studio-panel-subtitle">
              {uiSpec ? `UISpec · v${stateVersion ?? 0}` : 'Esperando una instrucción'}
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
              {stateVersion === null ? '—' : `v${stateVersion}`}
            </span>
          </div>

          <div className="studio-browser-body">
            {uiSpec ? (
              <div key={`${uiSpec.stateVersion}-${uiSpec.generatedBy}`} className="studio-runtime-view runtime-payload">
                <Renderer
                  uiSpec={uiSpec}
                  onAction={onAction}
                  decisionFeedback={decisionFeedback}
                />
              </div>
            ) : (
              <EmptyCanvas isBuilding={isBuilding} />
            )}

            {isBuilding && uiSpec ? (
              <div className="studio-building-pill" role="status">
                <span className="studio-pulse-dot" />
                El agente está reescribiendo la interfaz
              </div>
            ) : null}

            {showStructure && uiSpec ? (
              <div className="studio-structure-overlay">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
                    Estructura generada
                  </span>
                  <span className="rounded-full bg-[#dbff45] px-2 py-1 font-mono text-[10px] font-bold text-black">
                    {uiSpec.generatedBy}
                  </span>
                </div>
                <pre>{JSON.stringify(uiSpec.layout, null, 2)}</pre>
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
          {uiSpec ? `${uiSpec.generatedBy} · ${uiSpec.layout.children.length} bloques raíz` : 'canvas vacío'}
        </span>
      </footer>
    </section>
  )
}

function EmptyCanvas({ isBuilding }: { isBuilding: boolean }) {
  return (
    <div className="studio-empty-canvas">
      <div className="empty-canvas-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="relative z-10 max-w-sm text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#171714] text-[#dbff45] shadow-xl">
          <StudioIcon name={isBuilding ? 'refresh' : 'cursor'} size={22} className={isBuilding ? 'animate-spin' : ''} />
        </span>
        <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#171714]">
          {isBuilding ? 'Preparando el primer run' : 'El canvas está listo'}
        </h3>
        <p className="mt-2 text-sm leading-6 text-black/50">
          {isBuilding
            ? 'Versionamos tu brief y abrimos el canal de eventos.'
            : 'Describe el resultado. Verás cada decisión antes de ver la respuesta final.'}
        </p>
      </div>
    </div>
  )
}
