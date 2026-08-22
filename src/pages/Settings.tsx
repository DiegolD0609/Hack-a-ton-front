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
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Settings
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Manage your account preferences.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-lg space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="settings-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="settings-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  )
}
