import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StudioRenderer, { studioResponseMeta } from './StudioRenderer'

describe('contract-free Studio renderer', () => {
  it('keeps the proactive suggestion separate from the generation reason', () => {
    expect(studioResponseMeta({
      conversationId: 'conv_example',
      generatedBy: 'llm',
      reason: 'Built two related actions.',
      suggestion: 'Related actions usually scan better side by side.',
      layout: { id: 'ui_page', type: 'page', props: {}, children: [] },
    })).toMatchObject({
      reason: 'Built two related actions.',
      suggestion: 'Related actions usually scan better side by side.',
    })
  })

  it('renders the standalone layout returned by the API', () => {
    render(
      <StudioRenderer
        response={{
          generatedBy: 'llm',
          layout: {
            id: 'ui_page',
            type: 'page',
            props: { title: 'Acciones' },
            children: [
              {
                id: 'ui_row',
                type: 'section',
                props: { direction: 'row', gap: 'md', align: 'center', justify: 'start' },
                children: [
                  { id: 'ui_accept', type: 'button', props: { label: 'Aceptar', variant: 'primary', size: 'md' } },
                  { id: 'ui_cancel', type: 'button', props: { label: 'Cancelar', variant: 'secondary', size: 'md' } },
                ],
              },
            ],
          },
        }}
      />,
    )

    expect(screen.queryByRole('heading', { name: 'Acciones' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })
})
