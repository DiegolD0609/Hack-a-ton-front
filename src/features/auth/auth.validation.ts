import type { FieldErrors } from './auth.types'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type LoginField = 'email'
export type RegisterField = 'name' | 'email' | 'terms'

export function validateLogin(email: string): FieldErrors<LoginField> {
  const errors: FieldErrors<LoginField> = {}

  if (!emailPattern.test(email.trim())) errors.email = 'Ingresa un correo válido.'

  return errors
}

export function validateRegister(input: {
  name: string
  email: string
  acceptedTerms: boolean
}): FieldErrors<RegisterField> {
  const errors: FieldErrors<RegisterField> = validateLogin(input.email) as FieldErrors<RegisterField>

  if (input.name.trim().length < 2) errors.name = 'Ingresa tu nombre completo.'
  if (!input.acceptedTerms) errors.terms = 'Debes aceptar los términos y condiciones.'

  return errors
}
