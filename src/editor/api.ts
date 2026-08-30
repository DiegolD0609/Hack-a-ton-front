import { ID_PATTERNS, type RunProjection } from '@/runtime/contracts'
import type { WorkflowStepDefinition, WorkflowVersionResponse } from './types'

function apiEndpoint(apiUrl: string, path: string): string {
  const url = new URL(apiUrl, window.location.origin)
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path}`
  url.search = ''
  return url.toString()
}

async function apiError(response: Response): Promise<Error> {
  try {
    const body = (await response.json()) as { detail?: unknown }
    if (typeof body.detail === 'string') {
      return new Error(body.detail)
    }
  } catch {
    // The status below remains useful when a proxy returns a non-JSON body.
  }
  return new Error(`El backend respondió ${response.status}.`)
}

async function requestJson<T>(apiUrl: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiEndpoint(apiUrl, path), init)
  if (!response.ok) {
    throw await apiError(response)
  }
  return (await response.json()) as T
}

function assertProjection(value: RunProjection): RunProjection {
  if (
    !ID_PATTERNS.run.test(value.runId) ||
    !ID_PATTERNS.workflow.test(value.workflowId) ||
    !Number.isInteger(value.workflowVersion)
  ) {
    throw new Error('El backend devolvió una proyección de workflow inválida.')
  }
  return value
}

export async function loadRunProjection(apiUrl: string, runId: string): Promise<RunProjection> {
  const projection = await requestJson<RunProjection>(
    apiUrl,
    `/runs/${encodeURIComponent(runId)}/projection`,
  )
  return assertProjection(projection)
}

export async function createRun(
  apiUrl: string,
  workflowVersionId?: string,
): Promise<RunProjection> {
  const projection = await requestJson<RunProjection>(apiUrl, '/runs', {
    method: 'POST',
    headers: workflowVersionId ? { 'Content-Type': 'application/json' } : undefined,
    body: workflowVersionId ? JSON.stringify({ workflowVersionId }) : undefined,
  })
  return assertProjection(projection)
}

export async function createWorkflowVersion(
  apiUrl: string,
  workflowId: string,
  baseVersion: number,
  steps: WorkflowStepDefinition[],
): Promise<WorkflowVersionResponse> {
  const version = await requestJson<WorkflowVersionResponse>(
    apiUrl,
    `/workflows/${encodeURIComponent(workflowId)}/versions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseVersion, steps }),
    },
  )

  if (
    version.workflowId !== workflowId ||
    !version.workflowVersionId.startsWith('wfv_') ||
    !Number.isInteger(version.version) ||
    !Array.isArray(version.steps)
  ) {
    throw new Error('El backend devolvió una versión de workflow inválida.')
  }
  return version
}
