import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { appConfig } from '@/config/app'

const stages = [
  {
    number: '1',
    title: 'Ingreso',
    description: 'El envío entra al sistema con origen, destino, prioridad y evidencia documental listos para validación.',
    image: '/images/pipeline-intake.webp',
  },
  {
    number: '2',
    title: 'Orquestación',
    description: 'La operación asigna ruta, capacidad y responsable mientras detecta excepciones antes de que escalen.',
    image: '/images/pipeline-routing.webp',
  },
  {
    number: '3',
    title: 'Confirmación',
    description: 'La entrega cierra el ciclo con trazabilidad, evidencia y actualización inmediata para todos los involucrados.',
    image: '/images/pipeline-confirmation.webp',
  },
] as const

export default function PipelineAccordion() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollTrack = useRef<HTMLDivElement | null>(null)
  const targetProgress = useRef(0)
  const renderedProgress = useRef(0)
  const animationFrame = useRef<number | null>(null)
  const activeStage = Math.min(stages.length - 1, Math.round(scrollProgress))
  const active = stages[activeStage]

  useEffect(() => {
    const prefersReducedMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const requestFrame = typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame.bind(window)
      : (callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 16)
    const cancelFrame = typeof window.cancelAnimationFrame === 'function'
      ? window.cancelAnimationFrame.bind(window)
      : window.clearTimeout.bind(window)

    function animateProgress() {
      const difference = targetProgress.current - renderedProgress.current

      if (prefersReducedMotion || Math.abs(difference) < 0.001) {
        renderedProgress.current = targetProgress.current
        setScrollProgress(targetProgress.current)
        animationFrame.current = null
        return
      }

      renderedProgress.current += difference * 0.14
      setScrollProgress(renderedProgress.current)
      animationFrame.current = requestFrame(animateProgress)
    }

    function measureProgress() {
      const track = scrollTrack.current
      if (!track) return

      const rect = track.getBoundingClientRect()
      const stickyOffset = window.innerWidth >= 1024 ? 24 : 12
      const travel = Math.max(rect.height - window.innerHeight, 1)
      const normalized = Math.min(1, Math.max(0, (stickyOffset - rect.top) / travel))
      targetProgress.current = normalized * (stages.length - 1)

      if (animationFrame.current === null && Math.abs(targetProgress.current - renderedProgress.current) >= 0.001) {
        animationFrame.current = requestFrame(animateProgress)
      }
    }

    measureProgress()
    window.addEventListener('scroll', measureProgress, { passive: true })
    document.addEventListener('scroll', measureProgress, { passive: true, capture: true })
    window.addEventListener('resize', measureProgress)
    const measurementInterval = window.setInterval(measureProgress, 50)

    return () => {
      window.removeEventListener('scroll', measureProgress)
      document.removeEventListener('scroll', measureProgress, { capture: true })
      window.removeEventListener('resize', measureProgress)
      window.clearInterval(measurementInterval)
      if (animationFrame.current !== null) {
        cancelFrame(animationFrame.current)
        animationFrame.current = null
      }
    }
  }, [])

  function moveToStage(index: number) {
    const track = scrollTrack.current
    if (!track) return

    const stickyOffset = window.innerWidth >= 1024 ? 24 : 12
    const trackTop = window.scrollY + track.getBoundingClientRect().top - stickyOffset
    const travel = Math.max(track.offsetHeight - window.innerHeight, 1)
    const destination = trackTop + travel * (index / (stages.length - 1))
    const reduceMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: destination, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  function visualState(index: number) {
    const distance = Math.min(1, Math.abs(scrollProgress - index))
    const visibility = 1 - distance

    return {
      opacity: visibility,
      transform: `translate3d(0, ${(index - scrollProgress) * 20}px, 0) scale(${0.985 + visibility * 0.015})`,
    }
  }

  return (
    <section id="pipeline" className="scroll-mt-6 px-2 py-16 sm:px-3 sm:py-24">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-10 px-3 sm:px-6 lg:flex lg:items-end lg:justify-between lg:gap-10">
          <div>
            <p className="eyebrow">Pipeline transaccional</p>
            <h2 className="mt-3 max-w-3xl text-4xl leading-tight sm:text-5xl">Cada evento empuja la operación hacia adelante.</h2>
          </div>
          <p className="mt-5 max-w-md leading-7 text-black/55 lg:mt-0">Tres etapas claras para convertir un pedido en una entrega trazable.</p>
        </div>

        <div ref={scrollTrack} className="relative mt-10 h-[245svh] lg:h-[235vh]">
          <div className="sticky top-3 h-[calc(100svh-1.5rem)] min-h-[560px] max-h-[760px] lg:top-6 lg:h-[calc(100vh-3rem)]">
            <div
              className="pipeline-grid hidden h-full gap-1 transition-[grid-template-columns] duration-700 lg:grid"
              style={{ gridTemplateColumns: `minmax(0, 1.08fr) ${stages.map((_, index) => index === activeStage ? 'minmax(0, .88fr)' : '5.25rem').join(' ')}` }}
            >
              <figure className="relative overflow-hidden rounded-[1.75rem] bg-surface-tinted">
                {stages.map((stage, index) => (
                  <img
                    key={stage.number}
                    src={stage.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover will-change-[transform,opacity]"
                    style={visualState(index)}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </figure>

              {stages.map((stage, index) => {
                const isActive = activeStage === index
                return (
                  <article key={stage.number} className="relative overflow-hidden rounded-[1.75rem] bg-ink text-white">
                    <button
                      type="button"
                      onClick={() => moveToStage(index)}
                      className="absolute inset-0 z-10 w-full text-left"
                      aria-expanded={isActive}
                      aria-controls={`pipeline-panel-${stage.number}`}
                      aria-label={`Abrir etapa ${stage.number}: ${stage.title}`}
                    />
                    <div
                      id={`pipeline-panel-${stage.number}`}
                      className={`pipeline-fade absolute inset-0 flex flex-col p-8 xl:p-10 ${
                        isActive ? 'is-active' : 'pointer-events-none'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="min-w-0 flex-1 text-4xl xl:text-5xl">{stage.title}</h3>
                        <span className="shrink-0 text-3xl text-white/45">{stage.number}</span>
                      </div>
                      <div className="relative z-20 mt-auto">
                        <p className="max-w-sm leading-7 text-white/65">{stage.description}</p>
                        <Link to={appConfig.routes.demo} className="btn-primary mt-7">Ver etapa en la demo</Link>
                      </div>
                    </div>
                    <div
                      className={`pipeline-fade flex h-full flex-col items-center py-7 ${
                        isActive ? 'pointer-events-none' : 'is-active'
                      }`}
                    >
                      <span className="text-3xl text-white/60">{stage.number}</span>
                      <h3 className="mt-auto [writing-mode:vertical-rl] rotate-180 text-2xl">{stage.title}</h3>
                    </div>
                  </article>
                )
              })}
            </div>

            <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-ink text-white lg:hidden">
              <div className="relative min-h-0 flex-1 overflow-hidden">
                {stages.map((stage, index) => (
                  <img
                    key={stage.number}
                    src={stage.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover will-change-[transform,opacity]"
                    style={visualState(index)}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-5" aria-label={`Etapa ${activeStage + 1} de ${stages.length}`}>
                  {stages.map((stage, index) => (
                    <button
                      key={stage.number}
                      type="button"
                      onClick={() => moveToStage(index)}
                      className={`h-1.5 transition-all duration-300 ${index === activeStage ? 'w-10 bg-white' : 'w-5 bg-white/35'}`}
                      aria-label={`Mostrar ${stage.title}`}
                    />
                  ))}
                </div>
              </div>
              <div key={active.number} className="pipeline-reveal p-6 pb-7">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="min-w-0 flex-1 text-3xl">{active.title}</h3>
                  <span className="shrink-0 text-2xl text-white/45">{active.number}</span>
                </div>
                <p className="mt-4 leading-7 text-white/65">{active.description}</p>
                <Link to={appConfig.routes.demo} className="btn-primary mt-6">Ver etapa en la demo</Link>
              </div>
            </article>
          </div>

        </div>
      </div>
    </section>
  )
}
