import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RunProjection } from '@/runtime/contracts'
import AssistantPanel from './AssistantPanel'

const projection: RunProjection = {
  schemaVersion: '1',
  runId: 'run_assistant_demo',
  workflowId: 'wf_runtime_demo',
  workflowVersion: 1,
  stateVersion: 7,
  lastSequence: 12,
  status: 'paused',
  currentStep: null,
  operation: {},
  operationId: 'op_demo',
  recentEvents: [],
  pendingDecision: {
    decisionId: 'dec_delay_choice',
    stepId: 'step_review_delay',
    title: 'Resolver incidencia',
    prompt: 'Elige una acción',
    context: {},
    requestedAt: '2026-08-29T18:00:00.000Z',
  },
  availableActions: [
    {
      actionId: 'act_notify_client',
      label: 'Notificar al cliente',
      description: null,
      risk: 'low',
      requiresHuman: true,
      payloadSchema: {},
    },
  ],
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('AssistantPanel', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('only exposes recommended actions that the current projection allows', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn(() => true)
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        schemaVersion: '1',
        runId: projection.runId,
        reply: 'La acción de menor riesgo es notificar.',
        recommendedActions: [
          { actionId: 'act_notify_client', rationale: 'Mantiene informado al cliente.' },
          { actionId: 'act_untrusted_action', rationale: 'No está permitida.' },
        ],
        proposedStep: null,
      }),
    )

    render(
      <AssistantPanel
        apiUrl="http://127.0.0.1:8000"
        runId={projection.runId}
        projection={projection}
        editorUrl="/editor"
        onAction={onAction}
        onRunCreated={vi.fn()}
      />,
    )
    await user.type(screen.getByLabelText('Mensaje para Ari'), '¿Qué recomiendas?')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByText('La acción de menor riesgo es notificar.')).toBeInTheDocument()
    expect(screen.queryByText('act_untrusted_action')).not.toBeInTheDocument()
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(request.schemaVersion).toBe('1')
    expect(request.message).toBe('¿Qué recomiendas?')

    await user.click(screen.getByRole('button', { name: 'Notificar al cliente' }))
    expect(onAction).toHaveBeenCalledWith({
      decisionId: 'dec_delay_choice',
      actionId: 'act_notify_client',
    })
    expect(screen.getByText(/enviada al policy engine/i)).toBeInTheDocument()
  })

  it('creates a workflow version and starts its run from proposedStep', async () => {
    const user = userEvent.setup()
    const onRunCreated = vi.fn()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          schemaVersion: '1',
          runId: projection.runId,
          reply: 'Propongo una validación genérica.',
          recommendedActions: [],
          proposedStep: {
            id: 'step_validate_runtime_input',
            type: 'generic.runtime',
            title: 'Validar entrada declarada',
            objective: 'Comparar los inputs disponibles.',
            inputs: ['source.data.value'],
            requiresHumanReview: true,
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          workflowId: projection.workflowId,
          workflowVersionId: 'wfv_runtime_demo_2',
          version: 2,
          steps: [
            {
              id: 'step_validate_runtime_input',
              type: 'generic.runtime',
              title: 'Validar entrada declarada',
              objective: 'Comparar los inputs disponibles.',
              inputs: ['source.data.value'],
              requiresHumanReview: true,
            },
          ],
        }, 201),
      )
      .mockResolvedValueOnce(
        jsonResponse({ ...projection, runId: 'run_assistant_trial', workflowVersion: 2 }, 201),
      )

    render(
      <AssistantPanel
        apiUrl="http://127.0.0.1:8000"
        runId={projection.runId}
        projection={projection}
        editorUrl="/editor"
        onAction={vi.fn(() => true)}
        onRunCreated={onRunCreated}
      />,
    )
    await user.type(screen.getByLabelText('Mensaje para Ari'), 'Agrega una validación')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    await user.click(await screen.findByRole('button', { name: 'Crear v(n+1) y correr' }))

    await waitFor(() => expect(onRunCreated).toHaveBeenCalledWith('run_assistant_trial'))
  })

  it('rejects an assistant response that belongs to a different run', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        schemaVersion: '1',
        runId: 'run_other_context',
        reply: 'Respuesta fuera de contexto.',
        recommendedActions: [],
        proposedStep: null,
      }),
    )

    render(
      <AssistantPanel
        apiUrl="http://127.0.0.1:8000"
        runId={projection.runId}
        projection={projection}
        editorUrl="/editor"
        onAction={vi.fn(() => true)}
        onRunCreated={vi.fn()}
      />,
    )
    await user.type(screen.getByLabelText('Mensaje para Ari'), 'Resume este run')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La respuesta de Ari no cumple AssistResponse.',
    )
    expect(screen.queryByText('Respuesta fuera de contexto.')).not.toBeInTheDocument()
  })
})
