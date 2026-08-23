export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl text-content">
        Centro de operaciones
      </h1>
      <p className="mt-2 text-sm text-content-muted">
        Visibilidad rápida de la red logística de demostración.
      </p>

      {/* Stats grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Envíos activos', value: '148', change: '+12 hoy' },
          { label: 'A tiempo', value: '94%', change: '+3% esta semana' },
          { label: 'En tránsito', value: '82', change: '6 rutas activas' },
          { label: 'Excepciones', value: '7', change: '4 por resolver' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="surface-card p-5"
          >
            <p className="text-sm text-content-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-content">
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-semibold text-signal">
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder content */}
      <div className="mt-8 rounded-card border-2 border-dashed border-ocean/40 bg-surface-tinted p-12 text-center">
        <p className="text-sm text-content-muted">
          Conecta aquí el mapa, las alertas y la tabla de envíos del backend.
        </p>
      </div>
    </div>
  )
}
