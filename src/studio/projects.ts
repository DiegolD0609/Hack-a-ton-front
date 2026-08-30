import type { IterationStatus, IterationTreeNode } from '@/components/studio/IterationTree'

export const STUDIO_WORKSPACE_KEY = 'kernel-panic.studio.workspace.v1'

export interface StudioProjectIteration extends IterationTreeNode {
  conversationId: string | null
  response: unknown
}

export interface StudioProject {
  id: string
  name: string
  prompt: string
  iterations: StudioProjectIteration[]
  selectedId: number | null
  error: string | null
}

export interface StudioWorkspace {
  version: 1
  activeProjectId: string
  projects: StudioProject[]
}

type LooseObject = Record<string, unknown>

function objectValue(value: unknown): LooseObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as LooseObject
    : null
}

function projectId(): string {
  return `project_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function createStudioProject(name: string): StudioProject {
  return {
    id: projectId(),
    name: name.trim() || 'Untitled UI project',
    prompt: '',
    iterations: [],
    selectedId: null,
    error: null,
  }
}

export function createStudioWorkspace(): StudioWorkspace {
  const project = createStudioProject('UI Project 1')
  return { version: 1, activeProjectId: project.id, projects: [project] }
}

function restoredStatus(value: unknown): IterationStatus | null {
  return value === 'generating' || value === 'completed' || value === 'error' ? value : null
}

function restoreIteration(value: unknown): StudioProjectIteration | null {
  const iteration = objectValue(value)
  const status = restoredStatus(iteration?.status)
  if (
    !iteration
    || typeof iteration.id !== 'number'
    || (iteration.parentId !== null && typeof iteration.parentId !== 'number')
    || typeof iteration.prompt !== 'string'
    || !status
  ) return null

  const interrupted = status === 'generating'
  return {
    id: iteration.id,
    parentId: iteration.parentId as number | null,
    prompt: iteration.prompt,
    status: interrupted ? 'error' : status,
    suggestion: interrupted
      ? 'Generation interrupted by page reload.'
      : typeof iteration.suggestion === 'string' ? iteration.suggestion : null,
    conversationId: typeof iteration.conversationId === 'string' ? iteration.conversationId : null,
    response: iteration.response ?? null,
  }
}

function restoreProject(value: unknown): StudioProject | null {
  const project = objectValue(value)
  if (!project || typeof project.id !== 'string' || typeof project.name !== 'string') return null

  const iterations = Array.isArray(project.iterations)
    ? project.iterations.map(restoreIteration).filter((item): item is StudioProjectIteration => item !== null)
    : []
  const selectedId = typeof project.selectedId === 'number'
    && iterations.some((iteration) => iteration.id === project.selectedId)
    ? project.selectedId
    : null

  return {
    id: project.id,
    name: project.name || 'Untitled UI project',
    prompt: typeof project.prompt === 'string' ? project.prompt.slice(0, 2000) : '',
    iterations,
    selectedId,
    error: typeof project.error === 'string' ? project.error : null,
  }
}

export function loadStudioWorkspace(storage: Storage = window.localStorage): StudioWorkspace {
  try {
    const raw = storage.getItem(STUDIO_WORKSPACE_KEY)
    if (!raw) return createStudioWorkspace()

    const stored = objectValue(JSON.parse(raw))
    const projects = Array.isArray(stored?.projects)
      ? stored.projects.map(restoreProject).filter((item): item is StudioProject => item !== null)
      : []
    if (!projects.length) return createStudioWorkspace()

    const activeProjectId = typeof stored?.activeProjectId === 'string'
      && projects.some((project) => project.id === stored.activeProjectId)
      ? stored.activeProjectId
      : projects[0].id

    return { version: 1, activeProjectId, projects }
  } catch {
    return createStudioWorkspace()
  }
}

export function saveStudioWorkspace(workspace: StudioWorkspace, storage: Storage = window.localStorage): boolean {
  try {
    storage.setItem(STUDIO_WORKSPACE_KEY, JSON.stringify(workspace))
    return true
  } catch {
    return false
  }
}
