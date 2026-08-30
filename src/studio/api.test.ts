import { describe, expect, it, vi } from 'vitest'
import {
  generateStudioUI,
  getStudioProject,
  listStudioProjects,
  submitStudioProjectFeedback,
  deleteStudioProject,
  type StudioRequest,
} from './api'

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

    await expect(generateStudioUI('/api', '  Haz exclusivamente dos botones  ', { name: 'Landing v1' }, request))
      .resolves.toBe(response)

    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][0]).toMatch(/\/api\/studio\/generate$/)
    expect(request.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Haz exclusivamente dos botones', name: 'Landing v1' }),
    })
  })

  it('continues a conversation without resending history or layout', async () => {
    const request = vi.fn<StudioRequest>().mockResolvedValue(jsonResponse({ generatedBy: 'llm' }))

    await generateStudioUI('/api', 'Ahora apílalos', { conversationId: 'conv_example', name: 'Ignored' }, request)

    expect(JSON.parse(String(request.mock.calls[0][1].body))).toEqual({
      prompt: 'Ahora apílalos',
      conversationId: 'conv_example',
    })
  })

  it('lists projects and reads one complete project', async () => {
    const projects = [{ projectId: 'conv_one', name: 'Landing v1' }]
    const detail = { ...projects[0], messages: [] }
    const request = vi.fn<StudioRequest>()
      .mockResolvedValueOnce(jsonResponse(projects))
      .mockResolvedValueOnce(jsonResponse(detail))

    await expect(listStudioProjects('/api', request)).resolves.toBe(projects)
    await expect(getStudioProject('/api', 'conv_one', request)).resolves.toBe(detail)

    expect(request.mock.calls[0][0]).toMatch(/\/api\/studio\/projects$/)
    expect(request.mock.calls[0][1]).toMatchObject({ method: 'GET' })
    expect(request.mock.calls[1][0]).toMatch(/\/api\/studio\/projects\/conv_one$/)
  })

  it('submits project-level feedback using only score and an optional trimmed comment', async () => {
    const request = vi.fn<StudioRequest>().mockResolvedValue({
      ok: true,
      status: 204,
    } as Response)

    await submitStudioProjectFeedback('/api', 'conv_one', {
      score: 5,
      comment: '  Keep the compact hierarchy.  ',
    }, request)

    expect(request.mock.calls[0][0]).toMatch(/\/api\/studio\/projects\/conv_one\/feedback$/)
    expect(request.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: 5, comment: 'Keep the compact hierarchy.' }),
    })
  })

  it('deletes a saved project with a DELETE request', async () => {
    const request = vi.fn<StudioRequest>().mockResolvedValue({ ok: true, status: 204 } as Response)

    await expect(deleteStudioProject('/api', 'conv_one', request)).resolves.toBeUndefined()

    expect(request.mock.calls[0][0]).toMatch(/\/api\/studio\/projects\/conv_one$/)
    expect(request.mock.calls[0][1]).toMatchObject({ method: 'DELETE' })
  })

  it('surfaces a delete failure as a StudioApiError', async () => {
    const request = vi.fn<StudioRequest>().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ detail: 'Proyecto no existe' }),
    } as Response)

    await expect(deleteStudioProject('/api', 'conv_missing', request))
      .rejects.toMatchObject({ message: 'Proyecto no existe', status: 404 })
  })

  it('rejects an invalid feedback score before calling the backend', async () => {
    const request = vi.fn<StudioRequest>()

    await expect(submitStudioProjectFeedback('/api', 'conv_one', { score: 6 }, request))
      .rejects.toThrow('entero entre 1 y 5')
    expect(request).not.toHaveBeenCalled()
  })

  it('surfaces the backend error without falling back to a run', async () => {
    const request = vi.fn<StudioRequest>().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Prompt inválido' }),
    } as Response)

    await expect(generateStudioUI('/api', 'dos botones', {}, request))
      .rejects.toMatchObject({ message: 'Prompt inválido', status: 422 })
    expect(request).toHaveBeenCalledTimes(1)
  })
})
