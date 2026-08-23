import { useState } from 'react'
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
  const active = stages[activeStage]

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

        <div
          className="hidden h-[560px] gap-1 transition-[grid-template-columns] duration-500 lg:grid"
          style={{ gridTemplateColumns: `minmax(0, 1.08fr) ${stages.map((_, index) => index === activeStage ? 'minmax(0, .88fr)' : '5.25rem').join(' ')}` }}
        >
          <figure className="relative overflow-hidden rounded-[1.75rem] bg-surface-tinted">
            <img key={active.image} src={active.image} alt="" className="h-full w-full object-cover transition-opacity duration-300" />
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
                  <div id={`pipeline-panel-${stage.number}`} className="flex h-full flex-col p-7 xl:p-9">
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

        <div className="space-y-2 lg:hidden">
          {stages.map((stage, index) => {
            const isActive = activeStage === index
            return (
              <article key={stage.number} className="overflow-hidden rounded-[1.5rem] bg-ink text-white">
                <button
                  type="button"
                  onClick={() => setActiveStage(index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                  aria-expanded={isActive}
                  aria-controls={`pipeline-mobile-${stage.number}`}
                >
                  <span className="text-2xl">{stage.title}</span>
                  <span className="text-xl text-white/50">{stage.number}</span>
                </button>
                {isActive && (
                  <div id={`pipeline-mobile-${stage.number}`}>
                    <img src={stage.image} alt="" className="aspect-[4/3] w-full object-cover" />
                    <div className="p-5">
                      <p className="leading-7 text-white/65">{stage.description}</p>
                      <Link to={appConfig.routes.demo} className="btn-primary mt-6">Ver etapa en la demo</Link>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
