import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { appConfig } from '@/config/app'

const EXIT_MS = 320

interface BrandModalProps {
  open: boolean
  onClose: () => void
}

export default function BrandModal({ open, onClose }: BrandModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const [present, setPresent] = useState(open)
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      setClosing(false)
      setPresent(true)
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      return () => {
        cancelAnimationFrame(frame)
        document.body.style.overflow = previousOverflow
      }
    }

    setVisible(false)
    setClosing(true)
    const timeout = window.setTimeout(() => {
      setPresent(false)
      setClosing(false)
      previousFocus.current?.focus()
    }, EXIT_MS)

    return () => window.clearTimeout(timeout)
  }, [open])

  useEffect(() => {
    if (visible) closeRef.current?.focus()
  }, [visible])

  if (!present) return null

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }

    if (event.key !== 'Tab' || !panelRef.current) return

    const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    )].filter((node) => !node.hasAttribute('disabled'))

    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div className={`brand-modal-root${visible ? ' is-open' : ''}${closing ? ' is-closing' : ''}`}>
      <div className="brand-modal-backdrop" onClick={onClose} />
      <div
        ref={panelRef}
        id="brand-modal"
        className="brand-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
      >
        <div className="flex h-full flex-col text-white">
          <div className="flex items-start justify-between gap-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
              {appConfig.hackathon}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Cerrar"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="mt-auto max-w-lg">
            <h2 id={titleId} className="text-balance text-4xl leading-[1.05] sm:text-5xl">
              {appConfig.name}
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-white/70 sm:text-lg">
              {appConfig.tagline}
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={appConfig.routes.demo} className="btn-primary w-full sm:w-auto" onClick={onClose}>
              Explorar la demo
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
