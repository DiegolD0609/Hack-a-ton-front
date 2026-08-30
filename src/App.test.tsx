import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('API-only UI studio', () => {
  it('starts with an empty prompt and an empty playground', () => {
    render(<App />)
    expect(screen.getByRole('textbox', { name: 'Instrucción exacta para el API' })).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Generar UI' })).toBeDisabled()
    expect(screen.getByRole('heading', { name: 'Playground' })).toBeInTheDocument()
    expect(screen.getByText('CREATE SAMPLE UI')).toBeInTheDocument()
    expect(screen.getByLabelText('Playground vacío')).toBeEmptyDOMElement()
    expect(screen.getByRole('link', { name: 'Kernel Panic Studio, inicio' })).toHaveTextContent('Kernel Panic')
    expect(screen.getByRole('heading', { name: 'Iteration tree' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Backend suggestion' })).toBeInTheDocument()
    expect(screen.queryByText('Sin contratos runtime')).not.toBeInTheDocument()
    expect(screen.queryByText(/POST \/studio\/generate/)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Agent trace' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Workflow' })).not.toBeInTheDocument()
  })
})
