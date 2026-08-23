import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthField, AuthLayout, AuthToggle } from '@/components/auth'
import { validateRegister } from '@/features/auth'
import type { FieldErrors, RegisterField } from '@/features/auth'
import { useAuth } from '@/hooks/useAuth'
import { appConfig } from '@/config/app'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [errors, setErrors] = useState<FieldErrors<RegisterField>>({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validateRegister({ name, email, acceptedTerms })
    setErrors(nextErrors)
    setFormError('')

    if (Object.keys(nextErrors).length > 0) return

    try {
      setIsSubmitting(true)
      await register(name.trim(), email.trim())
      navigate('/dashboard')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No fue posible crear tu cuenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      heading={`Crea tu cuenta en ${appConfig.name}`}
      quote="Pasamos de reaccionar tarde a anticipar cada excepción de la operación."
    >
      <form onSubmit={handleSubmit} noValidate>
        <AuthField
          id="register-name"
          type="text"
          autoComplete="name"
          required
          label="Nombre completo"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          placeholder="Tu nombre"
        />
        <AuthField
          id="register-email"
          type="email"
          autoComplete="email"
          required
          label="Correo electrónico"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          placeholder="tu@correo.com"
        />

        <AuthToggle
          ariaLabel="Aceptar términos y condiciones"
          checked={acceptedTerms}
          label={<>Acepto los <Link to={appConfig.routes.terms} className="auth-link">términos y condiciones</Link></>}
          onChange={setAcceptedTerms}
          error={errors.terms}
        />

        {formError && <p role="alert" aria-live="polite" className="mb-4 text-sm font-medium text-primary">{formError}</p>}

        <button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="text-center text-[13px] text-content-muted">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="auth-link">Inicia sesión</Link>
      </p>
    </AuthLayout>
  )
}
