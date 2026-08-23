export const appConfig = {
  name: 'Kernel Panic',
  tagline: 'Coordina envíos, equipos y decisiones desde una experiencia logística clara y accionable.',
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
    terms: '/terms',
    dashboard: '/dashboard',
  },
} as const

export const demoScenario = {
  profile: {
    name: 'Alex',
    activeShipments: '148',
    onTimeDeliveries: '94%',
    goal: 'Reducir retrasos de última milla',
  },
  plan: [
    { label: 'Entregas a tiempo', percentage: 72, color: 'bg-primary' },
    { label: 'En tránsito', percentage: 20, color: 'bg-secondary' },
    { label: 'Con excepción', percentage: 8, color: 'bg-impact' },
  ],
  projection: {
    dailyDeliveries: '320',
    etaAccuracy: '96%',
    resolvedExceptions: '18 min',
  },
} as const
