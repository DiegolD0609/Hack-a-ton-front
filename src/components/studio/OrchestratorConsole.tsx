import { useEffect, useRef, type ReactNode } from 'react'
import StudioIcon from '@/components/studio/StudioIcon'
import {
  studioOrchestration,
  studioResponseMeta,
  summarizeLayout,
  type StudioOrchestrationMeta,
} from '@/studio/StudioRenderer'
import type { StudioProjectIteration } from '@/studio/projects'

interface OrchestratorConsoleProps {
  iterations: StudioProjectIteration[]
  selectedId: number | null
  isGenerating: boolean
  onSelect: (id: number) => void
}

function scoreGlyph(score: number | null): string {
  if (score === 1) return '👎'
  if (score === 5) return '👍'
  return ''
}

function feedbackWire(iteration: StudioProjectIteration): string {
  const score = iteration.feedbackScore
  const scoreText = score !== null ? `${scoreGlyph(score)} score ${score}`.trim() : ''
  if (iteration.feedbackStatus === 'sending') return `POST /feedback → sending… ${scoreText}`
  if (iteration.feedbackStatus === 'sent') {
    const comment = iteration.feedbackComment.trim()
    return `POST /feedback → 204 saved · ${scoreText}${comment ? ` "${comment}"` : ''}`
  }
  if (iteration.feedbackStatus === 'error') {
    return `POST /feedback → error · ${iteration.feedbackMessage ?? 'failed'}`
  }
  return ''
}

function turnLabel(iteration: StudioProjectIteration, orchestration: StudioOrchestrationMeta | null): string {
  if (iteration.status === 'generating') return 'generating…'
  if (iteration.status === 'error') return 'generation failed'
  if (orchestration) {
    if (orchestration.historyTurns === 0) return 'new project · reads the prompt cold'
    if ((orchestration.feedbackCount ?? 0) > 0) return 'after feedback · orchestrator adapts'
    return 'edit · history replayed'
  }
  return iteration.id === 1 ? 'new project' : 'edit'
}

function ConsoleLine({ field, children }: { field: string; children: ReactNode }) {
  return (
    <div className="studio-console-line">
      <span className="studio-console-field">{field}</span>
      <span className="studio-console-value">{children}</span>
    </div>
  )
}

function IterationEntry({
  iteration,
  isSelected,
  onSelect,
}: {
  iteration: StudioProjectIteration
  isSelected: boolean
  onSelect: (id: number) => void
}) {
  const meta = studioResponseMeta(iteration.response)
  const orchestration = studioOrchestration(iteration.response)
  const effort = orchestration?.reasoningEffort ?? '—'
  const outline = meta.layout ? summarizeLayout(meta.layout) : null

  const feedbackSummary = orchestration && (orchestration.feedbackCount ?? 0) > 0
    ? `avg ${orchestration.feedbackAverage?.toFixed(2) ?? '?'} · ${orchestration.feedbackCount} rating${orchestration.feedbackCount === 1 ? '' : 's'} → reasoning effort: ${effort}`
    : `none → reasoning effort: ${effort}`

  const contextSummary = orchestration
    ? `${orchestration.historyTurns ?? 0} history turn${orchestration.historyTurns === 1 ? '' : 's'}${orchestration.usedPreviousLayout ? ' · previous layout reused' : ''}`
    : 'replayed from saved project'

  return (
    <li className="studio-console-entry-shell">
      <button
        type="button"
        className={`studio-console-entry is-${iteration.status} ${isSelected ? 'is-selected' : ''}`}
        aria-current={isSelected}
        onClick={() => onSelect(iteration.id)}
      >
        <header className="studio-console-entry-head">
          <span className="studio-console-turn">
            TURN {String(iteration.id).padStart(2, '0')}
          </span>
          <span className="studio-console-label">{turnLabel(iteration, orchestration)}</span>
          <span className={`studio-console-effort is-${effort}`}>effort: {effort}</span>
        </header>

        <div className="studio-console-body">
          <ConsoleLine field="prompt">"{iteration.prompt}"</ConsoleLine>

          {iteration.status === 'generating' ? (
            <ConsoleLine field="status">
              <span className="studio-console-generating">
                <span className="studio-pulse-dot" /> el API está generando la interfaz…
              </span>
            </ConsoleLine>
          ) : iteration.status === 'error' ? (
            <ConsoleLine field="error">
              <span className="studio-console-error">{iteration.suggestion ?? 'Request failed'}</span>
            </ConsoleLine>
          ) : (
            <>
              <ConsoleLine field="feedback">{feedbackSummary}</ConsoleLine>
              <ConsoleLine field="context">{contextSummary}</ConsoleLine>
              <ConsoleLine field="result">
                {(meta.generatedBy ?? 'api')}
                {iteration.latencyMs !== null ? ` · ${Math.round(iteration.latencyMs)} ms` : ''}
                {outline ? ` · ${outline.nodeCount} nodes` : ''}
              </ConsoleLine>
              {meta.reason ? (
                <ConsoleLine field="reason">
                  <span className="studio-console-reason">{meta.reason}</span>
                </ConsoleLine>
              ) : null}
              {meta.suggestion ? (
                <div className="studio-console-line">
                  <span className="studio-console-field">suggest</span>
                  <aside className="studio-console-suggestion studio-suggestion-tip" aria-label="UX suggestion">
                    <StudioIcon name="message" size={13} />
                    <span>{meta.suggestion}</span>
                  </aside>
                </div>
              ) : null}
              {outline ? (
                <ConsoleLine field="layout">
                  <code className="studio-console-outline">{outline.outline}</code>
                </ConsoleLine>
              ) : null}
              {iteration.feedbackStatus !== 'idle' ? (
                <div className="studio-console-line">
                  <span className="studio-console-field">rating</span>
                  <span className={`studio-console-value studio-console-feedback is-${iteration.feedbackStatus}`}>
                    {iteration.feedbackStatus === 'sending' ? <span className="studio-pulse-dot" /> : null}
                    {feedbackWire(iteration)}
                  </span>
                </div>
              ) : null}
            </>
          )}
        </div>
      </button>
    </li>
  )
}

export default function OrchestratorConsole({
  iterations,
  selectedId,
  isGenerating,
  onSelect,
}: OrchestratorConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [iterations.length, isGenerating])

  return (
    <section className="studio-panel studio-console-panel" aria-labelledby="orchestrator-console-title">
      <header className="studio-panel-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="studio-index">02</span>
          <div className="min-w-0">
            <h2 id="orchestrator-console-title" className="studio-panel-title">Orchestrator console</h2>
            <p className="studio-panel-subtitle">HOW THE LLM READS PROMPT · HISTORY · FEEDBACK</p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="studio-console-scroll" role="log" aria-label="Orchestrator console" aria-live="polite">
        {iterations.length ? (
          <ol className="studio-console-list">
            {iterations.map((iteration) => (
              <IterationEntry
                key={iteration.id}
                iteration={iteration}
                isSelected={selectedId === iteration.id}
                onSelect={onSelect}
              />
            ))}
          </ol>
        ) : (
          <p className="studio-console-empty">
            <span className="studio-console-prompt-glyph">$</span>
            Cada generación se registra aquí: el prompt que leyó el modelo, cuánta historia se reenvió,
            el feedback reciente y el nivel de razonamiento que el orquestador escaló.
          </p>
        )}
      </div>
    </section>
  )
}
