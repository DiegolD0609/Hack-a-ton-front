import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StudioRequest } from '@/studio/api'
import Studio from './Studio'

function studioResponse(conversationId: string, label: string, reason: string): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      conversationId,
      schemaVersion: '1',
      generatedBy: 'llm',
      reason,
      layout: {
        id: `page_${label}`,
        type: 'page',
        props: {},
        children: [
          {
            id: `button_${label}`,
            type: 'button',
            props: { label, variant: 'primary', size: 'md' },
          },
        ],
      },
    }),
  } as Response
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

describe('Studio conversation memory', () => {
  it('continues one backend conversation and starts another from the root', async () => {
    const request = vi.fn<StudioRequest>()
      .mockResolvedValueOnce(studioResponse('conv_alpha', 'First action', 'First ready'))
      .mockResolvedValueOnce(studioResponse('conv_alpha', 'Second action', 'Second ready'))
      .mockResolvedValueOnce(studioResponse('conv_alpha', 'Latest action', 'Latest ready'))
      .mockResolvedValueOnce(studioResponse('conv_beta', 'Independent action', 'New chat ready'))
    vi.stubGlobal('fetch', request)
    render(<Studio />)

    generate('Crea un botón')
    expect(await screen.findByRole('button', { name: 'First action' })).toBeInTheDocument()

    generate('Ahora agrega otro')
    expect(await screen.findByRole('button', { name: 'Second action' })).toBeInTheDocument()

    expect(JSON.parse(String(request.mock.calls[0][1].body))).toEqual({
      prompt: 'Crea un botón',
    })
    expect(JSON.parse(String(request.mock.calls[1][1].body))).toEqual({
      prompt: 'Ahora agrega otro',
      conversationId: 'conv_alpha',
    })
    expect(screen.getByRole('treeitem', { name: /Ahora agrega otro/ })).toHaveAttribute('aria-level', '3')

    fireEvent.click(screen.getByRole('treeitem', { name: /Crea un botón/ }))
    generate('Continúa esta conversación')
    expect(await screen.findByRole('button', { name: 'Latest action' })).toBeInTheDocument()

    expect(JSON.parse(String(request.mock.calls[2][1].body))).toEqual({
      prompt: 'Continúa esta conversación',
      conversationId: 'conv_alpha',
    })
    expect(screen.getByRole('treeitem', { name: /Continúa esta conversación/ }))
      .toHaveAttribute('aria-level', '4')

    fireEvent.click(screen.getByRole('treeitem', { name: /Start state/ }))
    generate('Crea una interfaz independiente')
    expect(await screen.findByRole('button', { name: 'Independent action' })).toBeInTheDocument()

    expect(JSON.parse(String(request.mock.calls[3][1].body))).toEqual({
      prompt: 'Crea una interfaz independiente',
    })
    expect(screen.getByRole('treeitem', { name: /Crea una interfaz independiente/ }))
      .toHaveAttribute('aria-level', '2')
  })

  it('starts a new conversation when the backend forgets the selected one', async () => {
    const request = vi.fn<StudioRequest>()
      .mockResolvedValueOnce(studioResponse('conv_expired', 'Original action', 'Original ready'))
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Conversación no existe' }),
      } as Response)
      .mockResolvedValueOnce(studioResponse('conv_recovered', 'Recovered action', 'New chat ready'))
    vi.stubGlobal('fetch', request)
    render(<Studio />)

    generate('Crea una acción')
    expect(await screen.findByRole('button', { name: 'Original action' })).toBeInTheDocument()

    generate('Continúa el chat')
    expect(await screen.findByRole('button', { name: 'Recovered action' })).toBeInTheDocument()

    await waitFor(() => expect(request).toHaveBeenCalledTimes(3))
    expect(JSON.parse(String(request.mock.calls[1][1].body))).toEqual({
      prompt: 'Continúa el chat',
      conversationId: 'conv_expired',
    })
    expect(JSON.parse(String(request.mock.calls[2][1].body))).toEqual({
      prompt: 'Continúa el chat',
    })
    expect(screen.getByRole('treeitem', { name: /Continúa el chat/ })).toHaveAttribute('aria-level', '2')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
