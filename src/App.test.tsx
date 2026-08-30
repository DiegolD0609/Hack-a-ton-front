import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('API-only UI studio', () => {
  it('starts with an empty prompt and an empty playground', () => {
    render(<App />)
    expect(screen.getByRole('textbox', { name: 'Instrucción exacta para el API' })).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Enviar al API' })).toBeDisabled()
    expect(screen.getByRole('heading', { name: 'Playground' })).toBeInTheDocument()
    expect(screen.getByLabelText('Playground vacío')).toBeEmptyDOMElement()
    expect(screen.getByRole('heading', { name: 'Agent trace' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Workflow' })).toBeInTheDocument()
    expect(screen.getByText('Sin interpretación local')).toBeInTheDocument()
  })
})
