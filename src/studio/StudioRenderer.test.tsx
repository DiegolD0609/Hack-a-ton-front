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

  it('renders the rich widget types (search, dropdown, chart, table, progress, tags)', () => {
    render(
      <StudioRenderer
        response={{
          generatedBy: 'llm',
          layout: {
            id: 'ui_page',
            type: 'page',
            props: { title: 'Ventas' },
            children: [
              { id: 'ui_search', type: 'searchBar', props: { label: 'Buscar', placeholder: 'Producto…' } },
              {
                id: 'ui_dropdown',
                type: 'dropdown',
                props: {
                  label: 'Región',
                  options: [{ label: 'Norte', value: 'norte' }, { label: 'Sur', value: 'sur' }],
                  selectedValue: 'norte',
                },
              },
              {
                id: 'ui_chart',
                type: 'chart',
                props: {
                  title: 'Ventas mensuales',
                  chartType: 'bar',
                  points: [{ label: 'Ene', value: 10 }, { label: 'Feb', value: 14 }],
                },
              },
              {
                id: 'ui_table',
                type: 'table',
                props: { title: 'Pedidos', columns: ['ID', 'Estado'], rows: [['1', 'ok']] },
              },
              { id: 'ui_progress', type: 'progress', props: { label: 'Meta', value: 62 } },
              {
                id: 'ui_tags',
                type: 'tags',
                props: { items: [{ label: 'nuevo', tone: 'normal' }, { label: 'urgente', tone: 'critical' }] },
              },
            ],
          },
        }}
      />,
    )

    expect(screen.getByPlaceholderText('Producto…')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Ventas mensuales')).toBeInTheDocument()
    expect(screen.getByText('Pedidos')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'ok' })).toBeInTheDocument()
    expect(screen.getByText('62%')).toBeInTheDocument()
    expect(screen.getByText('nuevo')).toBeInTheDocument()
    expect(screen.getByText('urgente')).toBeInTheDocument()
  })
})
