import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'

const preferencesKey = 'kernel-panic:preferences'

export default function Settings() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    localStorage.setItem(preferencesKey, JSON.stringify({ name, email }))
    setSaved(true)
  }

  return (
    <div>
      <h1 className="text-3xl text-content">
        Preferencias
      </h1>
      <p className="mt-2 text-sm text-content-muted">
        Administra los datos visibles de tu cuenta demo.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-lg space-y-6">
        <div>
          <label htmlFor="name" className="form-label">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="settings-email" className="form-label">
            Correo electrónico
          </label>
          <input
            id="settings-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="border-t border-stroke pt-6">
          <button
            type="submit"
            className="btn-primary"
          >
            Guardar cambios
          </button>
          <p className="mt-3 text-sm text-content-muted" aria-live="polite">
            {saved ? 'Cambios guardados en este dispositivo.' : ''}
          </p>
        </div>
      </form>
    </div>
  )
}
