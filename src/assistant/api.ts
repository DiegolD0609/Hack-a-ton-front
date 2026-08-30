import {
  ID_PATTERNS,
  SCHEMA_VERSION,
  type AssistRequest,
  type AssistResponse,
  type RunId,
} from '@/runtime/contracts'
import type { WorkflowStepDefinition } from '@/editor/types'

function apiEndpoint(apiUrl: string, path: string): string {
  const url = new URL(apiUrl, window.location.origin)
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path}`
  url.search = ''
  return url.toString()
}

function isProposedStep(value: unknown): value is WorkflowStepDefinition {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const step = value as Partial<WorkflowStepDefinition>
  return Boolean(
    typeof step.id === 'string' &&
      ID_PATTERNS.step.test(step.id) &&
      typeof step.type === 'string' &&
      typeof step.title === 'string' &&
      typeof step.objective === 'string' &&
      Array.isArray(step.inputs) &&
      step.inputs.every((input) => typeof input === 'string') &&
      typeof step.requiresHumanReview === 'boolean',
  )
}

function assertAssistResponse(value: unknown, runId: RunId): AssistResponse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Ari devolvió una respuesta ilegible.')
  }
  const response = value as Partial<AssistResponse>
  if (
    response.schemaVersion !== SCHEMA_VERSION ||
    response.runId !== runId ||
    typeof response.reply !== 'string' ||
    !response.reply.trim() ||
    !Array.isArray(response.recommendedActions) ||
    !response.recommendedActions.every(
      (action) =>
        typeof action === 'object' &&
        action !== null &&
        ID_PATTERNS.action.test(action.actionId) &&
        typeof action.rationale === 'string',
    )
  ) {
    throw new Error('La respuesta de Ari no cumple AssistResponse.')
  }
  if (response.proposedStep != null && !isProposedStep(response.proposedStep)) {
    throw new Error('El paso propuesto por Ari no cumple StepDefinition.')
  }
  return response as AssistResponse
}

export async function requestAssistance(
  apiUrl: string,
  runId: RunId,
  request: Omit<AssistRequest, 'schemaVersion'>,
): Promise<AssistResponse> {
  const response = await fetch(apiEndpoint(apiUrl, `/runs/${encodeURIComponent(runId)}/assist`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schemaVersion: SCHEMA_VERSION, ...request }),
  })
  if (!response.ok) {
    if (response.status === 404 || response.status === 503) {
      throw new Error('Ari no está habilitado en este entorno. El runtime determinista sigue disponible.')
    }
    throw new Error(`El asistente respondió ${response.status}.`)
  }
  return assertAssistResponse(await response.json(), runId)
}
