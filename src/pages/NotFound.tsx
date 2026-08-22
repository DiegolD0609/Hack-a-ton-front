import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="app-shell flex flex-col items-center justify-center px-4">
      <h1 className="text-8xl text-signal">404</h1>
      <p className="mt-4 text-lg font-semibold text-content">
        Page not found
      </p>
      <p className="mt-2 text-sm text-content-muted">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="btn-primary mt-8"
      >
        Go home
      </Link>
    </div>
  )
}
