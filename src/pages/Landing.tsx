import { useState } from 'react'
import { Link } from 'react-router-dom'
import HeroVideoPlaylist from '@/components/HeroVideoPlaylist'
import PipelineAccordion from '@/components/PipelineAccordion'
import { appConfig } from '@/config/app'

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-ink">
      <section className="relative m-2 h-[88svh] min-h-[560px] max-h-[880px] overflow-hidden rounded-[1.75rem] bg-black sm:m-3 sm:rounded-[2.25rem]">
        <HeroVideoPlaylist />

        <header className="absolute inset-x-0 top-0 z-30 px-4 py-4 sm:px-6 sm:py-6">
          <nav className="relative mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-start gap-3" aria-label="Navegación principal">
            <Link to={appConfig.routes.home} className="glass-control justify-self-start px-5 py-3 font-display text-sm sm:text-base">
              {appConfig.name}
            </Link>

            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="glass-control grid h-12 w-12 place-items-center justify-self-center"
              aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMenuOpen}
            >
              <span className="space-y-1.5" aria-hidden="true">
                <span className={`block h-px w-5 bg-white transition-transform ${isMenuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
                <span className={`block h-px w-5 bg-white transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-px w-5 bg-white transition-transform ${isMenuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
              </span>
            </button>

            <div className="glass-control hidden items-center gap-1 justify-self-end p-1.5 sm:flex">
              <Link to={appConfig.routes.login} className="rounded-full px-4 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white">Login</Link>
              <Link to={appConfig.routes.register} className="rounded-full bg-white/15 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/25">Sign up</Link>
            </div>

            {isMenuOpen && (
              <div className="glass-control absolute left-1/2 top-16 w-[min(92vw,24rem)] -translate-x-1/2 p-3">
                <div className="grid gap-1">
                  <MenuLink to="#pipeline" label="Pipeline" onClick={() => setIsMenuOpen(false)} />
                  <MenuLink to={appConfig.routes.demo} label="Demo guiada" onClick={() => setIsMenuOpen(false)} />
                  <MenuLink to={appConfig.routes.login} label="Login" onClick={() => setIsMenuOpen(false)} />
                  <MenuLink to={appConfig.routes.register} label="Crear cuenta" onClick={() => setIsMenuOpen(false)} />
                </div>
              </div>
            )}
          </nav>
        </header>

        <div className="relative z-10 flex h-full items-center px-5 py-24 sm:px-10 lg:px-16">
          <div className="max-w-xl text-white">
            <h1 className="text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">Logística en movimiento.</h1>
            <Link to={appConfig.routes.demo} className="btn-primary mt-7">Explorar la demo</Link>
          </div>
        </div>

        <a
          href="#pipeline"
          className="absolute -bottom-px left-1/2 z-20 flex h-14 w-32 -translate-x-1/2 items-center justify-center rounded-t-[2rem] bg-white text-ink"
          aria-label="Descubrir el pipeline"
        >
          <svg className="h-5 w-5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </section>

      <main>
        <PipelineAccordion />

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

function MenuLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="rounded-full px-5 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white">
      {label}
    </Link>
  )
}
