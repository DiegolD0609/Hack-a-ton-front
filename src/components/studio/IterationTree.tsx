export type IterationStatus = 'generating' | 'completed' | 'error'

export interface IterationTreeNode {
  id: number
  parentId: number | null
  prompt: string
  status: IterationStatus
  suggestion: string | null
}

interface IterationTreeProps {
  iterations: IterationTreeNode[]
  selectedId: number | null
  onSelect: (id: number | null) => void
}

function nodeSummary(node: IterationTreeNode): string {
  if (node.status === 'generating') return 'Generating…'
  if (node.status === 'error') return node.suggestion ?? 'Request failed'
  return node.suggestion ?? 'Layout received'
}

export default function IterationTree({ iterations, selectedId, onSelect }: IterationTreeProps) {
  const childrenByParent = new Map<number | null, IterationTreeNode[]>()
  for (const iteration of iterations) {
    const siblings = childrenByParent.get(iteration.parentId) ?? []
    siblings.push(iteration)
    childrenByParent.set(iteration.parentId, siblings)
  }

  const renderBranches = (parentId: number | null) => {
    const children = childrenByParent.get(parentId) ?? []
    if (!children.length) return null

    return (
      <ul role="group">
        {children.map((iteration) => (
          <li key={iteration.id} role="none">
            <button
              type="button"
              role="treeitem"
              aria-selected={selectedId === iteration.id}
              className={`studio-tree-node is-${iteration.status} ${selectedId === iteration.id ? 'is-selected' : ''}`}
              onClick={() => onSelect(iteration.id)}
            >
              <span className="studio-tree-node-index">{String(iteration.id).padStart(2, '0')}</span>
              <span className="studio-tree-node-copy">
                <strong>{iteration.prompt}</strong>
                <small>{nodeSummary(iteration)}</small>
              </span>
              <span className="studio-tree-status" aria-hidden="true" />
            </button>
            {renderBranches(iteration.id)}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section className="studio-iteration-card" aria-labelledby="iteration-tree-title">
      <header>
        <div>
          <span className="studio-sidebar-label">Evolution</span>
          <h2 id="iteration-tree-title">Iteration tree</h2>
        </div>
        <span className="studio-tree-count">{iterations.length}</span>
      </header>

      <div className="studio-tree-scroll" role="tree">
        <button
          type="button"
          role="treeitem"
          aria-selected={selectedId === null}
          className={`studio-tree-root ${selectedId === null ? 'is-selected' : ''}`}
          onClick={() => onSelect(null)}
        >
          <span className="studio-tree-root-dot" />
          <span>
            <strong>Start state</strong>
            <small>Empty playground</small>
          </span>
        </button>
        {renderBranches(null)}
      </div>
    </section>
  )
}
