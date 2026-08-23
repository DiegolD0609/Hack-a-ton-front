import { useState } from 'react'
import { Link } from 'react-router-dom'
import { appConfig, demoScenario } from '@/config/app'

const steps = ['Perfil', 'Plan', 'Proyección'] as const

export default function Demo() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="app-shell flex flex-col">
      <header className="border-b border-stroke bg-surface">
        <div className="page-container flex items-center justify-between py-4">
          <Link to={appConfig.routes.home} className="font-display text-xl">{appConfig.name}</Link>
          <Link to={appConfig.routes.register} className="btn-primary px-4 py-2">Crear cuenta</Link>
        </div>
      </header>

      <main className="page-container flex-1 py-10 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <p className="eyebrow">Demo guiada · datos de ejemplo</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-tight sm:text-5xl">
            Una operación logística entendible en menos de un minuto.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-content-muted">
            Recorre el flujo principal sin registrarte ni depender del backend.
          </p>

          <nav className="mt-10 grid grid-cols-3 gap-2" aria-label="Pasos de la demostración">
            {steps.map((step, index) => (
              <button
                key={step}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`rounded-control px-3 py-3 text-sm font-semibold transition-colors ${
                  activeStep === index ? 'bg-ink text-cream' : 'bg-sky/45 text-content hover:bg-sky'
                }`}
                aria-current={activeStep === index ? 'step' : undefined}
              >
                {index + 1}. {step}
              </button>
            ))}
          </nav>

          <section className="surface-card mt-6 min-h-80 p-6 sm:p-10" aria-live="polite">
            {activeStep === 0 && <ProfileStep />}
            {activeStep === 1 && <PlanStep />}
            {activeStep === 2 && <ProjectionStep />}
          </section>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
            >
              Anterior
            </button>
            {activeStep < steps.length - 1 ? (
              <button type="button" className="btn-primary" onClick={() => setActiveStep((step) => step + 1)}>
                Siguiente
              </button>
            ) : (
              <Link to={appConfig.routes.register} className="btn-primary">Crear mi propio plan</Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function ProfileStep() {
  const { profile } = demoScenario
  return (
    <div>
      <p className="eyebrow">Punto de partida</p>
      <h2 className="mt-2 text-3xl">Hola, {profile.name}. Esta es tu operación.</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label="Envíos activos" value={profile.activeShipments} />
        <Metric label="Entregas a tiempo" value={profile.onTimeDeliveries} />
        <Metric label="Meta prioritaria" value={profile.goal} />
      </div>
    </div>
  )
}

function PlanStep() {
  return (
    <div>
      <p className="eyebrow">Estado de la red</p>
      <h2 className="mt-2 text-3xl">Cada envío, en contexto</h2>
      <div className="mt-8 space-y-5">
        {demoScenario.plan.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex justify-between gap-4 text-sm font-semibold">
              <span>{item.label}</span><span>{item.percentage}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-surface-tinted">
              <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProjectionStep() {
  const { projection } = demoScenario
  return (
    <div>
      <p className="eyebrow">Impacto operativo</p>
      <h2 className="mt-2 text-3xl">Decisiones que mantienen todo en movimiento</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label="Entregas diarias" value={projection.dailyDeliveries} />
        <Metric label="Precisión de ETA" value={projection.etaAccuracy} />
        <Metric label="Resolución promedio" value={projection.resolvedExceptions} />
      </div>
      <p className="mt-6 text-sm text-content-muted">
        Escenario ilustrativo. La versión conectada puede incorporar telemetría, reglas y datos reales de la operación.
      </p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-card bg-surface-tinted p-5">
      <p className="text-sm text-content-muted">{label}</p>
      <p className="mt-2 text-xl font-bold text-content">{value}</p>
    </article>
  )
}
