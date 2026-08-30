import { useState } from 'react'
import StudioIcon from '@/components/studio/StudioIcon'

interface StudioSuggestionProps {
  suggestion: string | null
  generatedBy: string | null
  canRate: boolean
  onRate: () => void
}

export default function StudioSuggestion({
  suggestion,
  generatedBy,
  canRate,
  onRate,
}: StudioSuggestionProps) {
  const [showFaq, setShowFaq] = useState(false)
  const isGuidance = generatedBy === 'guidance'

  return (
    <section className="studio-brief-block studio-suggestion-block" aria-labelledby="studio-suggestion-title">
      <div className="flex items-center justify-between">
        <span className="studio-sidebar-label" id="studio-suggestion-title">Suggestion</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/30">from the UI</span>
      </div>

      {suggestion ? (
        <div className={`studio-suggestion-body ${isGuidance ? 'is-guidance' : ''}`}>
          <StudioIcon name={isGuidance ? 'message' : 'spark'} size={15} />
          <p>{suggestion}</p>
        </div>
      ) : (
        <p className="studio-suggestion-empty">
          Genera una interfaz para ver aquí la sugerencia de mejora del modelo.
        </p>
      )}

      <div className="studio-rate-row">
        <button
          type="button"
          className="studio-rate-button"
          disabled={!canRate}
          onClick={onRate}
        >
          <StudioIcon name="spark" size={14} />
          Rate &amp; Teach
        </button>
        <button
          type="button"
          className={`studio-faq-button ${showFaq ? 'is-active' : ''}`}
          aria-label="Qué es Rate & Teach"
          aria-expanded={showFaq}
          onClick={() => setShowFaq((value) => !value)}
        >
          <StudioIcon name="help" size={16} />
        </button>
      </div>

      {showFaq ? (
        <div className="studio-faq-popover" role="note">
          <strong>¿Qué es Rate &amp; Teach?</strong>
          <p>
            Califica el proyecto con 👍 / 👎 y deja una nota opcional. Las calificaciones bajas hacen
            que el orquestador razone más y atienda tus comentarios en la siguiente generación.
          </p>
        </div>
      ) : null}
    </section>
  )
}
