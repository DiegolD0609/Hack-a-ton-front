import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandModal from '@/components/BrandModal'
import HeroVideoPlaylist from '@/components/HeroVideoPlaylist'
import PipelineAccordion from '@/components/PipelineAccordion'
import { appConfig } from '@/config/app'

export default function Landing() {
  const [brandOpen, setBrandOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-ink">
      <section className="relative m-2 h-[88svh] min-h-[560px] max-h-[880px] overflow-hidden rounded-[1.75rem] bg-black sm:m-3 sm:rounded-[2.25rem]">
        <HeroVideoPlaylist />

        <header className="absolute inset-x-0 top-0 z-30 px-4 py-4 sm:px-6 sm:py-6">
          <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3" aria-label="Navegación principal">
            <button
              type="button"
              className="glass-control px-5 py-3 font-display text-sm sm:text-base"
              aria-haspopup="dialog"
              aria-expanded={brandOpen}
              aria-controls="brand-modal"
              onClick={() => setBrandOpen(true)}
            >
              {appConfig.name}
            </button>

            <div className="relative flex items-center gap-1.5 sm:gap-2">
              <div className="glass-control flex items-center gap-0.5 p-1 sm:gap-1 sm:p-1.5">
                <Link to={appConfig.routes.login} className="rounded-full px-2 py-2.5 text-xs font-medium text-white/85 hover:bg-white/10 hover:text-white sm:px-4 sm:text-sm">Login</Link>
                <Link to={appConfig.routes.register} className="rounded-full bg-white/15 px-2 py-2.5 text-xs font-medium text-white hover:bg-white/25 sm:px-4 sm:text-sm">Sign up</Link>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                className="glass-control grid h-11 w-11 shrink-0 place-items-center sm:h-12 sm:w-12"
                aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={isMenuOpen}
                aria-controls="landing-menu"
              >
                <span className="relative grid h-5 w-5 place-items-center" aria-hidden="true">
                  <span
                    className={`absolute flex flex-col justify-center gap-1.5 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                      isMenuOpen ? 'scale-y-0 opacity-0' : 'scale-y-100 opacity-100'
                    }`}
                  >
                    <span className="block h-px w-5 bg-white" />
                    <span className="block h-px w-5 bg-white" />
                    <span className="block h-px w-5 bg-white" />
                  </span>
                  <span
                    className={`absolute inset-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                      isMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
                    }`}
                  >
                    <span className="absolute top-1/2 left-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
                    <span className="absolute top-1/2 left-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-white" />
                  </span>
                </span>
              </button>

              <div
                id="landing-menu"
                className={`menu-popover absolute right-0 top-14 z-40 w-max origin-top p-1.5 motion-reduce:scale-y-100 sm:top-16 sm:p-2 ${
                  isMenuOpen ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-[0.4] opacity-0'
                }`}
                aria-hidden={!isMenuOpen}
                inert={!isMenuOpen}
              >
                <MenuLink to={appConfig.routes.demo} label="Abrir demo" onClick={() => setIsMenuOpen(false)} />
              </div>
            </div>
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

      <BrandModal open={brandOpen} onClose={() => setBrandOpen(false)} />

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
    <Link to={to} onClick={onClick} className="block rounded-md px-4 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white">
      {label}
    </Link>
  )
}
