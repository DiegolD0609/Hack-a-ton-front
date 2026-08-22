import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { appConfig } from '@/config/app'
import panelImg from '@/utils/public/rafa-login.jpg'

interface AuthLayoutProps {
  children: ReactNode
  heading: string
  quote: string
}

export default function AuthLayout({ children, heading, quote }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="relative h-56 shrink-0 overflow-hidden sm:h-64 lg:hidden">
        <AuthImage />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />
        <div className="relative z-10 flex items-center justify-between px-5 pt-5">
          <BackLink />
          <Brand className="text-lg" />
        </div>
      </div>

      <aside className="relative hidden flex-col overflow-hidden lg:flex lg:w-[38%] xl:w-[35%]">
        <AuthImage />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
        <div className="auth-image-overlay" />
        <div className="relative z-10 p-8">
          <Link to="/landing" aria-label="Volver al inicio">
            <Brand className="text-xl" />
          </Link>
        </div>
        <div className="relative z-10 mt-auto p-8 pb-10">
          <blockquote className="auth-quote mb-5 text-2xl leading-snug text-white xl:text-3xl">
            “{quote}”
          </blockquote>
          <p className="text-[15px] font-semibold text-white">{appConfig.team.testimonialAuthor}</p>
          <p className="text-[13px] text-white/70">{appConfig.team.testimonialRole} — {appConfig.team.name}</p>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center px-6 pb-12 pt-4 lg:py-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 text-center">
              <h1 className="auth-heading">{heading}</h1>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

function AuthImage() {
  return (
    <div
      className="absolute inset-0 bg-ink bg-cover bg-center"
      style={{ backgroundImage: `url('${panelImg}')` }}
    />
  )
}

function BackLink() {
  return (
    <Link to="/landing" className="flex items-center gap-1.5 text-sm font-semibold text-white drop-shadow">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Volver
    </Link>
  )
}

function Brand({ className }: { className: string }) {
  return (
    <span className={`auth-brand select-none border-2 border-white px-2 py-0.5 leading-none tracking-tight text-white ${className}`}>
      {appConfig.name}
    </span>
  )
}
