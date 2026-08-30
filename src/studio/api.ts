export type StudioRequest = (url: string, init: RequestInit) => Promise<Response>

function apiEndpoint(apiUrl: string, path: string): string {
  const url = new URL(apiUrl, window.location.origin)
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path}`
  url.search = ''
  return url.toString()
}

async function responseMessage(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null
  return typeof payload?.detail === 'string'
    ? payload.detail
    : `El backend respondió ${response.status}.`
}

/**
 * Sends the user's text directly to the standalone Studio endpoint.
 *
 * The response deliberately remains unknown here: the Studio does not import,
 * mirror, hydrate, or validate the runtime contracts. Its renderer consumes the
 * JSON tree returned by the backend as-is.
 */
export async function generateStudioUI(
  apiUrl: string,
  prompt: string,
  request: StudioRequest = fetch,
): Promise<unknown> {
  const exactPrompt = prompt.trim()
  if (!exactPrompt) throw new Error('El prompt no puede estar vacío.')

  const response = await request(apiEndpoint(apiUrl, '/studio/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: exactPrompt }),
  })

  if (!response.ok) throw new Error(await responseMessage(response))
  return response.json() as Promise<unknown>
}
