import type { InputHTMLAttributes } from 'react'

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label: string
}

export default function AuthField({ error, id, label, className = '', ...inputProps }: AuthFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="mb-4">
      <label htmlFor={id} className="auth-label">{label}</label>
      <input
        {...inputProps}
        id={id}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        className={`auth-input ${error ? 'border-primary' : ''} ${className}`}
      />
      {error && <p id={errorId} className="mt-1.5 text-xs font-medium text-primary">{error}</p>}
    </div>
  )
}
