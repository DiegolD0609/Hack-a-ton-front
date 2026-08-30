import {
  ID_PATTERNS,
  type JsonValue,
  type RunId,
  type RunProjection,
  type RunStatus,
} from '@/runtime/contracts'

const STORAGE_KEY = 'kernel-panic:operation-run-history:v1'
const MAX_ENTRIES = 24

export interface RunHistoryEntry {
  runId: RunId
  operationId: string
  workflowVersion: number
  stateVersion: number
  status: RunStatus
  currentStepTitle: string | null
  recordedAt: string
}

function stringField(value: JsonValue | undefined): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

export function operationIdFromProjection(projection: RunProjection): string {
  return (
    projection.operationId ??
    stringField(projection.operation.operationId) ??
    stringField(projection.operation.operation_id) ??
    stringField(projection.operation.id) ??
    `legacy:${projection.workflowId}`
  )
}

function isRunStatus(value: unknown): value is RunStatus {
  return ['created', 'running', 'paused', 'completed', 'failed'].includes(String(value))
}

function isHistoryEntry(value: unknown): value is RunHistoryEntry {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const entry = value as Partial<RunHistoryEntry>
  return Boolean(
    entry.runId &&
      ID_PATTERNS.run.test(entry.runId) &&
      typeof entry.operationId === 'string' &&
      Number.isInteger(entry.workflowVersion) &&
      Number.isInteger(entry.stateVersion) &&
      isRunStatus(entry.status) &&
      typeof entry.recordedAt === 'string',
  )
}

export function loadRunHistory(): RunHistoryEntry[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as unknown
    return Array.isArray(parsed) ? parsed.filter(isHistoryEntry).slice(-MAX_ENTRIES) : []
  } catch {
    return []
  }
}

function saveRunHistory(entries: RunHistoryEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)))
  } catch {
    // A private browser context may deny storage; the in-memory history still works.
  }
}

export function rememberRunProjection(
  projection: RunProjection,
  currentEntries = loadRunHistory(),
): RunHistoryEntry[] {
  const existing = currentEntries.find((entry) => entry.runId === projection.runId)
  const entry: RunHistoryEntry = {
    runId: projection.runId,
    operationId: operationIdFromProjection(projection),
    workflowVersion: projection.workflowVersion,
    stateVersion: projection.stateVersion,
    status: projection.status,
    currentStepTitle: projection.currentStep?.title ?? null,
    recordedAt: existing?.recordedAt ?? new Date().toISOString(),
  }
  const next = [...currentEntries.filter((item) => item.runId !== projection.runId), entry]
    .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
    .slice(-MAX_ENTRIES)
  saveRunHistory(next)
  return next
}
