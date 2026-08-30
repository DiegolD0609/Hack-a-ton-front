import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('agent learning studio', () => {
  it('renders the single-page brief, playground, trace and workflow', () => {
    render(<App />)
    expect(screen.getByRole('textbox', { name: 'Objetivo para el agente' })).toHaveValue(
      'Crea una interfaz operativa que priorice la anomalía, mantenga la decisión humana visible y explique por qué cambia cada componente.',
    )
    expect(screen.getByRole('button', { name: 'Run agent' })).toBeEnabled()
    expect(screen.getByRole('heading', { name: 'Playground' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Agent trace' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Workflow' })).toBeInTheDocument()
    expect(screen.getByText('Mantén visible la acción principal.')).toBeInTheDocument()
  })
})
