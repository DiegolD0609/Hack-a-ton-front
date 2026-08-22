import { Link } from 'react-router-dom'
import { appConfig } from '@/config/app'

export default function Terms() {
  return (
    <div className="app-shell">
      <main className="page-container py-12 sm:py-20">
        <Link to={appConfig.routes.register} className="auth-link">← Volver al registro</Link>
        <article className="surface-card mt-6 max-w-3xl p-6 sm:p-10">
          <p className="eyebrow">Documento de demostración</p>
          <h1 className="mt-2 text-4xl">Términos y condiciones</h1>
          <p className="mt-6 leading-7 text-content-muted">
            Esta versión del proyecto es un prototipo para hackathon. Los datos y proyecciones mostrados son ilustrativos y no constituyen asesoría financiera.
          </p>
          <p className="mt-4 leading-7 text-content-muted">
            Antes de publicar el producto, sustituye este contenido por términos revisados para el servicio, el territorio y el tratamiento de datos aplicables.
          </p>
        </article>
      </main>
    </div>
  )
}
