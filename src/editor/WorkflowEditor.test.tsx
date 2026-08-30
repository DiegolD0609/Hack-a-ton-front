import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkflowEditor from './WorkflowEditor'

const workflowId = 'wf_550e8400-e29b-41d4-a716-446655440001'
const baseRunId = 'run_550e8400-e29b-41d4-a716-446655440000'
const versionRunId = 'run_550e8400-e29b-41d4-a716-446655440009'
const workflowVersionId = 'wfv_550e8400-e29b-41d4-a716-446655440002'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function projection(runId = baseRunId, workflowVersion = 1) {
  return {
    schemaVersion: '1',
    runId,
    workflowId,
    workflowVersion,
    stateVersion: 0,
    lastSequence: 2,
    status: 'running',
    currentStep: null,
    operation: {},
    recentEvents: [],
    pendingDecision: null,
    availableActions: [],
  }
}

describe('WorkflowEditor', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/editor')
    vi.restoreAllMocks()
  })

  it('generates a valid StepDefinition object from the form', async () => {
    const user = userEvent.setup()
    render(<WorkflowEditor />)

    await user.type(screen.getByLabelText('Title'), 'Validar condición crítica')
    await user.type(
      screen.getByLabelText('Objective'),
      'Comparar los valores declarados sin inventar información.',
    )
    await user.type(screen.getByLabelText('Input picker'), 'source.data.score')
    await user.click(screen.getByRole('button', { name: 'Agregar input' }))
    await user.click(screen.getByLabelText('Requires human review'))

    const preview = screen.getByLabelText('Vista previa JSON del paso')
    expect(preview).toHaveTextContent('step_validar_condicion_critica')
    expect(preview).toHaveTextContent('generic.runtime')
    expect(preview).toHaveTextContent('source.data.score')
    expect(preview).toHaveTextContent('"requiresHumanReview": true')
  })

  it('creates v(n+1) with the exact backend payload and runs that version', async () => {
    const user = userEvent.setup()
    const onRunCreated = vi.fn()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(projection(), 201))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            workflowId,
            workflowVersionId,
            version: 2,
            steps: [
              {
                id: 'base_step',
                type: 'generic.base',
                title: 'Base step',
                objective: 'Produce prior state.',
                inputs: [],
                requiresHumanReview: false,
              },
              {
                id: 'step_verify_inputs',
                type: 'generic.runtime',
                title: 'Verify inputs',
                objective: 'Inspect declared state paths.',
                inputs: ['source.data.score'],
                requiresHumanReview: false,
              },
            ],
          },
          201,
        ),
      )
      .mockResolvedValueOnce(jsonResponse(projection(versionRunId, 2), 201))

    render(<WorkflowEditor onRunCreated={onRunCreated} />)
    await user.type(screen.getByLabelText('Title'), 'Verify inputs')
    await user.type(screen.getByLabelText('Objective'), 'Inspect declared state paths.')
    await user.type(screen.getByLabelText('Input picker'), 'source.data.score')
    await user.click(screen.getByRole('button', { name: 'Agregar input' }))
    await user.click(screen.getByRole('button', { name: 'Crear v(n+1)' }))

    const runButton = await screen.findByRole('button', { name: 'Run with v2' })
    expect(screen.getByText('1 base + 1 nuevo = 2')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const versionCall = fetchMock.mock.calls[1]
    expect(versionCall[0]).toBe(
      `http://127.0.0.1:8000/workflows/${workflowId}/versions`,
    )
    expect(JSON.parse(String(versionCall[1]?.body))).toEqual({
      baseVersion: 1,
      steps: [
        {
          id: 'step_verify_inputs',
          type: 'generic.runtime',
          title: 'Verify inputs',
          objective: 'Inspect declared state paths.',
          inputs: ['source.data.score'],
          requiresHumanReview: false,
        },
      ],
    })

    await user.click(runButton)
    await waitFor(() => expect(onRunCreated).toHaveBeenCalledWith(versionRunId))
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).toEqual({ workflowVersionId })
  })
})
