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
  const [activeStage, setActiveStage] = useState(0)
  const stageMarkers = useRef<Array<HTMLDivElement | null>>([])
  const active = stages[activeStage]

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible) {
          setActiveStage(Number((visible.target as HTMLElement).dataset.stage))
        }
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    stageMarkers.current.forEach((marker) => marker && observer.observe(marker))
    return () => observer.disconnect()
  }, [])

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

        <div className="relative mt-10 h-[245svh] lg:h-[235vh]">
          <div className="sticky top-3 h-[calc(100svh-1.5rem)] min-h-[560px] max-h-[760px] lg:top-6 lg:h-[calc(100vh-3rem)]">
            <div
              className="hidden h-full gap-1 transition-[grid-template-columns] duration-500 ease-out lg:grid"
              style={{ gridTemplateColumns: `minmax(0, 1.08fr) ${stages.map((_, index) => index === activeStage ? 'minmax(0, .88fr)' : '5.25rem').join(' ')}` }}
            >
              <figure className="relative overflow-hidden rounded-[1.75rem] bg-surface-tinted">
                {stages.map((stage, index) => (
                  <img
                    key={stage.number}
                    src={stage.image}
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ease-out motion-reduce:transition-none ${index === activeStage ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.985] opacity-0'}`}
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
                      onClick={() => setActiveStage(index)}
                      className="absolute inset-0 z-10 w-full text-left"
                      aria-expanded={isActive}
                      aria-controls={`pipeline-panel-${stage.number}`}
                      aria-label={`Abrir etapa ${stage.number}: ${stage.title}`}
                    />
                    {isActive ? (
                      <div id={`pipeline-panel-${stage.number}`} className="pipeline-reveal flex h-full flex-col p-7 xl:p-9">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-4xl xl:text-5xl">{stage.title}</h3>
                          <span className="text-3xl text-white/45">{stage.number}</span>
                        </div>
                        <div className="relative z-20 mt-auto">
                          <p className="max-w-sm leading-7 text-white/65">{stage.description}</p>
                          <Link to={appConfig.routes.demo} className="btn-primary mt-7">Ver etapa en la demo</Link>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center py-7">
                        <span className="text-3xl text-white/60">{stage.number}</span>
                        <h3 className="mt-auto [writing-mode:vertical-rl] rotate-180 text-2xl">{stage.title}</h3>
                      </div>
                    )}
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
                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ease-out motion-reduce:transition-none ${index === activeStage ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.985] opacity-0'}`}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-5" aria-label={`Etapa ${activeStage + 1} de ${stages.length}`}>
                  {stages.map((stage, index) => (
                    <button
                      key={stage.number}
                      type="button"
                      onClick={() => setActiveStage(index)}
                      className={`h-1.5 transition-all duration-300 ${index === activeStage ? 'w-10 bg-white' : 'w-5 bg-white/35'}`}
                      aria-label={`Mostrar ${stage.title}`}
                    />
                  ))}
                </div>
              </div>
              <div key={active.number} className="pipeline-reveal p-5 pb-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-3xl">{active.title}</h3>
                  <span className="text-2xl text-white/45">{active.number}</span>
                </div>
                <p className="mt-4 leading-7 text-white/65">{active.description}</p>
                <Link to={appConfig.routes.demo} className="btn-primary mt-6">Ver etapa en la demo</Link>
              </div>
            </article>
          </div>

          <div className="pointer-events-none absolute inset-0 grid grid-rows-3" aria-hidden="true">
            {stages.map((stage, index) => (
              <div
                key={stage.number}
                ref={(element) => { stageMarkers.current[index] = element }}
                data-stage={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
