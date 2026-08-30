import type { StudioProjectIteration } from '@/studio/projects'

interface ProjectHistoryProps {
  iterations: StudioProjectIteration[]
  selectedId: number | null
  onSelect: (id: number) => void
}

function reasoningText(iteration: StudioProjectIteration): string {
  if (iteration.status === 'generating') return 'Generating UI…'
  if (iteration.status === 'error') return iteration.suggestion ?? 'The request failed.'
  return iteration.suggestion ?? 'The backend returned a layout without additional reasoning.'
}

export default function ProjectHistory({ iterations, selectedId, onSelect }: ProjectHistoryProps) {
  return (
    <section className="studio-history-card" aria-labelledby="project-history-title">
      <header>
        <div>
          <span className="studio-sidebar-label">Project memory</span>
          <h2 id="project-history-title">Reasoning history</h2>
        </div>
        <span>{iterations.length}</span>
      </header>

      {iterations.length ? (
        <ol className="studio-history-list">
          {iterations.map((iteration) => (
            <li key={iteration.id} className="studio-history-appear">
              <button
                type="button"
                className={selectedId === iteration.id ? 'is-selected' : ''}
                aria-label={`Open iteration ${iteration.id}`}
                onClick={() => onSelect(iteration.id)}
              >
                <span className="studio-history-avatar is-user">Y</span>
                <span className="studio-history-turn">
                  <span className="studio-history-role">You · Prompt {String(iteration.id).padStart(2, '0')}</span>
                  <strong>{iteration.prompt}</strong>
                </span>
                <span className="studio-history-avatar is-api">K</span>
                <span className="studio-history-turn is-reasoning">
                  <span className="studio-history-role">Backend reason</span>
                  <span>{reasoningText(iteration)}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="studio-history-empty">Your prompts and backend reasons will accumulate here.</p>
      )}
    </section>
  )
}
