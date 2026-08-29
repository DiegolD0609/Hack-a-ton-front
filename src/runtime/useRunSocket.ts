import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { DecisionActionRequest } from '@/components/ui-kit'
import {
  SCHEMA_VERSION,
  type ActionEvent,
  type ActionSubmittedEnvelope,
  type IdempotencyKey,
  type JsonValue,
  type RunId,
} from '@/runtime/contracts'
import {
  createInitialRunState,
  runRuntimeReducer,
  type RunRuntimeState,
} from '@/runtime/reducer'
import { validateServerEnvelope } from '@/runtime/validation'

const SOCKET_OPEN = 1
let fallbackId = 0

export interface RuntimeSocket {
  readonly readyState: number
  onopen: ((event: Event) => void) | null
  onmessage: ((event: MessageEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onclose: ((event: CloseEvent) => void) | null
  send(data: string): void
  close(code?: number, reason?: string): void
}

export interface UseRunSocketOptions {
  runId: RunId
  apiUrl: string
  token: string
  enabled?: boolean
  socketFactory?: (url: string) => RuntimeSocket
}

export interface UseRunSocketResult extends RunRuntimeState {
  socketUrl: string
  submitAction: (request: DecisionActionRequest, payload?: JsonValue) => boolean
}

function defaultSocketFactory(url: string): RuntimeSocket {
  return new WebSocket(url)
}

function createIdempotencyKey(): IdempotencyKey {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${fallbackId++}`
  return `idem_${randomPart.toLowerCase()}` as IdempotencyKey
}

export function buildRunSocketUrl(apiUrl: string, runId: RunId, token: string): string {
  const base = new URL(apiUrl, window.location.origin)
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:'
  base.pathname = `${base.pathname.replace(/\/$/, '')}/ws/runs/${encodeURIComponent(runId)}`
  base.search = ''
  base.searchParams.set('token', token)
  return base.toString()
}

async function decodeMessageData(data: unknown): Promise<unknown> {
  let text: string
  if (typeof data === 'string') {
    text = data
  } else if (data instanceof Blob) {
    text = await data.text()
  } else {
    throw new Error('El WebSocket envió un payload no textual.')
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error('El WebSocket envió JSON inválido.')
  }
}

export default function useRunSocket({
  runId,
  apiUrl,
  token,
  enabled = true,
  socketFactory = defaultSocketFactory,
}: UseRunSocketOptions): UseRunSocketResult {
  const [state, dispatch] = useReducer(runRuntimeReducer, runId, createInitialRunState)
  const socketRef = useRef<RuntimeSocket | null>(null)
  const socketUrl = buildRunSocketUrl(apiUrl, runId, token)

  useEffect(() => {
    dispatch({ type: 'RESET', runId })
    if (!enabled) {
      return
    }

    dispatch({ type: 'CONNECTING' })
    let disposed = false
    let socket: RuntimeSocket

    try {
      socket = socketFactory(socketUrl)
      socketRef.current = socket
    } catch {
      dispatch({
        type: 'SOCKET_ERROR',
        message: 'No fue posible crear la conexión WebSocket.',
      })
      return
    }

    const connectionTimeout = window.setTimeout(() => {
      if (!disposed && socket.readyState !== SOCKET_OPEN) {
        dispatch({
          type: 'SOCKET_ERROR',
          message: 'El backend no abrió el WebSocket en 5 segundos.',
        })
        socket.close(4000, 'connection timeout')
      }
    }, 5_000)

    socket.onopen = () => {
      if (!disposed) {
        window.clearTimeout(connectionTimeout)
        dispatch({ type: 'CONNECTED' })
      }
    }

    socket.onmessage = (event) => {
      void decodeMessageData(event.data)
        .then((input) => {
          if (disposed) {
            return
          }
          const result = validateServerEnvelope(input)
          if (!result.ok) {
            dispatch({ type: 'INVALID_MESSAGE', errors: result.errors })
            return
          }
          if (result.value.runId !== runId) {
            dispatch({ type: 'INVALID_MESSAGE', errors: ['runId no coincide con la conexión'] })
            return
          }
          dispatch({ type: 'SERVER_MESSAGE', envelope: result.value })
        })
        .catch((error: unknown) => {
          if (!disposed) {
            dispatch({
              type: 'INVALID_MESSAGE',
              errors: [error instanceof Error ? error.message : 'Mensaje ilegible'],
            })
          }
        })
    }

    socket.onerror = () => {
      if (!disposed) {
        dispatch({
          type: 'SOCKET_ERROR',
          message: 'La conexión WebSocket encontró un error.',
        })
      }
    }

    socket.onclose = (event) => {
      if (!disposed) {
        dispatch({
          type: 'CLOSED',
          reason: event.reason || 'La conexión WebSocket se cerró.',
        })
      }
    }

    return () => {
      disposed = true
      window.clearTimeout(connectionTimeout)
      socket.onopen = null
      socket.onmessage = null
      socket.onerror = null
      socket.onclose = null
      socket.close(1000, 'runtime unmounted')
      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [enabled, runId, socketFactory, socketUrl])

  const submitAction = useCallback(
    (request: DecisionActionRequest, payload: JsonValue = {}): boolean => {
      const idempotencyKey = createIdempotencyKey()
      const actionAllowed = state.uiSpec?.allowedActions.some(
        (action) => action.actionId === request.actionId,
      )

      if (!state.uiSpec || !actionAllowed) {
        dispatch({
          type: 'ACTION_SEND_FAILED',
          idempotencyKey,
          decisionId: request.decisionId,
          message: 'La acción ya no está disponible en la UISpec visible.',
        })
        return false
      }

      const socket = socketRef.current
      if (!socket || socket.readyState !== SOCKET_OPEN) {
        dispatch({
          type: 'ACTION_SEND_FAILED',
          idempotencyKey,
          decisionId: request.decisionId,
          message: 'No hay una conexión WebSocket abierta.',
        })
        return false
      }

      const timestamp = new Date().toISOString()
      const actionEvent: ActionEvent = {
        schemaVersion: SCHEMA_VERSION,
        idempotencyKey,
        runId,
        workflowVersion: state.uiSpec.workflowVersion,
        stateVersion: state.uiSpec.stateVersion,
        decisionId: request.decisionId,
        actionId: request.actionId,
        payload,
        timestamp,
      }
      const envelope: ActionSubmittedEnvelope = {
        schemaVersion: SCHEMA_VERSION,
        type: 'ACTION_SUBMITTED',
        runId,
        sequence: state.lastSequence,
        timestamp,
        payload: actionEvent,
      }

      dispatch({
        type: 'ACTION_SUBMITTING',
        idempotencyKey,
        decisionId: request.decisionId,
        actionId: request.actionId,
      })

      try {
        socket.send(JSON.stringify(envelope))
        return true
      } catch {
        dispatch({
          type: 'ACTION_SEND_FAILED',
          idempotencyKey,
          decisionId: request.decisionId,
          message: 'No se pudo enviar la decisión por WebSocket.',
        })
        return false
      }
    },
    [runId, state.lastSequence, state.uiSpec],
  )

  return { ...state, socketUrl, submitAction }
}
