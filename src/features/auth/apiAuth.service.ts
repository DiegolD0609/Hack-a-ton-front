import type { AuthService, LoginInput, RegisterInput, User } from './auth.types'

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

async function request(path: string, body: LoginInput | RegisterInput): Promise<User> {
  if (!apiUrl) {
    throw new Error('VITE_API_URL no está configurada.')
  }

  const response = await fetch(`${apiUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(payload?.message ?? 'No fue posible completar la solicitud.')
  }

  return response.json() as Promise<User>
}

export const apiAuthService: AuthService = {
  login: (input) => request('/auth/login', input),
  register: (input) => request('/auth/register', input),
}
