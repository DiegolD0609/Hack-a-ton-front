import { describe, expect, it } from 'vitest'
import { validateLogin, validateRegister } from './auth.validation'

describe('auth validation', () => {
  it('rejects an invalid login email', () => {
    expect(validateLogin('correo-invalido')).toEqual({
      email: 'Ingresa un correo válido.',
    })
  })

  it('accepts a valid login email', () => {
    expect(validateLogin('alex@example.com')).toEqual({})
  })

  it('validates registration name and terms', () => {
    const errors = validateRegister({
      name: 'A',
      email: 'alex@example.com',
      acceptedTerms: false,
    })

    expect(errors.name).toBeTruthy()
    expect(errors.terms).toBeTruthy()
  })
})
