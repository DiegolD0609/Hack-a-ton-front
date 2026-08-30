import { ID_PATTERNS, type RunProjection } from '@/runtime/contracts'

interface WorkflowVersionResponse {
  workflowId: string
  workflowVersionId: string
  version: number
}

export type StudioRequest = (url: string, init: RequestInit) => Promise<Response>

function apiEndpoint(apiUrl: string, path: string): string {
  const url = new URL(apiUrl, window.location.origin)
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path}`
  url.search = ''
  return url.toString()
}

async function postJSON<T>(
  request: StudioRequest,
  apiUrl: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const response = await request(apiEndpoint(apiUrl, path), {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: unknown } | null
    const detail = typeof payload?.detail === 'string'
      ? payload.detail
      : `El backend respondió ${response.status}.`
    throw new Error(detail)
  }
  return response.json() as Promise<T>
}

export async function createPromptRun(
  apiUrl: string,
  prompt: string,
  request: StudioRequest = fetch,
): Promise<RunProjection> {
  const exactPrompt = prompt.trim()
  if (!exactPrompt) throw new Error('El prompt no puede estar vacío.')

  // The current API has no workflow-creation route. A seed run is therefore
  // used only to resolve the backend-owned workflow id; none of its steps are
  // copied into the visible run.
  const seed = await postJSON<RunProjection>(request, apiUrl, '/runs')
  const stepId = `request-${Date.now().toString(36)}`
  const version = await postJSON<WorkflowVersionResponse>(
    request,
    apiUrl,
    `/workflows/${encodeURIComponent(seed.workflowId)}/versions`,
    {
      steps: [
        {
          id: stepId,
          type: 'studio.request',
          title: 'Solicitud de interfaz',
          objective: exactPrompt,
          inputs: [],
          requiresHumanReview: false,
        },
      ],
    },
  )
  const created = await postJSON<RunProjection>(request, apiUrl, '/runs', {
    workflowVersionId: version.workflowVersionId,
  })
  if (!created.runId || !ID_PATTERNS.run.test(created.runId)) {
    throw new Error('El backend no devolvió un runId válido.')
  }
  return created
}

export async function advancePromptRun(
  apiUrl: string,
  runId: string,
  request: StudioRequest = fetch,
): Promise<RunProjection> {
  return postJSON<RunProjection>(request, apiUrl, '/demo/advance', { runId })
}
