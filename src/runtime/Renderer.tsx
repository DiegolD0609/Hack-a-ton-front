import { Component, type ErrorInfo, type ReactNode } from 'react'
import { GenericStepCard, type DecisionActionRequest } from '@/components/ui-kit'
import type { UISpec } from '@/runtime/contracts'
import type { DecisionFeedback } from '@/runtime/reducer'
import { componentRegistry, isRegisteredComponentType } from '@/runtime/registry'
import { assertComponentProps, type RegisteredComponentType } from '@/runtime/validation'

interface RuntimeNodeRecord {
  id?: unknown
  type?: unknown
  props?: unknown
  children?: unknown
}

interface NodeRendererProps {
  node: unknown
  depth: number
  onAction?: (request: DecisionActionRequest) => void
  decisionFeedback?: Readonly<Record<string, DecisionFeedback>>
}

interface NodeErrorBoundaryProps {
  nodeKey: string
  fallback: ReactNode
  children: ReactNode
}

interface NodeErrorBoundaryState {
  failed: boolean
}

class NodeErrorBoundary extends Component<NodeErrorBoundaryProps, NodeErrorBoundaryState> {
  state: NodeErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): NodeErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.warn('Runtime node isolated by its error boundary.', error, info.componentStack)
    }
  }

  componentDidUpdate(previousProps: NodeErrorBoundaryProps) {
    if (previousProps.nodeKey !== this.props.nodeKey && this.state.failed) {
      this.setState({ failed: false })
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function isNodeRecord(node: unknown): node is RuntimeNodeRecord {
  return typeof node === 'object' && node !== null && !Array.isArray(node)
}

function nodeIdentity(node: RuntimeNodeRecord, fallback: string): string {
  return typeof node.id === 'string' ? node.id : fallback
}

function InvalidNode({ node, reason }: { node: RuntimeNodeRecord | null; reason: string }) {
  const type = node && typeof node.type === 'string' ? node.type : 'desconocido'
  const id = node && typeof node.id === 'string' ? node.id : null

  return (
    <GenericStepCard
      title={`Componente ${type}`}
      stepId={id}
      summary={reason}
      status="attention"
    />
  )
}

interface RegisteredNodeProps extends NodeRendererProps {
  node: RuntimeNodeRecord
  type: RegisteredComponentType
}

function RegisteredNode({
  node,
  type,
  depth,
  onAction,
  decisionFeedback,
}: RegisteredNodeProps) {
  const entry = componentRegistry[type]
  assertComponentProps(type, node.props)

  let children: ReactNode = null
  if (entry.acceptsChildren) {
    if (!Array.isArray(node.children)) {
      throw new Error(`${type} requires a children array`)
    }
    if (type === 'page' && node.children.length === 0) {
      throw new Error('page requires at least one child')
    }
    children = node.children.map((child, index) => {
      const childRecord = isNodeRecord(child) ? child : null
      return (
        <NodeRenderer
          key={childRecord ? nodeIdentity(childRecord, `${nodeIdentity(node, type)}-${index}`) : index}
          node={child}
          depth={depth + 1}
          onAction={onAction}
          decisionFeedback={decisionFeedback}
        />
      )
    })
  } else if (node.children !== undefined) {
    throw new Error(`${type} does not accept children`)
  }

  return entry.render({ props: node.props, children, onAction, decisionFeedback })
}

export function NodeRenderer({ node, depth = 0, onAction, decisionFeedback }: NodeRendererProps) {
  if (!isNodeRecord(node)) {
    return <InvalidNode node={null} reason="El nodo recibido no es un objeto válido." />
  }

  const type = typeof node.type === 'string' ? node.type : 'desconocido'
  if (!isRegisteredComponentType(type)) {
    return <InvalidNode node={node} reason={`El tipo “${type}” no existe en el registry P0.`} />
  }

  if (depth > 0 && type === 'page') {
    return <InvalidNode node={node} reason="Un nodo page no puede estar anidado." />
  }

  const key = `${nodeIdentity(node, type)}:${type}`
  const fallback = (
    <InvalidNode
      node={node}
      reason="Las props de este nodo no cumplen el contrato; el resto de la interfaz continúa disponible."
    />
  )

  return (
    <NodeErrorBoundary nodeKey={key} fallback={fallback}>
      <RegisteredNode
        node={node}
        type={type}
        depth={depth}
        onAction={onAction}
        decisionFeedback={decisionFeedback}
      />
    </NodeErrorBoundary>
  )
}

interface RendererProps {
  uiSpec: UISpec
  onAction?: (request: DecisionActionRequest) => void
  decisionFeedback?: Readonly<Record<string, DecisionFeedback>>
}

export default function Renderer({ uiSpec, onAction, decisionFeedback }: RendererProps) {
  const allowedActions = new Set(uiSpec.allowedActions.map((action) => action.actionId))

  const submitAllowedAction = (request: DecisionActionRequest) => {
    if (allowedActions.has(request.actionId)) {
      onAction?.(request)
    }
  }

  return (
    <NodeRenderer
      node={uiSpec.layout}
      depth={0}
      onAction={submitAllowedAction}
      decisionFeedback={decisionFeedback}
    />
  )
}
