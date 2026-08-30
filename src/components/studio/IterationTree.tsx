import { useEffect, useRef } from 'react'

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

interface NodePosition {
  depth: number
  x: number
  y: number
}

const NODE_WIDTH = 210
const NODE_HEIGHT = 112
const COLUMN_GAP = 64
const ROW_GAP = 134
const CANVAS_PADDING = 16

function nodeSummary(node: IterationTreeNode): string {
  if (node.status === 'generating') return 'Generating…'
  if (node.status === 'error') return node.suggestion ?? 'Request failed'
  return node.suggestion ?? 'Layout received'
}

function connectorPath(parent: NodePosition, child: NodePosition): string {
  const startX = parent.x + NODE_WIDTH
  const endX = child.x
  const middleX = startX + (endX - startX) / 2

  return `M ${startX} ${parent.y} C ${middleX} ${parent.y}, ${middleX} ${child.y}, ${endX} ${child.y}`
}

export default function IterationTree({ iterations, selectedId, onSelect }: IterationTreeProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const newestId = iterations.reduce((max, iteration) => Math.max(max, iteration.id), 0)
  const childrenByParent = new Map<number | null, IterationTreeNode[]>()

  for (const iteration of iterations) {
    const siblings = childrenByParent.get(iteration.parentId) ?? []
    siblings.push(iteration)
    childrenByParent.set(iteration.parentId, siblings)
  }

  const positions = new Map<number | null, NodePosition>()
  let leafIndex = 0
  let maxDepth = 0

  const positionBranch = (nodeId: number | null, depth: number): number => {
    const children = childrenByParent.get(nodeId) ?? []
    maxDepth = Math.max(maxDepth, depth)

    let y: number
    if (children.length === 0) {
      y = CANVAS_PADDING + NODE_HEIGHT / 2 + leafIndex * ROW_GAP
      leafIndex += 1
    } else {
      const childPositions = children.map((child) => positionBranch(child.id, depth + 1))
      y = (childPositions[0] + childPositions[childPositions.length - 1]) / 2
    }

    positions.set(nodeId, {
      depth,
      x: CANVAS_PADDING + depth * (NODE_WIDTH + COLUMN_GAP),
      y,
    })
    return y
  }

  positionBranch(null, 0)

  const canvasWidth =
    CANVAS_PADDING * 2 + (maxDepth + 1) * NODE_WIDTH + maxDepth * COLUMN_GAP
  const canvasHeight = Math.max(
    112,
    CANVAS_PADDING * 2 + NODE_HEIGHT + Math.max(0, leafIndex - 1) * ROW_GAP,
  )
  const rootPosition = positions.get(null) as NodePosition

  useEffect(() => {
    const selectedNode = scrollRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    selectedNode?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [iterations.length, selectedId])

  return (
    <section className="studio-iteration-card" aria-labelledby="iteration-tree-title">
      <header>
        <div>
          <span className="studio-sidebar-label">Evolution</span>
          <h2 id="iteration-tree-title">Iteration tree</h2>
        </div>
        <span className="studio-tree-count">{iterations.length}</span>
      </header>

      <div className="studio-tree-direction" aria-hidden="true">
        <span>Root</span>
        <span>Branches →</span>
      </div>
      <div ref={scrollRef} className="studio-tree-scroll" role="tree" aria-orientation="horizontal">
        <div
          className="studio-tree-canvas"
          style={{ width: canvasWidth, height: canvasHeight }}
        >
          <svg
            className="studio-tree-links"
            width={canvasWidth}
            height={canvasHeight}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            aria-hidden="true"
          >
            {iterations.map((iteration) => {
              const parent = positions.get(iteration.parentId)
              const child = positions.get(iteration.id)
              if (!parent || !child) return null

              return (
                <path
                  key={iteration.id}
                  className="studio-tree-link"
                  d={connectorPath(parent, child)}
                />
              )
            })}
          </svg>

          <button
            type="button"
            role="treeitem"
            aria-level={1}
            aria-selected={selectedId === null}
            className={`studio-tree-root ${selectedId === null ? 'is-selected' : ''}`}
            style={{ left: rootPosition.x, top: rootPosition.y - NODE_HEIGHT / 2 }}
            onClick={() => onSelect(null)}
          >
            <span className="studio-tree-node-head">
              <span className="studio-tree-node-index">00</span>
              <span className="studio-tree-node-kind">STATE</span>
              <span className="studio-tree-root-dot" />
            </span>
            <span className="studio-tree-node-copy">
              <strong>Start state</strong>
              <small>Empty playground</small>
            </span>
          </button>

          {iterations.map((iteration) => {
            const position = positions.get(iteration.id) as NodePosition

            return (
              <button
                key={iteration.id}
                type="button"
                role="treeitem"
                aria-level={position.depth + 1}
                aria-selected={selectedId === iteration.id}
                className={`studio-tree-node studio-tree-appear is-${iteration.status} ${selectedId === iteration.id ? 'is-selected' : ''} ${iteration.id === newestId ? 'is-newest' : ''}`}
                style={{ left: position.x, top: position.y - NODE_HEIGHT / 2 }}
                onClick={() => onSelect(iteration.id)}
              >
                <span className="studio-tree-node-head">
                  <span className="studio-tree-node-index">
                    {String(iteration.id).padStart(2, '0')}
                  </span>
                  <span className="studio-tree-node-kind">PROMPT</span>
                  <span className="studio-tree-status" aria-hidden="true" />
                </span>
                <span className="studio-tree-node-copy">
                  <strong>{iteration.prompt}</strong>
                  <small>{nodeSummary(iteration)}</small>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
