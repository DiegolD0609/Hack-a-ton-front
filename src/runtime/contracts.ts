/**
 * Frozen v1 wire contracts plus the approved v1.1 frontend additions.
 *
 * Pydantic in Hack-a-ton-end/app/schemas/contracts.py is the executable
 * authority. Keep this reviewed mirror, the Phase 0 docs, and backend tests in
 * the same contract change.
 */

export const SCHEMA_VERSION = '1' as const

export const COMPONENT_TYPES = [
  'page',
  'section',
  'metric',
  'alert',
  'timeline',
  'keyValue',
  'compare',
  'decisionPanel',
  'step',
  'map',
] as const

export const SERVER_MESSAGE_TYPES = [
  'RUN_STARTED',
  'STEP_STARTED',
  'STEP_COMPLETED',
  'STATE_UPDATED',
  'UI_UPDATED',
  'DECISION_REQUIRED',
  'ACTION_ACCEPTED',
  'ACTION_REJECTED',
  'RUN_PAUSED',
  'RUN_RESUMED',
  'RUN_COMPLETED',
  'ERROR',
] as const

export const ID_PATTERNS = {
  workflow: /^wf_[a-z0-9][a-z0-9_-]{0,127}$/,
  step: /^step_[a-z0-9][a-z0-9_-]{0,127}$/,
  run: /^run_[a-z0-9][a-z0-9_-]{0,127}$/,
  decision: /^dec_[a-z0-9][a-z0-9_-]{0,127}$/,
  action: /^act_[a-z0-9][a-z0-9_-]{0,127}$/,
  event: /^evt_[a-z0-9][a-z0-9_-]{0,127}$/,
  idempotency: /^idem_[a-z0-9][a-z0-9_-]{0,127}$/,
  uiNode: /^ui_[a-z0-9][a-z0-9_-]{0,127}$/,
} as const

export type SchemaVersion = typeof SCHEMA_VERSION
export type ComponentType = (typeof COMPONENT_TYPES)[number]
export type ServerMessageType = (typeof SERVER_MESSAGE_TYPES)[number]

export type WorkflowId = `wf_${string}`
export type StepId = `step_${string}`
export type RunId = `run_${string}`
export type DecisionId = `dec_${string}`
export type ActionId = `act_${string}`
export type EventId = `evt_${string}`
export type IdempotencyKey = `idem_${string}`
export type UINodeId = `ui_${string}`
export type IsoTimestamp = string

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
export type JsonObject = { [key: string]: JsonValue }
export type DisplayValue = string | number | boolean
export type ComparableValue = DisplayValue | null

export type Emphasis = 'normal' | 'warning' | 'critical'
export type RunStatus = 'created' | 'running' | 'paused' | 'completed' | 'failed'
export type StepStatus = 'pending' | 'active' | 'completed' | 'attention' | 'failed'
export type ActionRisk = 'low' | 'medium' | 'high' | 'critical'

export interface ActionDefinition {
  actionId: ActionId
  label: string
  description?: string | null
  risk: ActionRisk
  requiresHuman: boolean
  payloadSchema: JsonObject
}

export interface DecisionRequest {
  decisionId: DecisionId
  stepId: StepId
  title: string
  prompt: string
  context: JsonObject
  requestedAt: IsoTimestamp
}

export interface RunStepProjection {
  id: StepId
  type: string
  title: string
  objective?: string | null
  status: StepStatus
  metadata: JsonObject
}

export interface RunEvent {
  schemaVersion: SchemaVersion
  eventId: EventId
  runId: RunId
  workflowId: WorkflowId
  workflowVersion: number
  sequence: number
  stateVersion: number
  type: string
  stepId?: StepId | null
  payload: JsonValue
  timestamp: IsoTimestamp
}

export interface RunProjection {
  schemaVersion: SchemaVersion
  runId: RunId
  workflowId: WorkflowId
  workflowVersion: number
  stateVersion: number
  lastSequence: number
  status: RunStatus
  currentStep?: RunStepProjection | null
  operation: JsonObject
  recentEvents: RunEvent[]
  pendingDecision?: DecisionRequest | null
  availableActions: ActionDefinition[]
  /** Shared by successive runs of the same operation in the v1.1 demo contract. */
  operationId?: string | null
}

export interface PageProps {
  title: string
  subtitle?: string | null
  eyebrow?: string | null
}

export interface SectionProps {
  title?: string | null
  description?: string | null
  columns: 1 | 2 | 3
  emphasis: Emphasis
}

export interface MetricProps {
  label: string
  value: string | number
  supportingText?: string | null
  trend?: 'up' | 'down' | 'flat' | null
  emphasis: Emphasis
}

export interface AlertProps {
  title: string
  message: string
  emphasis: Emphasis
}

export interface TimelineItem {
  id: StepId
  title: string
  status: StepStatus
  detail?: string | null
  timestamp?: IsoTimestamp | null
}

export interface TimelineProps {
  title?: string | null
  items: TimelineItem[]
}

export interface KeyValueItem {
  key: string
  label: string
  value: DisplayValue
  emphasis: Emphasis
}

export interface KeyValueProps {
  title?: string | null
  items: KeyValueItem[]
  columns: 1 | 2
}

export interface CompareRow {
  key: string
  label: string
  before: ComparableValue
  after: ComparableValue
  outcome: 'same' | 'changed' | 'improved' | 'worse' | 'attention'
}

export interface CompareProps {
  title: string
  leftLabel: string
  rightLabel: string
  rows: CompareRow[]
}

export interface DecisionAction {
  actionId: ActionId
  label: string
  style: 'primary' | 'secondary' | 'danger'
  requiresConfirmation: boolean
}

export interface DecisionPanelProps {
  decisionId: DecisionId
  title: string
  message?: string | null
  actions: DecisionAction[]
  status: 'idle' | 'submitting' | 'accepted' | 'rejected'
  errorMessage?: string | null
  emphasis: Emphasis
}

export interface StepProps {
  stepId: StepId
  title: string
  objective?: string | null
  status: StepStatus
  summary?: string | null
  verdict?: 'pass' | 'attention' | 'fail' | 'unknown' | null
  emphasis: Emphasis
}

export interface MapWaypoint {
  id: string
  label: string
  lat: number
  lon: number
  kind: 'origin' | 'stop' | 'destination'
}

export interface MapMarker {
  lat: number
  lon: number
  label: string
}

export interface MapSegment {
  from: string
  to: string
  status: 'planned' | 'active' | 'diverted'
}

export interface MapProps {
  waypoints: MapWaypoint[]
  marker?: MapMarker | null
  segments: MapSegment[]
  emphasis: Emphasis
}

export interface PageNode {
  id: UINodeId
  type: 'page'
  props: PageProps
  children: UINode[]
}

export interface SectionNode {
  id: UINodeId
  type: 'section'
  props: SectionProps
  children: UINode[]
}

export interface MetricNode {
  id: UINodeId
  type: 'metric'
  props: MetricProps
}

export interface AlertNode {
  id: UINodeId
  type: 'alert'
  props: AlertProps
}

export interface TimelineNode {
  id: UINodeId
  type: 'timeline'
  props: TimelineProps
}

export interface KeyValueNode {
  id: UINodeId
  type: 'keyValue'
  props: KeyValueProps
}

export interface CompareNode {
  id: UINodeId
  type: 'compare'
  props: CompareProps
}

export interface DecisionPanelNode {
  id: UINodeId
  type: 'decisionPanel'
  props: DecisionPanelProps
}

export interface StepNode {
  id: UINodeId
  type: 'step'
  props: StepProps
}

export interface MapNode {
  id: UINodeId
  type: 'map'
  props: MapProps
}

export type UINode =
  | PageNode
  | SectionNode
  | MetricNode
  | AlertNode
  | TimelineNode
  | KeyValueNode
  | CompareNode
  | DecisionPanelNode
  | StepNode
  | MapNode

export interface UISpec {
  schemaVersion: SchemaVersion
  runId: RunId
  workflowId: WorkflowId
  workflowVersion: number
  stateVersion: number
  generatedBy: 'deterministic' | 'llm' | 'fallback'
  reason: string
  layout: PageNode
  allowedActions: ActionDefinition[]
}

/** A client command. The server is solely responsible for creating eventId. */
export interface ActionEvent {
  schemaVersion: SchemaVersion
  idempotencyKey: IdempotencyKey
  runId: RunId
  workflowVersion: number
  stateVersion: number
  decisionId: DecisionId
  actionId: ActionId
  payload: JsonValue
  timestamp: IsoTimestamp
}

export interface ProjectionPayload {
  event: RunEvent
  projection: RunProjection
}

export interface UIUpdatedPayload extends ProjectionPayload {
  uiSpec: UISpec
}

export interface ActionAcceptedPayload extends ProjectionPayload {
  idempotencyKey: IdempotencyKey
  decisionId: DecisionId
  actionId: ActionId
}

export interface ActionRejectedPayload {
  event: RunEvent
  code: string
  message: string
  idempotencyKey: IdempotencyKey
  currentStateVersion: number
}

export interface ErrorPayload {
  event: RunEvent
  code: string
  message: string
  retryable: boolean
}

export type ProjectionMessageType =
  | 'RUN_STARTED'
  | 'STEP_STARTED'
  | 'STEP_COMPLETED'
  | 'STATE_UPDATED'
  | 'DECISION_REQUIRED'
  | 'RUN_PAUSED'
  | 'RUN_RESUMED'
  | 'RUN_COMPLETED'

export interface WebSocketEnvelopeBase<TType extends string, TPayload> {
  schemaVersion: SchemaVersion
  type: TType
  runId: RunId
  sequence: number
  timestamp: IsoTimestamp
  payload: TPayload
}

export type ProjectionEnvelope = WebSocketEnvelopeBase<
  ProjectionMessageType,
  ProjectionPayload
>
export type UIUpdatedEnvelope = WebSocketEnvelopeBase<'UI_UPDATED', UIUpdatedPayload>
export type ActionAcceptedEnvelope = WebSocketEnvelopeBase<
  'ACTION_ACCEPTED',
  ActionAcceptedPayload
>
export type ActionRejectedEnvelope = WebSocketEnvelopeBase<
  'ACTION_REJECTED',
  ActionRejectedPayload
>
export type ErrorEnvelope = WebSocketEnvelopeBase<'ERROR', ErrorPayload>
export type ActionSubmittedEnvelope = WebSocketEnvelopeBase<
  'ACTION_SUBMITTED',
  ActionEvent
>

export type ServerEnvelope =
  | ProjectionEnvelope
  | UIUpdatedEnvelope
  | ActionAcceptedEnvelope
  | ActionRejectedEnvelope
  | ErrorEnvelope

export type WebSocketEnvelope = ServerEnvelope | ActionSubmittedEnvelope
