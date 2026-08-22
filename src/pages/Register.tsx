import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import panelImg from '@/utils/public/rafa-login.jpg'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [passRaw, setPassRaw] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await register(name, email, passRaw)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* ── MOBILE HERO IMAGE ── */}
      <div className="lg:hidden relative h-56 sm:h-64 flex-shrink-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-[#1a0a3a]"
          style={{ backgroundImage: `url('${panelImg}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
        <div className="relative z-10 flex items-center justify-between px-5 pt-5">
          <Link to="/landing" className="flex items-center gap-1.5 text-white text-sm font-semibold drop-shadow">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
          <span
            className="font-black text-white border-2 border-white px-2 py-0.5 text-lg leading-none tracking-tight"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Kernel Panic
          </span>
        </div>
      </div>

      {/* ── LEFT PANEL (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[38%] xl:w-[35%] relative flex-col overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${panelImg}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
        <div className="absolute inset-0 bg-[#1a0a3a]/40" />
        <div className="relative z-10 p-8">
          <Link to="/landing" className="flex items-center gap-3 group">
            <span
              className="font-black text-white border-2 border-white px-2 py-0.5 text-xl leading-none tracking-tight select-none"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Kernel Panic
            </span>
          </Link>
        </div>
        <div className="relative z-10 mt-auto p-8 pb-10">
          <blockquote
            className="text-white font-bold text-2xl xl:text-3xl leading-snug mb-5"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            "Empece a invertir sin complicaciones desde el primer dia."
          </blockquote>
          <div>
            <p className="text-white font-semibold text-[15px]">Karmadesu</p>
            <p className="text-white/60 text-[13px]">Desarrollador — Kernel Panic</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 pt-4 pb-12 lg:py-12">
          <div className="w-full max-w-[420px]">
            {/* Heading */}
            <div className="text-center mb-8">
              <h1
                className="font-bold text-[#0a0a0f] text-[28px] sm:text-[32px] mb-2 leading-tight"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Crea tu cuenta en Kernel Panic
              </h1>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Name field */}
              <div className="mb-4">
                <label className="block text-[#888899] text-xs font-medium mb-1.5 ml-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[#e0e0ee] rounded-xl px-4 py-3.5 text-[#0a0a0f] text-[15px] bg-white outline-none focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/15 transition-all placeholder:text-[#c0c0d0]"
                  placeholder="Tu nombre"
                />
              </div>

              {/* Email field */}
              <div className="mb-4">
                <label className="block text-[#888899] text-xs font-medium mb-1.5 ml-1">
                  Correo electronico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#e0e0ee] rounded-xl px-4 py-3.5 text-[#0a0a0f] text-[15px] bg-white outline-none focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/15 transition-all placeholder:text-[#c0c0d0]"
                  placeholder="tu@correo.com"
                />
              </div>

              {/* Password field */}
              <div className="mb-4">
                <label className="block text-[#888899] text-xs font-medium mb-1.5 ml-1">
                  Contrasena
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={passRaw}
                    onChange={(e) => setPassRaw(e.target.value)}
                    className="w-full border border-[#e0e0ee] rounded-xl px-4 py-3.5 text-[#0a0a0f] text-[15px] bg-white outline-none focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/15 pr-12 transition-all placeholder:text-[#c0c0d0]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#aaaacc] hover:text-[#6c63ff] transition-colors"
                    aria-label={showPass ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  >
                    {showPass ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password field */}
              <div className="mb-5">
                <label className="block text-[#888899] text-xs font-medium mb-1.5 ml-1">
                  Confirmar contrasena
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full border border-[#e0e0ee] rounded-xl px-4 py-3.5 text-[#0a0a0f] text-[15px] bg-white outline-none focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/15 pr-12 transition-all placeholder:text-[#c0c0d0]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#aaaacc] hover:text-[#6c63ff] transition-colors"
                    aria-label={showConfirm ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  >
                    {showConfirm ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Terms toggle */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-[#555566] text-[14px]">Acepto los terminos y condiciones</span>
                <button
                  type="button"
                  onClick={() => setAcceptTerms(!acceptTerms)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#6c63ff]/30 ${
                    acceptTerms ? 'bg-[#6c63ff]' : 'bg-[#d0d0e0]'
                  }`}
                  role="switch"
                  aria-checked={acceptTerms}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      acceptTerms ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Register button */}
              <button
                type="submit"
                className="w-full bg-[#6c63ff] hover:bg-[#5b54e8] active:scale-[0.99] text-white font-bold py-4 rounded-xl text-[15px] transition-all duration-200 shadow-md shadow-[#6c63ff]/20 mb-5"
              >
                Crear cuenta
              </button>
            </form>

            {/* OR divider */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1 h-px bg-[#e8e8f0]" />
              <span className="text-[#aaaacc] text-[13px] font-medium">O</span>
              <div className="flex-1 h-px bg-[#e8e8f0]" />
            </div>

            {/* Google button */}
            <button className="w-full flex items-center justify-center gap-3 border border-[#e0e0ee] hover:border-[#c0c0d0] hover:bg-[#fafafa] text-[#0a0a0f] font-medium py-3.5 rounded-xl text-[14px] transition-all mb-4">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Registrarse con Google
            </button>

            {/* Apple button (mobile only) */}
            <button className="sm:hidden w-full flex items-center justify-center gap-3 border border-[#e0e0ee] hover:border-[#c0c0d0] hover:bg-[#fafafa] text-[#0a0a0f] font-medium py-3.5 rounded-xl text-[14px] transition-all mb-4">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.07c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.32zM12.03 7c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Registrarse con Apple
            </button>

            {/* Sign in link */}
            <p className="text-center text-[#888899] text-[13px]">
              Ya tienes cuenta?{' '}
              <Link to="/login" className="text-[#6c63ff] font-semibold hover:text-[#5b54e8] transition-colors">
                Inicia sesion
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
