import type { User } from '@/features/auth'

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

/**
 * Crea un usuario nuevo en el backend (POST /users/) y lo devuelve.
 * No se envía contraseña: el backend todavía no maneja autenticación real,
 * solo el registro/lookup de usuarios por nombre y correo.
 */
export async function registerUser(name: string, email: string): Promise<User> {
  const base = requireApiUrl()

  const response = await fetch(`${base}/users_test/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json() as Promise<User>
}

/**
 * Busca el correo en la tabla test_users (POST /users_test/login). No hay
 * verificación de contraseña: si el correo existe ahí, se acepta el login.
 *
 * OJO: esta tabla es independiente de /users/, donde registerUser() crea
 * las cuentas nuevas. Un usuario recién registrado NO podrá iniciar sesión
 * aquí a menos que también exista en test_users (por ejemplo, uno de los
 * cinco usuarios sembrados al arrancar el backend: alice/bob/charlie/diana/
 * evan@hackathon.com, o uno creado a mano vía POST /users_test/).
 */
export async function loginUser(email: string): Promise<User> {
  const base = requireApiUrl()

  const response = await fetch(`${base}/users_test/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim() }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No encontramos una cuenta con ese correo.')
    }
    throw new Error(await parseErrorMessage(response))
  }

  return response.json() as Promise<User>
}
