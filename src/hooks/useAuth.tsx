import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { authService, clearStoredUser, loadStoredUser, storeUser } from '@/features/auth'
import type { User } from '@/features/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser)

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const authenticatedUser = await authService.login({ email, password })
    storeUser(authenticatedUser, remember)
    setUser(authenticatedUser)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const authenticatedUser = await authService.register({ name, email, password })
    storeUser(authenticatedUser, true)
    setUser(authenticatedUser)
  }, [])

  const logout = useCallback(() => {
    clearStoredUser()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
