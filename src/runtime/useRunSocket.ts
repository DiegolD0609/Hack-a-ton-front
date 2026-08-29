import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
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

export type RuntimeTransport = 'offline' | 'websocket' | 'polling'
export type SnapshotFetcher = (url: string) => Promise<unknown>

export interface UseRunSocketOptions {
  runId: RunId
  apiUrl: string
  token: string
  enabled?: boolean
  pollingEnabled?: boolean
  pollingIntervalMs?: number
  reconnectDelayMs?: number
  socketFactory?: (url: string) => RuntimeSocket
  snapshotFetcher?: SnapshotFetcher
}

export interface UseRunSocketResult extends RunRuntimeState {
  socketUrl: string
  transport: RuntimeTransport
  submitAction: (request: DecisionActionRequest, payload?: JsonValue) => boolean
}

function defaultSocketFactory(url: string): RuntimeSocket {
  return new WebSocket(url)
}

async function defaultSnapshotFetcher(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`El snapshot respondió ${response.status}.`)
  }
  return response.json() as Promise<unknown>
}

function createIdempotencyKey(): IdempotencyKey {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${fallbackId++}`
  return `idem_${randomPart.toLowerCase()}` as IdempotencyKey
}

function apiEndpoint(apiUrl: string, path: string): string {
  const url = new URL(apiUrl, window.location.origin)
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path}`
  url.search = ''
  return url.toString()
}

export function buildRunSocketUrl(apiUrl: string, runId: RunId, token: string): string {
  const base = new URL(apiUrl, window.location.origin)
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:'
  base.pathname = `${base.pathname.replace(/\/$/, '')}/ws/runs/${encodeURIComponent(runId)}`
  base.search = ''
  base.searchParams.set('token', token)
  return base.toString()
}

export function buildRunSnapshotUrl(apiUrl: string, runId: RunId): string {
  return apiEndpoint(apiUrl, `/runs/${encodeURIComponent(runId)}/snapshot`)
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
  pollingEnabled = false,
  pollingIntervalMs = 2_000,
  reconnectDelayMs = 1_000,
  socketFactory = defaultSocketFactory,
  snapshotFetcher = defaultSnapshotFetcher,
}: UseRunSocketOptions): UseRunSocketResult {
  const [state, dispatch] = useReducer(runRuntimeReducer, runId, createInitialRunState)
  const [transport, setTransport] = useState<RuntimeTransport>('offline')
  const socketRef = useRef<RuntimeSocket | null>(null)
  const socketUrl = buildRunSocketUrl(apiUrl, runId, token)
  const snapshotUrl = buildRunSnapshotUrl(apiUrl, runId)

  useEffect(() => {
    dispatch({ type: 'RESET', runId })
    setTransport('offline')
    if (!enabled) {
      return
    }

    let disposed = false
    let socket: RuntimeSocket | null = null
    let reconnectTimer: number | null = null
    let pollingTimer: number | null = null
    let connectionTimeout: number | null = null
    let reconnectAttempt = 0
    let snapshotInFlight = false

    const clearConnectionTimeout = () => {
      if (connectionTimeout !== null) {
        window.clearTimeout(connectionTimeout)
        connectionTimeout = null
      }
    }

    const applySnapshot = async () => {
      if (disposed || snapshotInFlight) {
        return
      }
      snapshotInFlight = true
      try {
        const input = await snapshotFetcher(snapshotUrl)
        if (disposed) {
          return
        }
        const result = validateServerEnvelope(input)
        if (!result.ok) {
          dispatch({ type: 'INVALID_MESSAGE', errors: result.errors })
          return
        }
        if (result.value.runId !== runId) {
          dispatch({ type: 'INVALID_MESSAGE', errors: ['runId no coincide con el snapshot'] })
          return
        }
        dispatch({ type: 'SERVER_MESSAGE', envelope: result.value })
      } catch {
        // The next polling tick or WebSocket replay can recover a snapshot.
      } finally {
        snapshotInFlight = false
      }
    }

    const stopPolling = () => {
      if (pollingTimer !== null) {
        window.clearInterval(pollingTimer)
        pollingTimer = null
      }
    }

    const startPolling = () => {
      if (!pollingEnabled || disposed || pollingTimer !== null) {
        return
      }
      setTransport('polling')
      void applySnapshot()
      pollingTimer = window.setInterval(() => void applySnapshot(), pollingIntervalMs)
    }

    const connect = () => {
      if (disposed) {
        return
      }
      dispatch({ type: 'CONNECTING' })
      try {
        socket = socketFactory(socketUrl)
        socketRef.current = socket
      } catch {
        dispatch({ type: 'SOCKET_ERROR', message: 'No fue posible crear la conexión WebSocket.' })
        startPolling()
        reconnectAttempt += 1
        reconnectTimer = window.setTimeout(
          connect,
          Math.min(reconnectDelayMs * reconnectAttempt, 10_000),
        )
        return
      }

      const activeSocket = socket
      connectionTimeout = window.setTimeout(() => {
        if (!disposed && activeSocket.readyState !== SOCKET_OPEN) {
          dispatch({
            type: 'SOCKET_ERROR',
            message: 'El backend no abrió el WebSocket en 5 segundos.',
          })
          startPolling()
          activeSocket.close(4000, 'connection timeout')
        }
      }, 5_000)

      activeSocket.onopen = () => {
        if (disposed) {
          return
        }
        clearConnectionTimeout()
        reconnectAttempt = 0
        stopPolling()
        setTransport('websocket')
        dispatch({ type: 'CONNECTED' })
        void applySnapshot()
      }

      activeSocket.onmessage = (event) => {
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

      activeSocket.onerror = () => {
        if (!disposed) {
          dispatch({ type: 'SOCKET_ERROR', message: 'La conexión WebSocket encontró un error.' })
          startPolling()
        }
      }

      activeSocket.onclose = (event) => {
        if (disposed) {
          return
        }
        clearConnectionTimeout()
        dispatch({ type: 'CLOSED', reason: event.reason || 'La conexión WebSocket se cerró.' })
        startPolling()
        reconnectAttempt += 1
        reconnectTimer = window.setTimeout(
          connect,
          Math.min(reconnectDelayMs * reconnectAttempt, 10_000),
        )
      }
    }

    connect()

    return () => {
      disposed = true
      clearConnectionTimeout()
      stopPolling()
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer)
      }
      if (socket) {
        socket.onopen = null
        socket.onmessage = null
        socket.onerror = null
        socket.onclose = null
        socket.close(1000, 'runtime unmounted')
      }
      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [
    enabled,
    pollingEnabled,
    pollingIntervalMs,
    reconnectDelayMs,
    runId,
    snapshotFetcher,
    snapshotUrl,
    socketFactory,
    socketUrl,
  ])

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

      const activeSocket = socketRef.current
      if (!activeSocket || activeSocket.readyState !== SOCKET_OPEN) {
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
        activeSocket.send(JSON.stringify(envelope))
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

  return { ...state, socketUrl, transport, submitAction }
}
