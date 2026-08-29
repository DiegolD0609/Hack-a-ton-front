import { useEffect, useState } from 'react'
import type { UISpec } from '@/runtime/contracts'

interface UISpecInspectorProps {
  uiSpec: UISpec | null
}

const generatorLabels = {
  deterministic: 'Determinista',
  llm: 'LLM',
  fallback: 'Fallback',
} as const

export default function UISpecInspector({ uiSpec }: UISpecInspectorProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  return (
    <>
      <button
        type="button"
        className="btn-secondary"
        disabled={!uiSpec}
        onClick={() => setOpen(true)}
      >
        Inspeccionar UISpec
      </button>

      {open && uiSpec ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/35" role="presentation">
          <aside
            className="flex h-full w-full max-w-2xl flex-col border-l border-stroke bg-surface shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ui-spec-inspector-title"
          >
            <header className="flex items-start justify-between gap-ui-4 border-b border-stroke p-ui-6">
              <div>
                <p className="eyebrow">Inspector en vivo</p>
                <h2 id="ui-spec-inspector-title" className="mt-ui-2 text-ui-section">
                  UISpec validada
                </h2>
              </div>
              <button type="button" className="btn-quiet" onClick={() => setOpen(false)}>
                Cerrar
              </button>
            </header>

            <div className="grid grid-cols-1 gap-ui-3 border-b border-stroke p-ui-6 sm:grid-cols-3">
              <div className="rounded-control bg-surface-tinted p-ui-3">
                <p className="text-ui-caption uppercase tracking-wide text-content-muted">Generada por</p>
                <p className="mt-ui-1 font-semibold">{generatorLabels[uiSpec.generatedBy]}</p>
              </div>
              <div className="rounded-control bg-surface-tinted p-ui-3">
                <p className="text-ui-caption uppercase tracking-wide text-content-muted">State version</p>
                <p className="mt-ui-1 font-mono font-semibold">{uiSpec.stateVersion}</p>
              </div>
              <div className="rounded-control bg-surface-tinted p-ui-3">
                <p className="text-ui-caption uppercase tracking-wide text-content-muted">Workflow</p>
                <p className="mt-ui-1 font-mono text-ui-caption font-semibold">v{uiSpec.workflowVersion}</p>
              </div>
              <div className="rounded-control border border-stroke p-ui-3 sm:col-span-3">
                <p className="text-ui-caption uppercase tracking-wide text-content-muted">Reason</p>
                <p className="mt-ui-1 text-ui-body">{uiSpec.reason}</p>
              </div>
            </div>

            <pre
              className="m-ui-6 flex-1 overflow-auto rounded-control bg-ink p-ui-4 text-ui-caption text-white"
              data-testid="ui-spec-json"
            >
              {JSON.stringify(uiSpec, null, 2)}
            </pre>
          </aside>
        </div>
      ) : null}
    </>
  )
}
