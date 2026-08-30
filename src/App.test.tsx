import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('API-only UI studio', () => {
  it('starts with an empty prompt and an empty playground', () => {
    render(<App />)
    expect(screen.getByRole('textbox', { name: 'Instrucción exacta para el API' })).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Generar UI' })).toBeDisabled()
    expect(screen.getByRole('heading', { name: 'Playground' })).toBeInTheDocument()
    expect(screen.getByLabelText('Playground vacío')).toBeEmptyDOMElement()
    expect(screen.getByText('Sin contratos runtime')).toBeInTheDocument()
    expect(screen.getAllByText(/\/studio\/generate/).length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { name: 'Agent trace' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Workflow' })).not.toBeInTheDocument()
  })
})
