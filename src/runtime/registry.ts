import { createElement, type ReactNode } from 'react'
import {
  Alert,
  Compare,
  DecisionPanel,
  GenericStepCard,
  KeyValue,
  Metric,
  Page,
  Section,
  Timeline,
  type DecisionActionRequest,
} from '@/components/ui-kit'
import type {
  AlertProps,
  CompareProps,
  DecisionPanelProps,
  KeyValueProps,
  MetricProps,
  PageProps,
  SectionProps,
  StepProps,
  TimelineProps,
} from '@/runtime/contracts'
import type { DecisionFeedback } from '@/runtime/reducer'
import type { RegisteredComponentType } from '@/runtime/validation'

export interface RegistryRenderContext {
  props: unknown
  children?: ReactNode
  onAction?: (request: DecisionActionRequest) => void
  decisionFeedback?: Readonly<Record<string, DecisionFeedback>>
}

export interface RegistryEntry {
  acceptsChildren: boolean
  render: (context: RegistryRenderContext) => ReactNode
}

export const componentRegistry: Readonly<Record<RegisteredComponentType, RegistryEntry>> = {
  page: {
    acceptsChildren: true,
    render: ({ props, children }) =>
      createElement(Page, { ...(props as PageProps), children }),
  },
  section: {
    acceptsChildren: true,
    render: ({ props, children }) =>
      createElement(Section, { ...(props as SectionProps), children }),
  },
  metric: {
    acceptsChildren: false,
    render: ({ props }) => createElement(Metric, props as MetricProps),
  },
  alert: {
    acceptsChildren: false,
    render: ({ props }) => createElement(Alert, props as AlertProps),
  },
  timeline: {
    acceptsChildren: false,
    render: ({ props }) => createElement(Timeline, props as TimelineProps),
  },
  keyValue: {
    acceptsChildren: false,
    render: ({ props }) => createElement(KeyValue, props as KeyValueProps),
  },
  compare: {
    acceptsChildren: false,
    render: ({ props }) => createElement(Compare, props as CompareProps),
  },
  decisionPanel: {
    acceptsChildren: false,
    render: ({ props, onAction, decisionFeedback }) => {
      const panel = props as DecisionPanelProps
      const feedback = decisionFeedback?.[panel.decisionId]
      return createElement(DecisionPanel, {
        ...panel,
        status: feedback?.status ?? panel.status,
        errorMessage: feedback?.errorMessage ?? panel.errorMessage,
        onAction,
      })
    },
  },
  step: {
    acceptsChildren: false,
    render: ({ props }) => {
      const step = props as StepProps
      return createElement(GenericStepCard, {
        title: step.title,
        stepId: step.stepId,
        objective: step.objective,
        summary: step.summary,
        status: step.status,
      })
    },
  },
}

export function isRegisteredComponentType(type: string): type is RegisteredComponentType {
  return Object.hasOwn(componentRegistry, type)
}
