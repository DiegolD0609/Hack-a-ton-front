import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('applies an explicit hex color to the page background and a button', () => {
    render(
      <StudioRenderer
        response={{
          generatedBy: 'llm',
          layout: {
            id: 'ui_page',
            type: 'page',
            props: { title: 'Panel', backgroundColor: '#0b1220' },
            children: [
              { id: 'ui_btn', type: 'button', props: { label: 'Ir', variant: 'primary', size: 'md', color: '#ff6600' } },
            ],
          },
        }}
      />,
    )

    const page = document.querySelector('.generated-page') as HTMLElement
    expect(page.style.backgroundColor).toBe('rgb(11, 18, 32)')
    const button = screen.getByRole('button', { name: 'Ir' })
    expect(button.style.backgroundColor).toBe('rgb(255, 102, 0)')
  })

  it('ignores a malformed color instead of applying an unsafe style value', () => {
    render(
      <StudioRenderer
        response={{
          generatedBy: 'llm',
          layout: {
            id: 'ui_page',
            type: 'page',
            props: { title: 'Panel' },
            children: [
              {
                id: 'ui_btn',
                type: 'button',
                props: { label: 'Ir', variant: 'primary', size: 'md', color: 'javascript:alert(1)' },
              },
            ],
          },
        }}
      />,
    )

    const button = screen.getByRole('button', { name: 'Ir' })
    expect(button.style.backgroundColor).toBe('')
  })

  it('renders a real interactive route map for a map node, not a plain waypoint list', () => {
    render(
      <StudioRenderer
        response={{
          generatedBy: 'llm',
          layout: {
            id: 'ui_page',
            type: 'page',
            props: { title: 'Ruta' },
            children: [
              {
                id: 'ui_map',
                type: 'map',
                props: {
                  title: 'Ruta Indonesia - México',
                  waypoints: [
                    { id: 'wp_1', label: 'Indonesia', lat: -6.2, lon: 106.8166, kind: 'origin' },
                    { id: 'wp_2', label: 'México', lat: 19.4326, lon: -99.1332, kind: 'destination' },
                  ],
                  segments: [{ fromId: 'wp_1', toId: 'wp_2', status: 'active' }],
                  marker: null,
                  emphasis: 'normal',
                },
              },
            ],
          },
        }}
      />,
    )

    // jsdom has no WebGL, so RouteMap falls back to its accessible SVG route.
    expect(screen.getByRole('img', { name: /Mapa de ruta/ })).toBeInTheDocument()
    expect(screen.getByText('Indonesia')).toBeInTheDocument()
    expect(screen.getByText('México')).toBeInTheDocument()
  })

  it('shows a warning instead of a broken map when fewer than two waypoints are given', () => {
    render(
      <StudioRenderer
        response={{
          generatedBy: 'llm',
          layout: {
            id: 'ui_page',
            type: 'page',
            props: { title: 'Ruta' },
            children: [
              {
                id: 'ui_map',
                type: 'map',
                props: { waypoints: [{ id: 'wp_1', label: 'Indonesia', lat: -6.2, lon: 106.8, kind: 'origin' }], segments: [] },
              },
            ],
          },
        }}
      />,
    )

    expect(screen.getByText('Mapa incompleto')).toBeInTheDocument()
  })

  it('lets a wired search bar live-filter a table across any column', async () => {
    const user = userEvent.setup()
    render(
      <StudioRenderer
        response={{
          generatedBy: 'llm',
          layout: {
            id: 'ui_page',
            type: 'page',
            props: { title: 'Pedidos' },
            children: [
              {
                id: 'ui_search',
                type: 'searchBar',
                props: { placeholder: 'Buscar…', filterTarget: 'ui_table' },
              },
              {
                id: 'ui_table',
                type: 'table',
                props: {
                  columns: ['ID', 'Cliente'],
                  rows: [['1', 'Acme'], ['2', 'Globex']],
                },
              },
            ],
          },
        }}
      />,
    )

    expect(screen.getByRole('cell', { name: 'Acme' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Globex' })).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Buscar…'), 'acme')

    expect(screen.getByRole('cell', { name: 'Acme' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Globex' })).not.toBeInTheDocument()
  })

  it('lets a wired dropdown filter a table by a specific column', async () => {
    const user = userEvent.setup()
    render(
      <StudioRenderer
        response={{
          generatedBy: 'llm',
          layout: {
            id: 'ui_page',
            type: 'page',
            props: { title: 'Pedidos' },
            children: [
              {
                id: 'ui_dropdown',
                type: 'dropdown',
                props: {
                  label: 'Estado',
                  options: [{ label: 'OK', value: 'ok' }, { label: 'Pendiente', value: 'pendiente' }],
                  filterTarget: 'ui_table',
                  filterColumn: 'Estado',
                },
              },
              {
                id: 'ui_table',
                type: 'table',
                props: {
                  columns: ['ID', 'Estado'],
                  rows: [['1', 'ok'], ['2', 'pendiente']],
                },
              },
            ],
          },
        }}
      />,
    )

    await user.selectOptions(screen.getByRole('combobox'), 'pendiente')

    expect(screen.queryByRole('cell', { name: '1' })).not.toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '2' })).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows an empty state when a filter matches nothing, without crashing', async () => {
    const user = userEvent.setup()
    render(
      <StudioRenderer
        response={{
          generatedBy: 'llm',
          layout: {
            id: 'ui_page',
            type: 'page',
            props: { title: 'Pedidos' },
            children: [
              { id: 'ui_search', type: 'searchBar', props: { placeholder: 'Buscar…', filterTarget: 'ui_table' } },
              { id: 'ui_table', type: 'table', props: { columns: ['ID'], rows: [['1']] } },
            ],
          },
        }}
      />,
    )

    await user.type(screen.getByPlaceholderText('Buscar…'), 'no-existe')

    expect(screen.getByText('Ningún resultado coincide con el filtro.')).toBeInTheDocument()
  })
})
