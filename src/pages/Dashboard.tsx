export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl text-content">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-content-muted">
        Welcome back! Here's an overview of your project.
      </p>

      {/* Stats grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Users', value: '1,240', change: '+12%' },
          { label: 'Revenue', value: '$8,320', change: '+8%' },
          { label: 'Active Sessions', value: '342', change: '+23%' },
          { label: 'Conversion', value: '3.6%', change: '+2%' },
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
              {stat.change} from last month
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder content */}
      <div className="mt-8 rounded-card border-2 border-dashed border-ocean/40 bg-surface-tinted p-12 text-center">
        <p className="text-sm text-content-muted">
          Add your charts, tables, and widgets here.
        </p>
      </div>
    </div>
  )
}
