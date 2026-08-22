export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {stat.change} from last month
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder content */}
      <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add your charts, tables, and widgets here.
        </p>
      </div>
    </div>
  )
}
