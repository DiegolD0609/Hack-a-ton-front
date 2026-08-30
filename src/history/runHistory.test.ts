import { beforeEach, describe, expect, it } from 'vitest'
import type { RunProjection } from '@/runtime/contracts'
import { loadRunHistory, rememberRunProjection } from './runHistory'

function projection(runId: `run_${string}`, stateVersion: number): RunProjection {
  return {
    schemaVersion: '1',
    runId,
    workflowId: 'wf_history_demo',
    workflowVersion: 1,
    stateVersion,
    lastSequence: stateVersion,
    status: stateVersion > 1 ? 'completed' : 'running',
    currentStep: null,
    operation: {},
    operationId: 'op_shared',
    recentEvents: [],
    pendingDecision: null,
    availableActions: [],
  }
}

describe('run history', () => {
  beforeEach(() => window.localStorage.clear())

  it('persists successive runs and updates an existing snapshot without duplicating it', () => {
    let history = rememberRunProjection(projection('run_moment_1', 1), [])
    history = rememberRunProjection(projection('run_moment_2', 1), history)
    history = rememberRunProjection(projection('run_moment_1', 3), history)

    expect(history).toHaveLength(2)
    expect(history.find((entry) => entry.runId === 'run_moment_1')?.stateVersion).toBe(3)
    expect(loadRunHistory().map((entry) => entry.runId)).toEqual([
      'run_moment_1',
      'run_moment_2',
    ])
  })
})
