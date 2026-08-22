import { Link } from 'react-router-dom'
import { appConfig } from '@/config/app'

const features = [
  {
    title: 'Lightning Fast',
    desc: 'Vite provides instant server start and blazing-fast HMR.',
  },
  {
    title: 'Type Safe',
    desc: 'TypeScript catches bugs early and improves your development experience.',
  },
  {
    title: 'Modern Styling',
    desc: 'Tailwind CSS makes it easy to build beautiful interfaces quickly.',
  },
]

export default function Landing() {
  return (
    <div className="app-shell flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-stroke bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="font-display text-lg sm:text-xl"
          >
            {appConfig.name}
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Link
              to="/login"
              className="btn-quiet"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="btn-primary px-3 py-2 sm:px-4"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Build something{' '}
            <span className="text-signal">
              amazing
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-content-muted sm:text-lg sm:leading-8">
            A fast, modern front-end powered by React, Vite, and Tailwind CSS.
            Ready for your hackathon ideas.
          </p>

          <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4">
            <Link
              to="/register"
              className="btn-primary w-full sm:w-auto"
            >
              Start Building
            </Link>

            <Link
              to={appConfig.routes.demo}
              className="btn-secondary w-full sm:w-auto"
            >
              Learn More
            </Link>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="border-y border-stroke bg-sky py-14 sm:py-16 lg:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-center text-base text-content-muted">
              A solid foundation so you can focus on what matters.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-8">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="surface-card p-5 transition-transform hover:-translate-y-1 sm:p-6"
                >
                  <h3 className="text-lg font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-content-muted">
                    {feature.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stroke bg-ink text-cream">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm sm:px-6 sm:py-8 lg:px-8">
          Built by {appConfig.team.name}
        </div>
      </footer>
    </div>
  )
}
