import { useEffect } from 'react'
import StudioIcon from '@/components/studio/StudioIcon'
import type { StudioProjectIteration } from '@/studio/projects'

interface ProjectFeedbackProps {
  open: boolean
  iteration: StudioProjectIteration | null
  projectName: string
  onClose: () => void
  onCommentChange: (comment: string) => void
  onScoreChange: (score: 1 | 5) => void
  onSubmit: () => void
}

export default function ProjectFeedback({
  open,
  iteration,
  projectName,
  onClose,
  onCommentChange,
  onScoreChange,
  onSubmit,
}: ProjectFeedbackProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !iteration || iteration.status !== 'completed') return null

  const isSending = iteration.feedbackStatus === 'sending'

  return (
    <div className="studio-modal-root is-open" role="presentation" onClick={onClose}>
      <div className="studio-modal-backdrop" aria-hidden="true" />
      <section
        className="studio-feedback-card studio-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-feedback-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="studio-modal-close" aria-label="Cerrar" onClick={onClose}>
          ×
        </button>
        <span className="studio-kicker"><StudioIcon name="spark" size={13} />Project learning</span>
        <h2 id="studio-feedback-title">
          Rate {projectName} after iteration {String(iteration.id).padStart(2, '0')}
        </h2>
        <p className="studio-feedback-context">
          This feedback applies to the whole project and guides its next generation — you can send it
          again after every new generate.
        </p>

        <div className="grid grid-cols-2 gap-2" aria-label="Calificación del proyecto">
          <button
            type="button"
            className={iteration.feedbackScore === 1 ? 'is-selected' : ''}
            aria-pressed={iteration.feedbackScore === 1}
            disabled={isSending}
            onClick={() => onScoreChange(1)}
          >
            <StudioIcon name="thumbDown" size={15} />Needs work
          </button>
          <button
            type="button"
            className={iteration.feedbackScore === 5 ? 'is-selected' : ''}
            aria-pressed={iteration.feedbackScore === 5}
            disabled={isSending}
            onClick={() => onScoreChange(5)}
          >
            <StudioIcon name="thumbUp" size={15} />Works well
          </button>
        </div>

        <label>
          Optional note
          <textarea
            aria-label="Comentario de feedback"
            value={iteration.feedbackComment}
            maxLength={500}
            disabled={isSending}
            placeholder="What should the next iteration preserve or improve?"
            onChange={(event) => onCommentChange(event.target.value)}
          />
          <span className="studio-feedback-count">{iteration.feedbackComment.length}/500</span>
        </label>

        <button
          type="button"
          className="studio-feedback-submit"
          disabled={iteration.feedbackScore === null || isSending}
          onClick={onSubmit}
        >
          {isSending ? <StudioIcon name="refresh" className="animate-spin" /> : <StudioIcon name="arrow" />}
          {isSending ? 'Sending…' : iteration.feedbackStatus === 'sent' ? 'Send again' : 'Send feedback'}
        </button>

        {iteration.feedbackMessage ? (
          <p className={`studio-feedback-status is-${iteration.feedbackStatus}`} role="status">
            {iteration.feedbackMessage}
          </p>
        ) : null}
      </section>
    </div>
  )
}
