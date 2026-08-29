import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import UISpecInspector from '@/inspector/UISpecInspector'
import Renderer from '@/runtime/Renderer'
import type {
  ActionSubmittedEnvelope,
  ProjectionEnvelope,
  ProjectionMessageType,
  RunEvent,
  RunId,
  RunProjection,
  UIUpdatedEnvelope,
  UISpec,
} from '@/runtime/contracts'
import { createInitialRunState, runRuntimeReducer } from '@/runtime/reducer'
import useRunSocket, {
  type RuntimeSocket,
  type SnapshotFetcher,
} from '@/runtime/useRunSocket'
import { validateUISpec } from '@/runtime/validation'

const RUN_ID = 'run_demo_skeleton' as RunId
const TIMESTAMP = '2026-08-29T18:00:00.000Z'

function uiUpdatedEnvelope(): UIUpdatedEnvelope {
  const event: RunEvent = {
    schemaVersion: '1',
    eventId: 'evt_ui_updated_1',
    runId: RUN_ID,
    workflowId: 'wf_logistics_main',
    workflowVersion: 1,
    sequence: 1,
    stateVersion: 1,
    type: 'UI_UPDATED',
    stepId: 'step_review_route',
    payload: {},
    timestamp: TIMESTAMP,
  }
  const availableAction = {
    actionId: 'act_approve_route' as const,
    label: 'Aprobar ruta',
    description: 'Continúa el run con la ruta visible.',
    risk: 'low' as const,
    requiresHuman: true,
    payloadSchema: { type: 'object', additionalProperties: false },
  }
  const projection: RunProjection = {
    schemaVersion: '1',
    runId: RUN_ID,
    workflowId: 'wf_logistics_main',
    workflowVersion: 1,
    stateVersion: 1,
    lastSequence: 1,
    status: 'paused',
    currentStep: {
      id: 'step_review_route',
      type: 'human-review',
      title: 'Revisar ruta',
      objective: 'Confirmar la ruta propuesta.',
      status: 'attention',
      metadata: {},
    },
    operation: {},
    recentEvents: [event],
    pendingDecision: {
      decisionId: 'dec_route_review',
      stepId: 'step_review_route',
      title: 'Confirmar ruta',
      prompt: '¿Aprobamos la ruta propuesta?',
      context: {},
      requestedAt: TIMESTAMP,
    },
    availableActions: [availableAction],
  }
  const uiSpec: UISpec = {
    schemaVersion: '1',
    runId: RUN_ID,
    workflowId: 'wf_logistics_main',
    workflowVersion: 1,
    stateVersion: 1,
    generatedBy: 'deterministic',
    reason: 'Walking skeleton de Phase 1.',
    layout: {
      id: 'ui_run_page',
      type: 'page',
      props: {
        title: 'Operación en vivo',
        subtitle: 'UISpec recibida por WebSocket',
        eyebrow: 'Run activo',
      },
      children: [
        {
          id: 'ui_summary_section',
          type: 'section',
          props: {
            title: 'Resumen',
            description: 'Datos falsos para cerrar el loop.',
            columns: 2,
            emphasis: 'normal',
          },
          children: [
            {
              id: 'ui_eta_metric',
              type: 'metric',
              props: {
                label: 'ETA estimada',
                value: '9 días',
                supportingText: 'Dato del skeleton',
                trend: 'flat',
                emphasis: 'warning',
              },
            },
            {
              id: 'ui_route_decision',
              type: 'decisionPanel',
              props: {
                decisionId: 'dec_route_review',
                title: 'Confirmar ruta',
                message: 'La acción viaja al backend por WebSocket.',
                actions: [
                  {
                    actionId: 'act_approve_route',
                    label: 'Aprobar ruta',
                    style: 'primary',
                    requiresConfirmation: false,
                  },
                ],
                status: 'idle',
                errorMessage: null,
                emphasis: 'warning',
              },
            },
          ],
        },
      ],
    },
    allowedActions: [availableAction],
  }

  return {
    schemaVersion: '1',
    type: 'UI_UPDATED',
    runId: RUN_ID,
    sequence: 1,
    timestamp: TIMESTAMP,
    payload: { event, projection, uiSpec },
  }
}

class FakeSocket implements RuntimeSocket {
  readyState = 0
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  sent: string[] = []

  open() {
    this.readyState = 1
    this.onopen?.(new Event('open'))
  }

  receive(message: unknown) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }))
  }

  send(data: string) {
    this.sent.push(data)
  }

  close() {
    this.readyState = 3
  }

  closeFromServer(reason = 'connection lost') {
    this.readyState = 3
    this.onclose?.(new CloseEvent('close', { reason }))
  }
}

interface RuntimeHarnessProps {
  socketFactory: (url: string) => RuntimeSocket
  snapshotFetcher?: SnapshotFetcher
  pollingEnabled?: boolean
  reconnectDelayMs?: number
}

const snapshotFixtureFetcher: SnapshotFetcher = async () => uiUpdatedEnvelope()

function RuntimeHarness({
  socketFactory,
  snapshotFetcher = snapshotFixtureFetcher,
  pollingEnabled = false,
  reconnectDelayMs = 1_000,
}: RuntimeHarnessProps) {
  const runtime = useRunSocket({
    runId: RUN_ID,
    apiUrl: 'http://127.0.0.1:8000',
    token: 'demo-token',
    socketFactory,
    snapshotFetcher,
    pollingEnabled,
    reconnectDelayMs,
  })

  return (
    <div>
      <span data-testid="connection-status">{runtime.connectionStatus}</span>
      <span data-testid="invalid-message-count">{runtime.invalidMessageCount}</span>
      <span data-testid="runtime-transport">{runtime.transport}</span>
      {runtime.uiSpec ? (
        <Renderer
          uiSpec={runtime.uiSpec}
          onAction={runtime.submitAction}
          decisionFeedback={runtime.decisionFeedback}
        />
      ) : null}
    </div>
  )
}

describe('runtime renderer', () => {
  it('renders the recursive Phase 1 tree and forwards an allowed decision', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    const uiSpec = uiUpdatedEnvelope().payload.uiSpec

    render(<Renderer uiSpec={uiSpec} onAction={onAction} />)

    expect(screen.getByRole('heading', { name: 'Operación en vivo' })).toBeInTheDocument()
    expect(screen.getByText('9 días')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Aprobar ruta' }))
    expect(onAction).toHaveBeenCalledWith({
      decisionId: 'dec_route_review',
      actionId: 'act_approve_route',
    })
  })

  it('renders the Phase 2 alert, timeline, and key-value primitives', () => {
    const uiSpec = uiUpdatedEnvelope().payload.uiSpec
    const section = uiSpec.layout.children[0]
    if (section.type !== 'section') {
      throw new Error('fixture must contain a section')
    }
    section.children.unshift(
      {
        id: 'ui_runtime_alert',
        type: 'alert',
        props: {
          title: 'Atención requerida',
          message: 'El estado contiene un hallazgo.',
          emphasis: 'warning',
        },
      },
      {
        id: 'ui_runtime_timeline',
        type: 'timeline',
        props: {
          title: 'Actividad',
          items: [
            {
              id: 'step_review_route',
              title: 'Revisar ruta',
              status: 'attention',
              detail: 'Decisión pendiente',
              timestamp: TIMESTAMP,
            },
          ],
        },
      },
      {
        id: 'ui_runtime_values',
        type: 'keyValue',
        props: {
          title: 'Datos actuales',
          columns: 2,
          items: [
            {
              key: 'delay_days',
              label: 'Días de retraso',
              value: 9,
              emphasis: 'warning',
            },
          ],
        },
      },
    )

    render(<Renderer uiSpec={uiSpec} />)

    expect(screen.getByText('Atención requerida')).toBeInTheDocument()
    expect(screen.getByText('Decisión pendiente')).toBeInTheDocument()
    expect(screen.getByText('Días de retraso')).toBeInTheDocument()
  })

  it('renders the ninth registry component as a generic comparison', () => {
    const uiSpec = uiUpdatedEnvelope().payload.uiSpec
    const section = uiSpec.layout.children[0]
    if (section.type !== 'section') {
      throw new Error('fixture must contain a section')
    }
    section.children.push({
      id: 'ui_runtime_compare',
      type: 'compare',
      props: {
        title: 'Cambio de escenario',
        leftLabel: 'Antes',
        rightLabel: 'Después',
        rows: [
          {
            key: 'days',
            label: 'Días recuperados',
            before: 0,
            after: 6,
            outcome: 'improved',
          },
        ],
      },
    })

    render(<Renderer uiSpec={uiSpec} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Días recuperados')).toBeInTheDocument()
    expect(screen.getByText('Mejoró')).toBeInTheDocument()
  })

  it('shows generatedBy, reason, stateVersion, and live JSON in the inspector', async () => {
    const user = userEvent.setup()
    const uiSpec = uiUpdatedEnvelope().payload.uiSpec
    render(<UISpecInspector uiSpec={uiSpec} />)

    await user.click(screen.getByRole('button', { name: 'Inspeccionar UISpec' }))

    expect(screen.getByRole('dialog', { name: 'UISpec validada' })).toBeInTheDocument()
    expect(screen.getByText('Determinista')).toBeInTheDocument()
    expect(screen.getByText(uiSpec.reason)).toBeInTheDocument()
    expect(screen.getByTestId('ui-spec-json')).toHaveTextContent('"stateVersion": 1')
  })

  it('isolates unknown and broken nodes without losing valid siblings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const uiSpec = uiUpdatedEnvelope().payload.uiSpec
    const section = uiSpec.layout.children[0]
    if (section.type !== 'section') {
      throw new Error('fixture must contain a section')
    }
    section.children.push(
      {
        id: 'ui_unknown_card',
        type: 'futureWidget',
        props: {},
      } as never,
      {
        id: 'ui_broken_metric',
        type: 'metric',
        props: { value: 'sin etiqueta', emphasis: 'normal' },
      } as never,
    )

    render(<Renderer uiSpec={uiSpec} />)

    expect(screen.getByText('9 días')).toBeInTheDocument()
    expect(screen.getByText('Componente futureWidget')).toBeInTheDocument()
    expect(screen.getByText('Componente metric')).toBeInTheDocument()
    consoleError.mockRestore()
    consoleWarn.mockRestore()
  })

  it('rejects Pydantic schema and invariant violations before rendering', () => {
    const uiSpec = uiUpdatedEnvelope().payload.uiSpec
    uiSpec.layout.children.push({ ...uiSpec.layout.children[0] })

    const result = validateUISpec(uiSpec)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.join(' ')).toMatch(/duplicate node id/i)
    }
  })
})

describe('run reducer', () => {
  it('handles every projection-bearing P0 server message', () => {
    const messageTypes: ProjectionMessageType[] = [
      'RUN_STARTED',
      'STEP_STARTED',
      'STEP_COMPLETED',
      'STATE_UPDATED',
      'DECISION_REQUIRED',
      'RUN_PAUSED',
      'RUN_RESUMED',
      'RUN_COMPLETED',
    ]
    let state = createInitialRunState(RUN_ID)

    messageTypes.forEach((type, index) => {
      const fixture = uiUpdatedEnvelope()
      const sequence = index + 1
      const event = {
        ...fixture.payload.event,
        eventId: `evt_projection_${sequence}` as const,
        sequence,
        stateVersion: sequence,
        type,
      }
      const projection = {
        ...fixture.payload.projection,
        stateVersion: sequence,
        lastSequence: sequence,
        recentEvents: [event],
      }
      const envelope: ProjectionEnvelope = {
        schemaVersion: '1',
        type,
        runId: RUN_ID,
        sequence,
        timestamp: TIMESTAMP,
        payload: { event, projection },
      }

      state = runRuntimeReducer(state, { type: 'SERVER_MESSAGE', envelope })
      expect(state.projection?.stateVersion).toBe(sequence)
      expect(state.lastSequence).toBe(sequence)
    })
  })
})

describe('run WebSocket loop', () => {
  it('receives UISpec, sends ActionEvent, and displays ACTION_ACCEPTED', async () => {
    const user = userEvent.setup()
    const socket = new FakeSocket()
    const socketFactory = vi.fn(() => socket)

    render(<RuntimeHarness socketFactory={socketFactory} />)
    act(() => socket.open())
    expect(screen.getByTestId('connection-status')).toHaveTextContent('open')

    act(() => socket.receive(uiUpdatedEnvelope()))
    expect(await screen.findByText('9 días')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Aprobar ruta' }))
    await waitFor(() => expect(socket.sent).toHaveLength(1))

    const submitted = JSON.parse(socket.sent[0]) as ActionSubmittedEnvelope
    expect(submitted.type).toBe('ACTION_SUBMITTED')
    expect(Object.hasOwn(submitted.payload, 'eventId')).toBe(false)
    expect(submitted.payload.stateVersion).toBe(1)
    expect(submitted.sequence).toBe(1)
    expect(screen.getByText('Enviando decisión…')).toBeInTheDocument()

    const acceptedEvent: RunEvent = {
      ...uiUpdatedEnvelope().payload.event,
      eventId: 'evt_action_accepted_2',
      sequence: 2,
      stateVersion: 2,
      type: 'ACTION_ACCEPTED',
    }
    const acceptedProjection: RunProjection = {
      ...uiUpdatedEnvelope().payload.projection,
      stateVersion: 2,
      lastSequence: 2,
      status: 'running',
      recentEvents: [acceptedEvent],
      pendingDecision: null,
      availableActions: [],
    }
    act(() =>
      socket.receive({
        schemaVersion: '1',
        type: 'ACTION_ACCEPTED',
        runId: RUN_ID,
        sequence: 2,
        timestamp: TIMESTAMP,
        payload: {
          event: acceptedEvent,
          projection: acceptedProjection,
          idempotencyKey: submitted.payload.idempotencyKey,
          decisionId: submitted.payload.decisionId,
          actionId: submitted.payload.actionId,
        },
      }),
    )

    expect(await screen.findByText('Decisión aceptada')).toBeInTheDocument()
  })

  it('rejects malformed socket messages without replacing the current UI', async () => {
    const socket = new FakeSocket()
    render(<RuntimeHarness socketFactory={() => socket} />)
    act(() => socket.open())
    act(() => socket.receive(uiUpdatedEnvelope()))
    expect(await screen.findByText('9 días')).toBeInTheDocument()

    act(() => socket.receive({ type: 'UI_UPDATED', payload: {} }))

    await waitFor(() => expect(screen.getByTestId('invalid-message-count')).toHaveTextContent('1'))
    expect(screen.getByText('9 días')).toBeInTheDocument()
  })

  it('reconnects and refetches the latest persisted snapshot', async () => {
    const sockets = [new FakeSocket(), new FakeSocket()]
    const socketFactory = vi.fn(() => sockets[socketFactory.mock.calls.length - 1])
    const snapshotFetcher = vi.fn(async () => uiUpdatedEnvelope())

    render(
      <RuntimeHarness
        socketFactory={socketFactory}
        snapshotFetcher={snapshotFetcher}
        reconnectDelayMs={1}
      />,
    )
    act(() => sockets[0].open())
    await waitFor(() => expect(snapshotFetcher).toHaveBeenCalledTimes(1))

    act(() => sockets[0].closeFromServer())
    await waitFor(() => expect(socketFactory).toHaveBeenCalledTimes(2))
    act(() => sockets[1].open())

    await waitFor(() => expect(snapshotFetcher).toHaveBeenCalledTimes(2))
    expect(screen.getByTestId('runtime-transport')).toHaveTextContent('websocket')
    expect(screen.getByText('9 días')).toBeInTheDocument()
  })

  it('activates polling by flag when WebSocket creation fails', async () => {
    const snapshotFetcher = vi.fn(async () => uiUpdatedEnvelope())
    const socketFactory = vi.fn(() => {
      throw new Error('socket unavailable')
    })

    render(
      <RuntimeHarness
        socketFactory={socketFactory}
        snapshotFetcher={snapshotFetcher}
        pollingEnabled
        reconnectDelayMs={10_000}
      />,
    )

    await waitFor(() => expect(screen.getByTestId('runtime-transport')).toHaveTextContent('polling'))
    expect(await screen.findByText('9 días')).toBeInTheDocument()
  })
})
