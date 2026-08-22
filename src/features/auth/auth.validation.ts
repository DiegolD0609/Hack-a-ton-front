import type { FieldErrors } from './auth.types'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type LoginField = 'email' | 'password'
export type RegisterField = 'name' | 'email' | 'password' | 'confirmPassword' | 'terms'

export function validateLogin(email: string, password: string): FieldErrors<LoginField> {
  const errors: FieldErrors<LoginField> = {}

  if (!emailPattern.test(email.trim())) errors.email = 'Ingresa un correo válido.'
  if (password.length < 8) errors.password = 'Usa al menos 8 caracteres.'

  return errors
}

export function validateRegister(input: {
  name: string
  email: string
  password: string
  confirmPassword: string
  acceptedTerms: boolean
}): FieldErrors<RegisterField> {
  const errors: FieldErrors<RegisterField> = validateLogin(input.email, input.password)

  if (input.name.trim().length < 2) errors.name = 'Ingresa tu nombre completo.'
  if (input.password !== input.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden.'
  if (!input.acceptedTerms) errors.terms = 'Debes aceptar los términos y condiciones.'

  return errors
}
