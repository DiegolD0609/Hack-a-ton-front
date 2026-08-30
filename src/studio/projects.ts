import type { IterationTreeNode } from '@/components/studio/IterationTree'

export interface StudioProjectIteration extends IterationTreeNode {
  conversationId: string | null
  response: unknown
  latencyMs: number | null
  feedbackScore: number | null
  feedbackComment: string
  feedbackStatus: 'idle' | 'sending' | 'sent' | 'error'
  feedbackMessage: string | null
}

export interface StudioProject {
  id: string
  name: string
  prompt: string
  iterations: StudioProjectIteration[]
  selectedId: number | null
  error: string | null
  isDraft: boolean
  isLoaded: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface StudioWorkspace {
  activeProjectId: string
  projects: StudioProject[]
}

export interface StudioProjectSummary {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

type LooseObject = Record<string, unknown>

function objectValue(value: unknown): LooseObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as LooseObject
    : null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function draftId(): string {
  return `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function createStudioProject(name: string): StudioProject {
  return {
    id: draftId(),
    name: name.trim() || 'Untitled UI project',
    prompt: '',
    iterations: [],
    selectedId: null,
    error: null,
    isDraft: true,
    isLoaded: true,
    createdAt: null,
    updatedAt: null,
  }
}

export function createStudioWorkspace(): StudioWorkspace {
  const project = createStudioProject('UI Project 1')
  return { activeProjectId: project.id, projects: [project] }
}

export function studioProjectSummaries(payload: unknown): StudioProjectSummary[] {
  if (!Array.isArray(payload)) return []
  return payload.flatMap((value) => {
    const project = objectValue(value)
    const id = stringValue(project?.projectId)
    const createdAt = stringValue(project?.createdAt)
    const updatedAt = stringValue(project?.updatedAt)
    if (!id || !createdAt || !updatedAt) return []
    return [{
      id,
      name: stringValue(project?.name) ?? 'Untitled UI project',
      createdAt,
      updatedAt,
    }]
  })
}

export function projectFromSummary(summary: StudioProjectSummary): StudioProject {
  return {
    id: summary.id,
    name: summary.name,
    prompt: '',
    iterations: [],
    selectedId: null,
    error: null,
    isDraft: false,
    isLoaded: false,
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
  }
}

export function studioProjectFromDetail(payload: unknown): StudioProject | null {
  const project = objectValue(payload)
  const id = stringValue(project?.projectId)
  if (!id || !Array.isArray(project?.messages)) return null

  const iterations: StudioProjectIteration[] = []
  let pendingPrompt: string | null = null
  let parentId: number | null = null

  for (const value of project.messages) {
    const message = objectValue(value)
    const role = stringValue(message?.role)
    const content = stringValue(message?.content)
    if (!role || !content) continue

    if (role === 'user') {
      pendingPrompt = content
      continue
    }
    if (role !== 'assistant' || pendingPrompt === null) continue

    const iterationId = iterations.length + 1
    const layout = message?.layout ?? null
    iterations.push({
      id: iterationId,
      parentId,
      prompt: pendingPrompt,
      status: 'completed',
      suggestion: content,
      conversationId: id,
      latencyMs: null,
      feedbackScore: null,
      feedbackComment: '',
      feedbackStatus: 'idle',
      feedbackMessage: null,
      response: {
        conversationId: id,
        generatedBy: 'history',
        reason: content,
        suggestion: stringValue(message?.suggestion),
        layout,
      },
    })
    parentId = iterationId
    pendingPrompt = null
  }

  return {
    id,
    name: stringValue(project.name) ?? 'Untitled UI project',
    prompt: '',
    iterations,
    selectedId: iterations.at(-1)?.id ?? null,
    error: null,
    isDraft: false,
    isLoaded: true,
    createdAt: stringValue(project.createdAt),
    updatedAt: stringValue(project.updatedAt),
  }
}
