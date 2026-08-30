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

    await expect(generateStudioUI('/api', '  Haz exclusivamente dos botones  ', null, request))
      .resolves.toBe(response)

    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][0]).toMatch(/\/api\/studio\/generate$/)
    expect(request.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Haz exclusivamente dos botones' }),
    })
  })

  it('continues a conversation without resending history or layout', async () => {
    const request = vi.fn<StudioRequest>().mockResolvedValue(jsonResponse({ generatedBy: 'llm' }))

    await generateStudioUI('/api', 'Ahora apílalos', 'conv_example', request)

    expect(JSON.parse(String(request.mock.calls[0][1].body))).toEqual({
      prompt: 'Ahora apílalos',
      conversationId: 'conv_example',
    })
  })

  it('surfaces the backend error without falling back to a run', async () => {
    const request = vi.fn<StudioRequest>().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Prompt inválido' }),
    } as Response)

    await expect(generateStudioUI('/api', 'dos botones', null, request))
      .rejects.toMatchObject({ message: 'Prompt inválido', status: 422 })
    expect(request).toHaveBeenCalledTimes(1)
  })
})
