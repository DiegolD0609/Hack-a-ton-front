import { apiAuthService } from './apiAuth.service'
import { mockAuthService } from './mockAuth.service'

export const authService = import.meta.env.VITE_AUTH_MODE === 'api'
  ? apiAuthService
  : mockAuthService
