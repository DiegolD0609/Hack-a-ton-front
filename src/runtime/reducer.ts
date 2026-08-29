import type {
  ActionId,
  DecisionId,
  IdempotencyKey,
  RunId,
  RunProjection,
  ServerEnvelope,
  UISpec,
} from '@/runtime/contracts'

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

export interface DecisionFeedback {
  status: 'idle' | 'submitting' | 'accepted' | 'rejected'
  errorMessage?: string | null
}

interface PendingAction {
  decisionId: DecisionId
  actionId: ActionId
}

export interface RunRuntimeState {
  runId: RunId
  connectionStatus: ConnectionStatus
  projection: RunProjection | null
  uiSpec: UISpec | null
  lastSequence: number
  decisionFeedback: Record<string, DecisionFeedback>
  pendingActions: Record<string, PendingAction>
  error: string | null
  invalidMessageCount: number
}

export type RunRuntimeAction =
  | { type: 'RESET'; runId: RunId }
  | { type: 'CONNECTING' }
  | { type: 'CONNECTED' }
  | { type: 'CLOSED'; reason?: string }
  | { type: 'SOCKET_ERROR'; message: string }
  | { type: 'INVALID_MESSAGE'; errors: string[] }
  | { type: 'SERVER_MESSAGE'; envelope: ServerEnvelope }
  | {
      type: 'ACTION_SUBMITTING'
      idempotencyKey: IdempotencyKey
      decisionId: DecisionId
      actionId: ActionId
    }
  | {
      type: 'ACTION_SEND_FAILED'
      idempotencyKey: IdempotencyKey
      decisionId: DecisionId
      message: string
    }

export function createInitialRunState(runId: RunId): RunRuntimeState {
  return {
    runId,
    connectionStatus: 'idle',
    projection: null,
    uiSpec: null,
    lastSequence: 0,
    decisionFeedback: {},
    pendingActions: {},
    error: null,
    invalidMessageCount: 0,
  }
}

function removePendingAction(
  pendingActions: Record<string, PendingAction>,
  idempotencyKey: IdempotencyKey,
): Record<string, PendingAction> {
  const next = { ...pendingActions }
  delete next[idempotencyKey]
  return next
}

function applyServerEnvelope(state: RunRuntimeState, envelope: ServerEnvelope): RunRuntimeState {
  if (envelope.runId !== state.runId || envelope.sequence < state.lastSequence) {
    return state
  }

  const base = {
    ...state,
    lastSequence: Math.max(state.lastSequence, envelope.sequence),
    error: null,
  }

  switch (envelope.type) {
    case 'UI_UPDATED':
      return {
        ...base,
        projection: envelope.payload.projection,
        uiSpec: envelope.payload.uiSpec,
      }

    case 'ACTION_ACCEPTED':
      return {
        ...base,
        projection: envelope.payload.projection,
        pendingActions: removePendingAction(
          state.pendingActions,
          envelope.payload.idempotencyKey,
        ),
        decisionFeedback: {
          ...state.decisionFeedback,
          [envelope.payload.decisionId]: { status: 'accepted' },
        },
      }

    case 'ACTION_REJECTED': {
      const pending = state.pendingActions[envelope.payload.idempotencyKey]
      const decisionId = pending?.decisionId ?? state.projection?.pendingDecision?.decisionId
      return {
        ...base,
        pendingActions: removePendingAction(
          state.pendingActions,
          envelope.payload.idempotencyKey,
        ),
        decisionFeedback: decisionId
          ? {
              ...state.decisionFeedback,
              [decisionId]: {
                status: 'rejected',
                errorMessage: envelope.payload.message,
              },
            }
          : state.decisionFeedback,
        error: envelope.payload.message,
      }
    }

    case 'ERROR':
      return { ...base, error: envelope.payload.message }

    case 'RUN_STARTED':
    case 'STEP_STARTED':
    case 'STEP_COMPLETED':
    case 'STATE_UPDATED':
    case 'DECISION_REQUIRED':
    case 'RUN_PAUSED':
    case 'RUN_RESUMED':
    case 'RUN_COMPLETED':
      return { ...base, projection: envelope.payload.projection }
  }
}

export function runRuntimeReducer(
  state: RunRuntimeState,
  action: RunRuntimeAction,
): RunRuntimeState {
  switch (action.type) {
    case 'RESET':
      return createInitialRunState(action.runId)
    case 'CONNECTING':
      return { ...state, connectionStatus: 'connecting', error: null }
    case 'CONNECTED':
      return { ...state, connectionStatus: 'open', error: null }
    case 'CLOSED':
      return {
        ...state,
        connectionStatus: 'closed',
        error: action.reason || state.error,
      }
    case 'SOCKET_ERROR':
      return { ...state, connectionStatus: 'error', error: action.message }
    case 'INVALID_MESSAGE':
      return {
        ...state,
        error: `Mensaje rechazado: ${action.errors.join(' · ')}`,
        invalidMessageCount: state.invalidMessageCount + 1,
      }
    case 'SERVER_MESSAGE':
      return applyServerEnvelope(state, action.envelope)
    case 'ACTION_SUBMITTING':
      return {
        ...state,
        pendingActions: {
          ...state.pendingActions,
          [action.idempotencyKey]: {
            decisionId: action.decisionId,
            actionId: action.actionId,
          },
        },
        decisionFeedback: {
          ...state.decisionFeedback,
          [action.decisionId]: { status: 'submitting' },
        },
        error: null,
      }
    case 'ACTION_SEND_FAILED':
      return {
        ...state,
        pendingActions: removePendingAction(state.pendingActions, action.idempotencyKey),
        decisionFeedback: {
          ...state.decisionFeedback,
          [action.decisionId]: { status: 'rejected', errorMessage: action.message },
        },
        error: action.message,
      }
  }
}
