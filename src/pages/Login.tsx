import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthField, AuthLayout, AuthToggle, PasswordField, SocialAuthButtons } from '@/components/auth'
import { validateLogin } from '@/features/auth'
import type { FieldErrors, LoginField } from '@/features/auth'
import { useAuth } from '@/hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<FieldErrors<LoginField>>({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validateLogin(email, password)
    setErrors(nextErrors)
    setFormError('')

    if (Object.keys(nextErrors).length > 0) return

    try {
      setIsSubmitting(true)
      await login(email.trim(), password, remember)
      navigate('/dashboard')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No fue posible iniciar sesión.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      heading="Bienvenido de vuelta a Kernel Panic"
      quote="La plataforma que mi equipo y yo necesitábamos para crecer."
    >
      <form onSubmit={handleSubmit} noValidate>
        <AuthField
          id="login-email"
          type="email"
          autoComplete="email"
          required
          label="Correo electrónico"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          placeholder="tu@correo.com"
        />
        <PasswordField
          id="login-password"
          autoComplete="current-password"
          required
          label="Contraseña"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          placeholder="••••••••"
        />

        <div className="mb-5">
          <button type="button" className="auth-link text-[13px]">¿Olvidaste tu contraseña?</button>
        </div>

        <AuthToggle checked={remember} label="Recordar mis datos de acceso" onChange={setRemember} />

        {formError && <p role="alert" aria-live="polite" className="mb-4 text-sm font-medium text-primary">{formError}</p>}

        <button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>
      </form>

      <SocialAuthButtons action="Iniciar sesión" />

      <p className="text-center text-[13px] text-content-muted">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="auth-link">Regístrate aquí</Link>
      </p>
    </AuthLayout>
  )
}
