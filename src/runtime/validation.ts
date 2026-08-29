import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import type { ServerEnvelope, UISpec, UINode } from '@/runtime/contracts'
import serverEnvelopeSchema from '@/runtime/generated/server-envelope.schema.json'
import uiSpecSchema from '@/runtime/generated/ui-spec.schema.json'

export type RegisteredComponentType =
  | 'page'
  | 'section'
  | 'metric'
  | 'alert'
  | 'timeline'
  | 'keyValue'
  | 'compare'
  | 'decisionPanel'
  | 'step'

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] }

const ajv = new Ajv({
  allErrors: true,
  strict: false,
})

addFormats(ajv)

const validateUISpecSchema = ajv.compile(uiSpecSchema)
const validateServerEnvelopeSchema = ajv.compile(serverEnvelopeSchema)

const propsDefinitionByType: Record<RegisteredComponentType, string> = {
  page: 'PageProps',
  section: 'SectionProps',
  metric: 'MetricProps',
  alert: 'AlertProps',
  timeline: 'TimelineProps',
  keyValue: 'KeyValueProps',
  compare: 'CompareProps',
  decisionPanel: 'DecisionPanelProps',
  step: 'StepProps',
}

const componentPropsValidators = Object.fromEntries(
  Object.entries(propsDefinitionByType).map(([type, definition]) => [
    type,
    ajv.compile({
      $defs: uiSpecSchema.$defs,
      $ref: `#/$defs/${definition}`,
    }),
  ]),
) as Record<RegisteredComponentType, ValidateFunction>

function cloneJson(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value)) as unknown
  } catch {
    return undefined
  }
}

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors?.length) {
    return ['El mensaje no cumple el contrato runtime.']
  }

  const visibleErrors = errors.slice(0, 8).map((error) => {
    const path = error.instancePath || '/'
    return `${path}: ${error.message ?? 'valor inválido'}`
  })

  if (errors.length > visibleErrors.length) {
    visibleErrors.push(`… y ${errors.length - visibleErrors.length} errores adicionales`)
  }

  return visibleErrors
}

function hydrateDefaultFactories(uiSpec: UISpec) {
  uiSpec.schemaVersion ??= '1'
  uiSpec.allowedActions ??= []
  for (const action of uiSpec.allowedActions) {
    action.payloadSchema ??= { type: 'object', additionalProperties: false }
  }

  const visit = (node: UINode) => {
    if (node.type === 'section') {
      node.children ??= []
      node.props.columns ??= 1
      node.props.emphasis ??= 'normal'
    } else if (node.type === 'metric') {
      node.props.emphasis ??= 'normal'
    } else if (node.type === 'keyValue') {
      node.props.columns ??= 1
      node.props.items.forEach((item) => {
        item.emphasis ??= 'normal'
      })
    } else if (node.type === 'decisionPanel') {
      node.props.status ??= 'idle'
      node.props.emphasis ??= 'warning'
      node.props.actions.forEach((action) => {
        action.style ??= 'secondary'
        action.requiresConfirmation ??= false
      })
    } else if (node.type === 'step') {
      node.props.emphasis ??= 'normal'
    }
    if (node.type === 'page' || node.type === 'section') {
      node.children.forEach(visit)
    }
  }

  visit(uiSpec.layout)
}

function uiSpecInvariantErrors(uiSpec: UISpec): string[] {
  const errors: string[] = []
  const allowedActionIds = uiSpec.allowedActions.map((action) => action.actionId)
  const allowedActionSet = new Set(allowedActionIds)

  if (allowedActionSet.size !== allowedActionIds.length) {
    errors.push('/allowedActions: actionId values must be unique')
  }

  const nodeIds = new Set<string>()

  const visit = (node: UINode, root = false) => {
    if (nodeIds.has(node.id)) {
      errors.push(`/layout: duplicate node id ${node.id}`)
    }
    nodeIds.add(node.id)

    if (!root && node.type === 'page') {
      errors.push(`/layout: page node ${node.id} cannot be nested`)
    }

    if (node.type === 'decisionPanel') {
      const panelActionIds = node.props.actions.map((action) => action.actionId)
      if (new Set(panelActionIds).size !== panelActionIds.length) {
        errors.push(`/layout/${node.id}: decision actions must be unique`)
      }
      for (const actionId of panelActionIds) {
        if (!allowedActionSet.has(actionId)) {
          errors.push(`/layout/${node.id}: action ${actionId} is not allowed`)
        }
      }
      if (node.props.status === 'rejected' && !node.props.errorMessage) {
        errors.push(`/layout/${node.id}: rejected status requires errorMessage`)
      }
    }

    if (node.type === 'page' || node.type === 'section') {
      node.children.forEach((child) => visit(child))
    }
  }

  visit(uiSpec.layout, true)
  return errors
}

export function validateUISpec(input: unknown): ValidationResult<UISpec> {
  const candidate = cloneJson(input)

  if (!validateUISpecSchema(candidate)) {
    return { ok: false, errors: formatErrors(validateUISpecSchema.errors) }
  }

  const uiSpec = candidate as unknown as UISpec
  hydrateDefaultFactories(uiSpec)
  const errors = uiSpecInvariantErrors(uiSpec)

  return errors.length ? { ok: false, errors } : { ok: true, value: uiSpec }
}

function serverEnvelopeInvariantErrors(envelope: ServerEnvelope): string[] {
  const errors: string[] = []
  const { event } = envelope.payload

  if (event.runId !== envelope.runId) {
    errors.push('/payload/event/runId: must match envelope runId')
  }
  if (event.sequence !== envelope.sequence) {
    errors.push('/payload/event/sequence: must match envelope sequence')
  }

  if ('projection' in envelope.payload) {
    const { projection } = envelope.payload
    projection.operation ??= {}
    projection.recentEvents ??= []
    projection.availableActions ??= []

    for (const action of projection.availableActions) {
      action.payloadSchema ??= { type: 'object', additionalProperties: false }
    }

    if (projection.runId !== envelope.runId) {
      errors.push('/payload/projection/runId: must match envelope runId')
    }
  }

  if (envelope.type === 'UI_UPDATED') {
    const result = validateUISpec(envelope.payload.uiSpec)
    if (!result.ok) {
      errors.push(...result.errors.map((error) => `/payload/uiSpec${error}`))
    } else {
      envelope.payload.uiSpec = result.value
      const { projection, uiSpec } = envelope.payload
      if (
        projection.workflowId !== uiSpec.workflowId ||
        projection.workflowVersion !== uiSpec.workflowVersion ||
        projection.stateVersion !== uiSpec.stateVersion
      ) {
        errors.push('/payload/uiSpec: must match the projection that generated it')
      }

      const projectionActions = new Set(
        projection.availableActions.map((action) => action.actionId),
      )
      for (const action of uiSpec.allowedActions) {
        if (!projectionActions.has(action.actionId)) {
          errors.push(`/payload/uiSpec/allowedActions: ${action.actionId} is not in projection`)
        }
      }
    }
  }

  return errors
}

export function validateServerEnvelope(input: unknown): ValidationResult<ServerEnvelope> {
  const candidate = cloneJson(input)

  if (!validateServerEnvelopeSchema(candidate)) {
    return { ok: false, errors: formatErrors(validateServerEnvelopeSchema.errors) }
  }

  const envelope = candidate as ServerEnvelope
  const errors = serverEnvelopeInvariantErrors(envelope)
  return errors.length ? { ok: false, errors } : { ok: true, value: envelope }
}

export function assertComponentProps(type: RegisteredComponentType, props: unknown): void {
  const validate = componentPropsValidators[type]
  if (!validate(props)) {
    throw new Error(formatErrors(validate.errors).join('; '))
  }
}
