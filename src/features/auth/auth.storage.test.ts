import { describe, expect, it } from 'vitest'
import { clearStoredUser, loadStoredUser, storeUser } from './auth.storage'

const user = { name: 'Alex', email: 'alex@example.com' }

describe('auth storage', () => {
  it('persists remembered users in local storage', () => {
    storeUser(user, true)
    expect(localStorage.length).toBe(1)
    expect(sessionStorage.length).toBe(0)
    expect(loadStoredUser()).toEqual(user)
  })

  it('uses session storage when remember is disabled', () => {
    storeUser(user, false)
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(1)
    expect(loadStoredUser()).toEqual(user)
  })

  it('clears both storage strategies', () => {
    storeUser(user, true)
    clearStoredUser()
    expect(loadStoredUser()).toBeNull()
  })
})
