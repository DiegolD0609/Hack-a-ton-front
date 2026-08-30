import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import StudioCanvas from './StudioCanvas'

describe('StudioCanvas JSON menu', () => {
  it('copies the visible layout JSON', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const layout = {
      id: 'ui_page',
      type: 'page',
      props: { title: 'Título omitido' },
      children: [
        { id: 'ui_button', type: 'button', props: { label: 'Aceptar', variant: 'primary', size: 'md' } },
      ],
    }

    render(
      <StudioCanvas
        response={{ generatedBy: 'llm', reason: 'Sugerencia', layout }}
        isBuilding={false}
        iterationId={1}
      />,
    )

    expect(screen.queryByRole('heading', { name: 'Título omitido' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver estructura' }))
    fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(JSON.stringify(layout, null, 2)))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })
})
