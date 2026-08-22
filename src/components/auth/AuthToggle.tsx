import type { ReactNode } from 'react'

interface AuthToggleProps {
  ariaLabel?: string
  checked: boolean
  error?: string
  label: ReactNode
  onChange: (checked: boolean) => void
}

export default function AuthToggle({ ariaLabel, checked, error, label, onChange }: AuthToggleProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[14px] text-content-muted">{label}</span>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`auth-toggle shrink-0 ${checked ? 'bg-primary' : 'bg-stroke'}`}
          role="switch"
          aria-checked={checked}
          aria-label={ariaLabel ?? (typeof label === 'string' ? label : 'Cambiar selección')}
        >
          <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-primary">{error}</p>}
    </div>
  )
}
