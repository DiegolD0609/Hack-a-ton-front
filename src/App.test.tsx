import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('application surfaces', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/landing')
  })

  it('keeps a focused landing without authentication controls', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Logística en movimiento.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explorar la demo' })).toHaveAttribute('href', '/demo')
    expect(screen.queryByText(/login|sign up|iniciar sesión/i)).not.toBeInTheDocument()
  })

  it('renders the agent UI runtime at /demo', () => {
    window.history.pushState({}, '', '/demo')
    render(<App />)
    expect(screen.getByRole('heading', { name: /interfaz viva/i })).toBeInTheDocument()
    expect(screen.getByText('El renderer está listo.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar golden path' })).toBeEnabled()
  })
})
