import { describe, expect, it, vi } from 'vitest'
import { generateStudioUI, type StudioRequest } from './api'

function jsonResponse(payload: unknown): Response {
  return { ok: true, json: async () => payload } as Response
}

describe('standalone Studio API', () => {
  it('sends one literal prompt directly to /studio/generate', async () => {
    const response = {
      generatedBy: 'llm',
      reason: 'Dos botones.',
      layout: { id: 'ui_page', type: 'page', props: { title: 'Botones' }, children: [] },
    }
    const request = vi.fn<StudioRequest>().mockResolvedValue(jsonResponse(response))

    await expect(generateStudioUI('/api', '  Haz exclusivamente dos botones  ', {}, request))
      .resolves.toBe(response)

    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][0]).toMatch(/\/api\/studio\/generate$/)
    expect(request.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Haz exclusivamente dos botones', history: [] }),
    })
  })

  it('resends the selected branch history and previous layout', async () => {
    const request = vi.fn<StudioRequest>().mockResolvedValue(jsonResponse({ generatedBy: 'llm' }))
    const previousLayout = { id: 'ui_page', type: 'page', props: { title: 'Anterior' }, children: [] }
    const history = [
      { role: 'user' as const, content: 'Crea dos botones' },
      { role: 'assistant' as const, content: 'Dos botones alineados.' },
    ]

    await generateStudioUI('/api', 'Ahora apílalos', { history, previousLayout }, request)

    expect(JSON.parse(String(request.mock.calls[0][1].body))).toEqual({
      prompt: 'Ahora apílalos',
      history,
      previousLayout,
    })
  })

  it('surfaces the backend error without falling back to a run', async () => {
    const request = vi.fn<StudioRequest>().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Prompt inválido' }),
    } as Response)

    await expect(generateStudioUI('/api', 'dos botones', {}, request))
      .rejects.toThrow('Prompt inválido')
    expect(request).toHaveBeenCalledTimes(1)
  })
})
