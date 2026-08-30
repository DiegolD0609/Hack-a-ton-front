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

function studioResponse(conversationId: string, label: string, reason: string): Response {
  return jsonResponse({
    conversationId,
    schemaVersion: '1',
    generatedBy: 'llm',
    reason,
    layout: layout(label),
  })
}

function projectSummary(projectId: string, name: string) {
  return { projectId, name, createdAt: NOW, updatedAt: NOW }
}

function projectDetail(projectId: string, name: string, prompt: string, label: string, reason: string) {
  return {
    ...projectSummary(projectId, name),
    messages: [
      { role: 'user', content: prompt, layout: null, createdAt: NOW },
      { role: 'assistant', content: reason, layout: layout(label), createdAt: NOW },
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
        projectDetail('conv_alpha', 'Landing', 'Create a landing CTA', 'Landing action', 'Landing reasoning'),
      ))
      .mockResolvedValueOnce(jsonResponse(
        projectDetail('conv_beta', 'Account settings', 'Create security settings', 'Security action', 'Security reasoning'),
      ))
    vi.stubGlobal('fetch', request)
    render(<Studio />)

    expect(await screen.findByRole('button', { name: 'Landing action' })).toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: /Create a landing CTA/ })).toBeInTheDocument()

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
