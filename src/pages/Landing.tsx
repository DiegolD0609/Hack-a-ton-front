import { Link } from 'react-router-dom'
import HeroVideoPlaylist from '@/components/HeroVideoPlaylist'
import { appConfig } from '@/config/app'

const capabilities = [
  {
    number: '01',
    title: 'Visibilidad operativa',
    description: 'Sigue cada envío, evento y excepción desde una sola vista compartida.',
  },
  {
    number: '02',
    title: 'Decisiones más rápidas',
    description: 'Convierte señales de operación en acciones claras para tu equipo logístico.',
  },
  {
    number: '03',
    title: 'Entrega coordinada',
    description: 'Mantén alineados a operadores, aliados y clientes hasta la última milla.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <section className="relative m-2 min-h-[calc(100svh-1rem)] overflow-hidden rounded-[1.75rem] bg-black sm:m-3 sm:min-h-[calc(100svh-1.5rem)] sm:rounded-[2.25rem]">
        <HeroVideoPlaylist />

        <header className="absolute inset-x-0 top-0 z-30 px-4 py-4 sm:px-6 sm:py-6">
          <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3" aria-label="Navegación principal">
            <Link to={appConfig.routes.home} className="glass-control px-5 py-3 font-display text-sm sm:text-base">
              {appConfig.name}
            </Link>

            <div className="glass-control flex items-center gap-1 p-1.5">
              <Link to={appConfig.routes.login} className="rounded-full px-4 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white">
                Login
              </Link>
              <Link to={appConfig.routes.register} className="rounded-full bg-white/15 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/25">
                Sign up
              </Link>
            </div>
          </nav>
        </header>

        <div className="relative z-10 flex min-h-[calc(100svh-1rem)] items-end px-5 pb-32 pt-28 sm:min-h-[calc(100svh-1.5rem)] sm:px-10 sm:pb-20 lg:px-16">
          <div className="max-w-3xl text-white">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Logística conectada · Operación visible</p>
            <h1 className="max-w-3xl text-4xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Mueve lo que importa, sin perderlo de vista.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
              {appConfig.tagline}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={appConfig.routes.demo} className="btn-primary w-full sm:w-auto">
                Explorar la demo
              </Link>
              <a href="#capabilities" className="glass-control inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold sm:w-auto">
                Conocer el flujo
              </a>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section className="px-5 py-20 sm:px-8 sm:py-28" id="capabilities">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <p className="eyebrow">De origen a destino</p>
              <h2 className="max-w-4xl text-4xl leading-tight sm:text-5xl lg:text-6xl">
                Una operación que se siente tan clara como debería.
              </h2>
            </div>

            <div className="mt-14 grid border-t border-black/15 md:grid-cols-3">
              {capabilities.map((capability) => (
                <article key={capability.number} className="border-b border-black/15 py-8 md:border-b-0 md:border-r md:px-7 md:last:border-r-0 md:first:pl-0">
                  <p className="text-sm font-semibold text-secondary">{capability.number}</p>
                  <h3 className="mt-10 text-2xl">{capability.title}</h3>
                  <p className="mt-4 max-w-sm leading-7 text-black/60">{capability.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="m-2 overflow-hidden rounded-[1.75rem] bg-black px-5 py-20 text-white sm:m-3 sm:rounded-[2.25rem] sm:px-10 sm:py-28 lg:px-16">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky">Diseñado para el mundo real</p>
              <h2 className="mt-5 text-4xl leading-tight sm:text-5xl">Menos ruido. Más movimiento.</h2>
            </div>
            <div>
              <p className="max-w-xl text-lg leading-8 text-white/65">
                Un flujo demostrable que conecta registro, monitoreo y trazabilidad sin distraer al equipo con complejidad innecesaria.
              </p>
              <Link to={appConfig.routes.demo} className="btn-primary mt-8">Ver cómo funciona</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-black/15 pt-8 text-sm text-black/55 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-base text-ink">{appConfig.name}</span>
          <span>{appConfig.hackathon} · {appConfig.team.name}</span>
        </div>
      </footer>
    </div>
  )
}
