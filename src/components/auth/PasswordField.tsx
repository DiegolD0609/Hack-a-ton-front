import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import AuthField from './AuthField'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string
  label: string
}

export default function PasswordField({ error, label, ...inputProps }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative">
      <AuthField
        {...inputProps}
        type={isVisible ? 'text' : 'password'}
        label={label}
        error={error}
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setIsVisible((value) => !value)}
        className="auth-icon-button top-[2.65rem]"
        aria-label={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        <EyeIcon isVisible={isVisible} />
      </button>
    </div>
  )
}

function EyeIcon({ isVisible }: { isVisible: boolean }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      {isVisible ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.2A10.8 10.8 0 0112 4c4.5 0 8.3 3.1 9.5 8a11.8 11.8 0 01-2.1 4.1M6.2 6.2A11.2 11.2 0 002.5 12c1.2 4.9 5 8 9.5 8 1.3 0 2.6-.3 3.7-.8" />
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12C3.7 7.9 7.5 5 12 5s8.3 2.9 9.5 7c-1.2 4.1-5 7-9.5 7s-8.3-2.9-9.5-7z" />
        </>
      )}
    </svg>
  )
}
