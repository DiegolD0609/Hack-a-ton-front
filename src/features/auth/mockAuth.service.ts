import type { AuthService } from './auth.types'

export const mockAuthService: AuthService = {
  async login({ email, password }) {
    void password
    return { name: email.split('@')[0], email }
  },

  async register({ name, email, password }) {
    void password
    return { name, email }
  },
}
