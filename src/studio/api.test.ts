import { describe, expect, it, vi } from 'vitest'
import { createPromptRun, type StudioRequest } from './api'

const projection = {
  schemaVersion: '1',
  runId: 'run_12345678',
  workflowId: 'wf_12345678',
  workflowVersion: 1,
  stateVersion: 0,
  lastSequence: 1,
  status: 'running',
  operation: {},
  recentEvents: [],
  availableActions: [],
}

function jsonResponse(payload: unknown): Response {
  return { ok: true, json: async () => payload } as Response
}

describe('API-only studio run', () => {
  it('sends the literal prompt as the only workflow step', async () => {
    const request = vi.fn<StudioRequest>()
      .mockResolvedValueOnce(jsonResponse(projection))
      .mockResolvedValueOnce(jsonResponse({
        workflowId: projection.workflowId,
        workflowVersionId: 'wfv_12345678',
        version: 2,
      }))
      .mockResolvedValueOnce(jsonResponse({ ...projection, workflowVersion: 2 }))

    await createPromptRun('/api', '  Haz exclusivamente dos botones  ', request)

    expect(request).toHaveBeenCalledTimes(3)
    const versionCall = request.mock.calls[1]
    const body = JSON.parse(String(versionCall[1].body)) as Record<string, unknown>
    expect(body).toEqual({
      steps: [
        {
          id: expect.stringMatching(/^request-[a-z0-9]+$/),
          type: 'studio.request',
          title: 'Solicitud de interfaz',
          objective: 'Haz exclusivamente dos botones',
          inputs: [],
          requiresHumanReview: false,
        },
      ],
    })
    expect(body).not.toHaveProperty('baseVersion')
  })
})
