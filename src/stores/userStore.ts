import type { LoginInput, RegisterInput, User } from '@/features/auth'

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

function requireApiUrl(): string {
  if (!apiUrl) {
    throw new Error('VITE_API_URL no está configurada.')
  }
  return apiUrl
}

async function parseErrorMessage(response: Response): Promise<string> {
  // FastAPI devuelve errores como { "detail": "..." }; algunos backends usan { "message": "..." }.
  const payload = await response.json().catch(() => null) as { detail?: string; message?: string } | null
  return payload?.detail ?? payload?.message ?? 'No fue posible completar la solicitud.'
}

async function authRequest(path: string, body: LoginInput | RegisterInput): Promise<User> {
  const base = requireApiUrl()

  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json() as Promise<User>
}

export function registerUser(name: string, email: string, password: string): Promise<User> {
  return authRequest('/auth/register', { name, email, password })
}

export function loginUser(email: string, password: string): Promise<User> {
  return authRequest('/auth/login', { email, password })
}
