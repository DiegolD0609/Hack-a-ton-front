import { Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute, PublicRoute } from '@/middleware/AuthGuard'
import SidebarLayout from '@/layouts/SidebarLayout'
import { Landing, Login, Register, Dashboard, Settings, NotFound } from '@/pages'

/**
 * Central router — all route definitions live here.
 *
 * "/" always redirects to "/landing" so the Landing page
 * is the true default entry point of the app.
 *
 * Route groups:
 *  - Public:    /landing
 *  - Auth-only: /login, /register  (redirects to /dashboard if logged in)
 *  - Private:   /dashboard, /settings (redirects to /login if not logged in)
 */
export default function AppRouter() {
  return (
    <Routes>
      {/* Default: redirect root to /landing */}
      <Route path="/" element={<Navigate to="/landing" replace />} />

      {/* Public pages — accessible to everyone */}
      <Route path="/landing" element={<Landing />} />

      {/* Auth pages — only when NOT logged in */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected pages — only when logged in */}
      <Route element={<PrivateRoute />}>
        <Route element={<SidebarLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
