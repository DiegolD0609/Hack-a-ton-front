import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('application routes', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/landing')
  })

  it('renders the public landing page', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('opens the backend-free guided demo', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: 'Explorar la demo' }))

    expect(screen.getByRole('heading', { name: /operación logística entendible/i })).toBeInTheDocument()
    expect(screen.getByText('Envíos activos')).toBeInTheDocument()
  })

  it('redirects protected routes to login', () => {
    window.history.pushState({}, '', '/dashboard')
    render(<App />)
    expect(screen.getByRole('heading', { name: /bienvenido de vuelta/i })).toBeInTheDocument()
  })

  it('shows accessible validation errors in login', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/login')
    render(<App />)

    await user.type(screen.getByLabelText('Correo electrónico'), 'correo-invalido')
    await user.type(screen.getByLabelText('Contraseña'), '123')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument()
    expect(screen.getByText('Usa al menos 8 caracteres.')).toBeInTheDocument()
  })

  it('requires registration terms and matching passwords', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/register')
    render(<App />)

    await user.type(screen.getByLabelText('Nombre completo'), 'Alex')
    await user.type(screen.getByLabelText('Correo electrónico'), 'alex@example.com')
    const passwordInputs = screen.getAllByLabelText(/contraseña/i)
    await user.type(passwordInputs[0], 'password123')
    await user.type(passwordInputs[1], 'different123')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(screen.getByText('Debes aceptar los términos y condiciones.')).toBeInTheDocument()
  })
})
