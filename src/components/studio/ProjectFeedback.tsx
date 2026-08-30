import StudioIcon from '@/components/studio/StudioIcon'
import type { StudioProjectIteration } from '@/studio/projects'

interface ProjectFeedbackProps {
  iteration: StudioProjectIteration | null
  projectName: string
  onCommentChange: (comment: string) => void
  onScoreChange: (score: 1 | 5) => void
  onSubmit: () => void
}

export default function ProjectFeedback({
  iteration,
  projectName,
  onCommentChange,
  onScoreChange,
  onSubmit,
}: ProjectFeedbackProps) {
  if (!iteration || iteration.status !== 'completed') return null

  const isSending = iteration.feedbackStatus === 'sending'

  return (
    <section className="studio-feedback-card" aria-labelledby="studio-feedback-title">
      <span className="studio-kicker"><StudioIcon name="spark" size={13} />Project learning</span>
      <h2 id="studio-feedback-title">
        Rate {projectName} after iteration {String(iteration.id).padStart(2, '0')}
      </h2>
      <p className="studio-feedback-context">
        This feedback applies to the whole project and guides its next generation.
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
        <p
          className={`studio-feedback-status is-${iteration.feedbackStatus}`}
          role="status"
        >
          {iteration.feedbackMessage}
        </p>
      ) : null}
    </section>
  )
}
