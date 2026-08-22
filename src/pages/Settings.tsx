import { useState } from 'react'
import type { FormEvent } from 'react'

export default function Settings() {
  const [name, setName] = useState('Diego')
  const [email, setEmail] = useState('diego@finva-app.com')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // TODO: integrate settings update logic
    console.log('Settings saved:', { name, email })
  }

  return (
    <div>
      <h1 className="text-3xl text-content">
        Settings
      </h1>
      <p className="mt-2 text-sm text-content-muted">
        Manage your account preferences.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-lg space-y-6">
        <div>
          <label htmlFor="name" className="form-label">
            Name
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
            Email
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
            Save changes
          </button>
        </div>
      </form>
    </div>
  )
}
