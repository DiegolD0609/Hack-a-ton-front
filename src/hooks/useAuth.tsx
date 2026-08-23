import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { clearStoredUser, loadStoredUser, storeUser } from '@/features/auth'
import type { User } from '@/features/auth'
import { loginUser, registerUser } from '@/stores/userStore'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, remember?: boolean) => Promise<void>
  register: (name: string, email: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser)

  const login = useCallback(async (email: string, remember = false) => {
    const authenticatedUser = await loginUser(email)
    storeUser(authenticatedUser, remember)
    setUser(authenticatedUser)
  }, [])

  const register = useCallback(async (name: string, email: string) => {
    const authenticatedUser = await registerUser(name, email)
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
