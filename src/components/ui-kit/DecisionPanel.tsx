import type { DecisionPanelProps } from '@/runtime/contracts'

const emphasisClasses = {
  normal: 'emphasis-normal',
  warning: 'emphasis-warning',
  critical: 'emphasis-critical',
} as const

const actionClasses = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-current bg-transparent hover:bg-white/50',
  danger: 'bg-emphasis-critical-fg text-white hover:opacity-90',
} as const

const statusLabels = {
  idle: 'Esperando decisión',
  submitting: 'Enviando decisión…',
  accepted: 'Decisión aceptada',
  rejected: 'Decisión rechazada',
} as const

export interface DecisionActionRequest {
  decisionId: DecisionPanelProps['decisionId']
  actionId: DecisionPanelProps['actions'][number]['actionId']
}

interface RuntimeDecisionPanelProps extends DecisionPanelProps {
  onAction?: (request: DecisionActionRequest) => void
}

export default function DecisionPanel({
  decisionId,
  title,
  message,
  actions,
  status = 'idle',
  errorMessage,
  emphasis = 'warning',
  onAction,
}: RuntimeDecisionPanelProps) {
  const disabled = status === 'submitting' || status === 'accepted'

  const handleAction = (action: DecisionPanelProps['actions'][number]) => {
    if (action.requiresConfirmation && !window.confirm(`Confirmar: ${action.label}`)) {
      return
    }
    onAction?.({ decisionId, actionId: action.actionId })
  }

  return (
    <aside className={`rounded-control border p-ui-4 ${emphasisClasses[emphasis]}`}>
      <p className="text-ui-caption font-semibold uppercase tracking-wide opacity-75">
        Intervención humana
      </p>
      <h3 className="mt-ui-1 text-ui-title font-semibold">{title}</h3>
      {message ? <p className="mt-ui-2 text-ui-body">{message}</p> : null}

      <div className="mt-ui-4 flex flex-wrap gap-ui-2">
        {actions.map((action) => (
          <button
            key={action.actionId}
            type="button"
            className={`rounded-control px-ui-4 py-ui-3 text-ui-label font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${actionClasses[action.style]}`}
            disabled={disabled}
            onClick={() => handleAction(action)}
          >
            {action.label}
          </button>
        ))}
      </div>

      <p className="mt-ui-3 text-ui-caption font-semibold" role="status" aria-live="polite">
        {statusLabels[status]}
      </p>
      {errorMessage ? (
        <p className="mt-ui-2 text-ui-caption font-semibold" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </aside>
  )
}
