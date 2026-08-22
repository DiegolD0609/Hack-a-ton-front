import type { User } from './auth.types'

const sessionKey = 'kernel-panic:user'

export function loadStoredUser(): User | null {
  const rawUser = localStorage.getItem(sessionKey) ?? sessionStorage.getItem(sessionKey)
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser) as User
  } catch {
    clearStoredUser()
    return null
  }
}

export function storeUser(user: User, remember: boolean) {
  clearStoredUser()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(sessionKey, JSON.stringify(user))
}

export function clearStoredUser() {
  localStorage.removeItem(sessionKey)
  sessionStorage.removeItem(sessionKey)
}
