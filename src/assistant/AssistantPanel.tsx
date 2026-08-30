import { type FormEvent, useEffect, useMemo, useState } from 'react'
import type { DecisionActionRequest } from '@/components/ui-kit'
import { createRun, createWorkflowVersion } from '@/editor/api'
import type { RunId, RunProjection } from '@/runtime/contracts'
import { requestAssistance } from './api'
import type { AssistHistoryMessage, AssistResponse } from './types'

interface ChatMessage extends AssistHistoryMessage {
  id: string
}

interface AssistantPanelProps {
  apiUrl: string
  runId: RunId
  projection: RunProjection | null
  editorUrl: string
  onAction: (request: DecisionActionRequest) => boolean
  onRunCreated: (runId: RunId) => void
}

let messageSequence = 0

function chatMessage(role: ChatMessage['role'], content: string): ChatMessage {
  messageSequence += 1
  return { id: `assist-message-${messageSequence}`, role, content }
}

const initialMessages: ChatMessage[] = [
  chatMessage(
    'assistant',
    'Soy Ari. Puedo explicar este run, recomendar una acción permitida o proponer un paso nuevo para el flow.',
  ),
]

export default function AssistantPanel({
  apiUrl,
  runId,
  projection,
  editorUrl,
  onAction,
  onRunCreated,
}: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [lastResponse, setLastResponse] = useState<AssistResponse | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'creating'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const [submittedActionId, setSubmittedActionId] = useState<string | null>(null)

  const allowedActions = useMemo(
    () => new Map(projection?.availableActions.map((action) => [action.actionId, action]) ?? []),
    [projection?.availableActions],
  )
  const visibleRecommendations =
    lastResponse?.recommendedActions.filter((item) => allowedActions.has(item.actionId)) ?? []

  useEffect(() => {
    setSubmittedActionId(null)
    setActionFeedback(null)
  }, [projection?.stateVersion])

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = input.trim()
    if (!message || status !== 'idle') return

    const history = messages.slice(-12).map(({ role, content }) => ({ role, content }))
    setMessages((current) => [...current, chatMessage('user', message)])
    setInput('')
    setStatus('sending')
    setError(null)
    setActionFeedback(null)
    try {
      const response = await requestAssistance(apiUrl, runId, { message, history })
      setLastResponse(response)
      setMessages((current) => [...current, chatMessage('assistant', response.reply)])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo consultar a Ari.')
    } finally {
      setStatus('idle')
    }
  }

  const executeRecommendation = (actionId: string) => {
    const pendingDecision = projection?.pendingDecision
    const action = allowedActions.get(actionId as `act_${string}`)
    if (!pendingDecision || !action) {
      setActionFeedback('La recomendación ya no coincide con la decisión visible.')
      return
    }
    const sent = onAction({
      decisionId: pendingDecision.decisionId,
      actionId: action.actionId,
    })
    if (sent) setSubmittedActionId(action.actionId)
    setActionFeedback(
      sent
        ? `${action.label}: enviada al policy engine.`
        : `${action.label}: no pudo enviarse; revisa la conexión y la UISpec visible.`,
    )
  }

  const createProposedStep = async () => {
    const step = lastResponse?.proposedStep
    if (!step || !projection || status !== 'idle') return
    setStatus('creating')
    setError(null)
    try {
      const version = await createWorkflowVersion(
        apiUrl,
        projection.workflowId,
        projection.workflowVersion,
        [step],
      )
      const nextRun = await createRun(apiUrl, version.workflowVersionId)
      setMessages((current) => [
        ...current,
        chatMessage('assistant', `Creé v${version.version} e inicié el run del paso “${step.title}”.`),
      ])
      onRunCreated(nextRun.runId)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear y ejecutar el paso.')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <aside className="surface-card flex min-h-[34rem] flex-col overflow-hidden" aria-labelledby="assistant-title">
      <header className="border-b border-stroke bg-primary px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky">Agente supervisor</p>
            <h2 id="assistant-title" className="mt-1 text-2xl">Ari</h2>
          </div>
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold">
            {status === 'sending' ? 'Pensando…' : status === 'creating' ? 'Creando flow…' : 'Listo'}
          </span>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-surface-tinted/55 p-4" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[92%] rounded-control px-4 py-3 text-sm leading-6 ${
              message.role === 'assistant'
                ? 'bg-surface text-content shadow-sm'
                : 'ml-auto bg-primary text-white'
            }`}
          >
            {message.content}
          </div>
        ))}

        {visibleRecommendations.length ? (
          <div className="rounded-control border border-emphasis-warning-border bg-emphasis-warning-bg p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-emphasis-warning-fg">
              Acciones permitidas recomendadas
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {visibleRecommendations.map((recommendation) => {
                const action = allowedActions.get(recommendation.actionId)
                return action ? (
                  <button
                    key={recommendation.actionId}
                    type="button"
                    className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white transition duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    title={recommendation.rationale}
                    disabled={
                      status !== 'idle' ||
                      !projection?.pendingDecision ||
                      submittedActionId !== null
                    }
                    onClick={() => executeRecommendation(recommendation.actionId)}
                  >
                    {action.label}
                  </button>
                ) : null
              })}
            </div>
            {actionFeedback ? <p className="mt-2 text-xs text-emphasis-warning-fg" role="status">{actionFeedback}</p> : null}
          </div>
        ) : null}

        {lastResponse?.proposedStep ? (
          <section className="rounded-control border border-emphasis-normal-border bg-emphasis-normal-bg p-4" aria-labelledby="proposed-step-title">
            <p className="text-xs font-bold uppercase tracking-wide text-emphasis-normal-fg">Flow diff propuesto</p>
            <h3 id="proposed-step-title" className="mt-2 text-lg font-semibold">
              + {lastResponse.proposedStep.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-content-muted">{lastResponse.proposedStep.objective}</p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="font-semibold text-content-muted">Inputs</dt>
              <dd>{lastResponse.proposedStep.inputs.join(', ') || 'Ninguno'}</dd>
              <dt className="font-semibold text-content-muted">Revisión</dt>
              <dd>{lastResponse.proposedStep.requiresHumanReview ? 'Humana' : 'Automática'}</dd>
            </dl>
            <button
              type="button"
              className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
              disabled={status !== 'idle'}
              onClick={() => void createProposedStep()}
            >
              {status === 'creating' ? 'Creando v(n+1)…' : 'Crear v(n+1) y correr'}
            </button>
          </section>
        ) : null}

        {error ? <p className="rounded-control bg-emphasis-critical-bg p-3 text-sm text-emphasis-critical-fg" role="alert">{error}</p> : null}
      </div>

      <form className="border-t border-stroke bg-surface p-4" onSubmit={submitMessage}>
        <label className="sr-only" htmlFor="assistant-message">Mensaje para Ari</label>
        <textarea
          id="assistant-message"
          className="field-control min-h-24 resize-none"
          value={input}
          maxLength={800}
          disabled={status !== 'idle' || !projection}
          placeholder={projection ? 'Pregunta por el estado o propón un paso nuevo…' : 'Inicia un run para hablar con Ari.'}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <a href={editorUrl} className="btn-quiet px-0">Editor manual</a>
          <button
            type="submit"
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!input.trim() || status !== 'idle' || !projection}
          >
            {status === 'sending' ? 'Consultando…' : 'Enviar'}
          </button>
        </div>
      </form>
    </aside>
  )
}
