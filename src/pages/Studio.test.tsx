import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StudioRequest } from '@/studio/api'
import Studio from './Studio'

const NOW = '2026-08-30T12:00:00Z'

function layout(label: string) {
  return {
    id: `page_${label}`,
    type: 'page',
    props: {},
    children: [{
      id: `button_${label}`,
      type: 'button',
      props: { label, variant: 'primary', size: 'md' },
    }],
  }
}

function jsonResponse(payload: unknown): Response {
  return { ok: true, status: 200, json: async () => payload } as Response
}

function studioResponse(conversationId: string, label: string, reason: string, suggestion: string | null = null): Response {
  return jsonResponse({
    conversationId,
    schemaVersion: '1',
    generatedBy: 'llm',
    reason,
    suggestion,
    layout: layout(label),
  })
}

function projectSummary(projectId: string, name: string) {
  return { projectId, name, createdAt: NOW, updatedAt: NOW }
}

function projectDetail(
  projectId: string,
  name: string,
  prompt: string,
  label: string,
  reason: string,
  suggestion: string | null = null,
) {
  return {
    ...projectSummary(projectId, name),
    messages: [
      { role: 'user', content: prompt, layout: null, createdAt: NOW },
      { role: 'assistant', content: reason, suggestion, layout: layout(label), createdAt: NOW },
    ],
  }
}

function generate(prompt: string) {
  fireEvent.change(screen.getByRole('textbox', { name: 'Instrucción exacta para el API' }), {
    target: { value: prompt },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Generar UI' }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Studio server projects', () => {
  it('loads project history from the backend and switches projects on demand', async () => {
    const request = vi.fn<StudioRequest>()
      .mockResolvedValueOnce(jsonResponse([
        projectSummary('conv_alpha', 'Landing'),
        projectSummary('conv_beta', 'Account settings'),
      ]))
      .mockResolvedValueOnce(jsonResponse(
        projectDetail(
          'conv_alpha',
          'Landing',
          'Create a landing CTA',
          'Landing action',
          'Landing reasoning',
          'Keep related calls to action in one horizontal group.',
        ),
      ))
      .mockResolvedValueOnce(jsonResponse(
        projectDetail('conv_beta', 'Account settings', 'Create security settings', 'Security action', 'Security reasoning'),
      ))
    vi.stubGlobal('fetch', request)
    render(<Studio />)

    expect(await screen.findByRole('button', { name: 'Landing action' })).toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: /Create a landing CTA/ })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'UX suggestion' }))
      .toHaveTextContent('Keep related calls to action in one horizontal group.')
    expect(screen.getByText('Landing reasoning', { selector: '.studio-output-reason p' })).toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox', { name: 'Cambiar proyecto' }), {
      target: { value: 'conv_beta' },
    })

    expect(await screen.findByRole('button', { name: 'Security action' })).toBeInTheDocument()
    expect(screen.getByText('Security reasoning', { selector: '.studio-history-turn > span:last-child' }))
      .toBeInTheDocument()
    expect(request.mock.calls[0][0]).toMatch(/\/studio\/projects$/)
    expect(request.mock.calls[1][0]).toMatch(/\/studio\/projects\/conv_alpha$/)
    expect(request.mock.calls[2][0]).toMatch(/\/studio\/projects\/conv_beta$/)
    expect(localStorage.getItem('kernel-panic.studio.workspace.v1')).toBeNull()
  })

  it('creates a named project with the first generation and restores it from the backend after reload', async () => {
    const request = vi.fn<StudioRequest>()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(studioResponse('conv_dashboard', 'Dashboard action', 'Dashboard reasoning'))
      .mockResolvedValueOnce(jsonResponse([projectSummary('conv_dashboard', 'Dashboard B')]))
      .mockResolvedValueOnce(jsonResponse(
        projectDetail(
          'conv_dashboard',
          'Dashboard B',
          'Prompt for dashboard B',
          'Dashboard action',
          'Dashboard reasoning',
        ),
      ))
    vi.stubGlobal('fetch', request)
    localStorage.setItem('kernel-panic.studio.workspace.v1', '{"legacy":true}')
    const { unmount } = render(<Studio />)
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: 'Crear nuevo proyecto' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Project name' }), {
      target: { value: 'Dashboard B' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }))
    generate('Prompt for dashboard B')

    expect(await screen.findByRole('button', { name: 'Dashboard action' })).toBeInTheDocument()
    expect(JSON.parse(String(request.mock.calls[1][1].body))).toEqual({
      prompt: 'Prompt for dashboard B',
      name: 'Dashboard B',
    })
    expect(screen.getByRole('combobox', { name: 'Cambiar proyecto' })).toHaveDisplayValue('Dashboard B')
    expect(localStorage.getItem('kernel-panic.studio.workspace.v1')).toBeNull()

    unmount()
    render(<Studio />)

    expect(await screen.findByRole('button', { name: 'Dashboard action' })).toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: /Prompt for dashboard B/ })).toBeInTheDocument()
    expect(request.mock.calls[2][0]).toMatch(/\/studio\/projects$/)
    expect(request.mock.calls[3][0]).toMatch(/\/studio\/projects\/conv_dashboard$/)
  })

  it('renames a draft before its first generation and persists that name through generate', async () => {
    const request = vi.fn<StudioRequest>()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(studioResponse('conv_renamed', 'Renamed action', 'Renamed project ready'))
    vi.stubGlobal('fetch', request)
    render(<Studio />)
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: 'Renombrar proyecto' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Project name' }), {
      target: { value: '  Renamed draft  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save name' }))

    expect(screen.getByRole('combobox', { name: 'Cambiar proyecto' }))
      .toHaveDisplayValue('Renamed draft · draft')

    generate('Create the renamed project')
    expect(await screen.findByRole('button', { name: 'Renamed action' })).toBeInTheDocument()
    expect(JSON.parse(String(request.mock.calls[1][1].body))).toEqual({
      prompt: 'Create the renamed project',
      name: 'Renamed draft',
    })
    expect(screen.getByRole('button', { name: 'Renombrar proyecto' })).toBeDisabled()
  })

  it('deletes an unsaved draft after confirmation without calling the backend', async () => {
    const request = vi.fn<StudioRequest>().mockResolvedValueOnce(jsonResponse([]))
    vi.stubGlobal('fetch', request)
    render(<Studio />)
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))

    fireEvent.change(screen.getByRole('textbox', { name: 'Instrucción exacta para el API' }), {
      target: { value: 'Keep this draft' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Crear nuevo proyecto' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Project name' }), {
      target: { value: 'Temporary draft' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }))

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar proyecto' }))
    expect(screen.getByRole('dialog', { name: 'Eliminar proyecto' })).toHaveTextContent('Temporary draft')
    fireEvent.click(screen.getByRole('button', { name: 'Delete draft' }))

    expect(screen.getByRole('combobox', { name: 'Cambiar proyecto' }))
      .toHaveDisplayValue('UI Project 1 · draft')
    expect(screen.getByRole('textbox', { name: 'Instrucción exacta para el API' })).toHaveValue('Keep this draft')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('sends non-blocking project feedback for the selected completed iteration', async () => {
    const request = vi.fn<StudioRequest>()
      .mockResolvedValueOnce(jsonResponse([projectSummary('conv_alpha', 'Landing')]))
      .mockResolvedValueOnce(jsonResponse(
        projectDetail('conv_alpha', 'Landing', 'Create a landing CTA', 'Landing action', 'Landing reasoning'),
      ))
      .mockResolvedValueOnce({ ok: true, status: 204 } as Response)
    vi.stubGlobal('fetch', request)
    render(<Studio />)

    expect(await screen.findByRole('heading', { name: 'Rate Landing after iteration 01' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Works well' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Comentario de feedback' }), {
      target: { value: 'Keep this hierarchy.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }))

    expect(screen.getByRole('textbox', { name: 'Instrucción exacta para el API' })).toBeEnabled()
    expect(await screen.findByText('Feedback saved. It will guide the next iteration.')).toBeInTheDocument()
    expect(request.mock.calls[2][0]).toMatch(/\/studio\/projects\/conv_alpha\/feedback$/)
    expect(JSON.parse(String(request.mock.calls[2][1].body))).toEqual({
      score: 5,
      comment: 'Keep this hierarchy.',
    })
  })

  it('recreates a missing project with its name after a stale conversation 404', async () => {
    const request = vi.fn<StudioRequest>()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(studioResponse('conv_expired', 'Original action', 'Original ready'))
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Conversación no existe' }),
      } as Response)
      .mockResolvedValueOnce(studioResponse('conv_recovered', 'Recovered action', 'New project ready'))
    vi.stubGlobal('fetch', request)
    render(<Studio />)
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))

    generate('Crea una acción')
    expect(await screen.findByRole('button', { name: 'Original action' })).toBeInTheDocument()
    generate('Continúa el proyecto')
    expect(await screen.findByRole('button', { name: 'Recovered action' })).toBeInTheDocument()

    expect(JSON.parse(String(request.mock.calls[2][1].body))).toEqual({
      prompt: 'Continúa el proyecto',
      conversationId: 'conv_expired',
    })
    expect(JSON.parse(String(request.mock.calls[3][1].body))).toEqual({
      prompt: 'Continúa el proyecto',
      name: 'UI Project 1',
    })
    expect(screen.getByRole('treeitem', { name: /Continúa el proyecto/ })).toHaveAttribute('aria-level', '2')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
