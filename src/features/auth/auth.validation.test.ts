import { describe, expect, it } from 'vitest'
import { validateLogin, validateRegister } from './auth.validation'

describe('auth validation', () => {
  it('rejects an invalid login email', () => {
    expect(validateLogin('correo-invalido', 'corta')).toEqual({
      email: 'Ingresa un correo válido.',
      password: 'Usa al menos 8 caracteres.',
    })
  })

  it('accepts a valid login email', () => {
    expect(validateLogin('alex@example.com', 'password123')).toEqual({})
  })

  it('validates registration name and terms', () => {
    const errors = validateRegister({
      name: 'A',
      email: 'alex@example.com',
      password: 'password123',
      confirmPassword: 'different123',
      acceptedTerms: false,
    })

    expect(errors.name).toBeTruthy()
    expect(errors.confirmPassword).toBeTruthy()
    expect(errors.terms).toBeTruthy()
  })
})
