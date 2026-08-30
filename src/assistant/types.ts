import type { ActionId } from '@/runtime/contracts'
import type { WorkflowStepDefinition } from '@/editor/types'

export interface AssistHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistRequest {
  message: string
  history: AssistHistoryMessage[]
}

export interface AssistRecommendedAction {
  actionId: ActionId
  rationale: string
}

export interface AssistResponse {
  reply: string
  recommendedActions: AssistRecommendedAction[]
  proposedStep?: WorkflowStepDefinition | null
}
