import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <h1 className="text-7xl font-bold text-indigo-600 dark:text-indigo-400">404</h1>
      <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        Page not found
      </p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        Go home
      </Link>
    </div>
  )
}
