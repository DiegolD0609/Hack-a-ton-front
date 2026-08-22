export const appConfig = {
  name: 'Kernel Panic',
  tagline: 'Convierte tus metas financieras en un plan claro y accionable.',
  hackathon: 'NextWave 2026',
  team: {
    name: 'Kernel Panic',
    testimonialAuthor: 'Karmadesu',
    testimonialRole: 'Desarrollador',
  },
  routes: {
    home: '/landing',
    demo: '/demo',
    login: '/login',
    register: '/register',
    dashboard: '/dashboard',
  },
} as const

export const demoScenario = {
  profile: {
    name: 'Alex',
    monthlyIncome: '$25,000',
    availableSavings: '$4,800',
    goal: 'Crear un fondo de emergencia',
  },
  plan: [
    { label: 'Fondo de emergencia', percentage: 50, color: 'bg-signal' },
    { label: 'Inversión conservadora', percentage: 30, color: 'bg-ocean' },
    { label: 'Liquidez mensual', percentage: 20, color: 'bg-sky' },
  ],
  projection: {
    monthlyContribution: '$4,800',
    sixMonths: '$28,800',
    twelveMonths: '$57,600',
  },
} as const
