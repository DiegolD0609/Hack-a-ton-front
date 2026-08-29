import type { RunProjection } from '@/runtime/contracts'

export interface WorkflowStepForm {
  title: string
  objective: string
  inputs: string[]
  requiresHumanReview: boolean
}

export interface WorkflowStepDefinition extends WorkflowStepForm {
  id: string
  type: 'generic.runtime'
}

export interface WorkflowVersionResponse {
  workflowId: string
  workflowVersionId: string
  version: number
  steps: WorkflowStepDefinition[]
}

export interface WorkflowBaseline {
  workflowId: RunProjection['workflowId']
  version: number
  sourceRunId: RunProjection['runId']
}

export const EMPTY_STEP_FORM: WorkflowStepForm = {
  title: '',
  objective: '',
  inputs: [],
  requiresHumanReview: false,
}

export function stepIdFromTitle(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 58)

  return `step_${slug || 'runtime_check'}`
}

export function buildStepDefinition(form: WorkflowStepForm): WorkflowStepDefinition {
  return {
    id: stepIdFromTitle(form.title),
    type: 'generic.runtime',
    title: form.title.trim(),
    objective: form.objective.trim(),
    inputs: form.inputs,
    requiresHumanReview: form.requiresHumanReview,
  }
}
