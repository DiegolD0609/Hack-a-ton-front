import Demo from '@/pages/Demo'
import Landing from '@/pages/Landing'

export default function App() {
  return window.location.pathname === '/demo' ? <Demo /> : <Landing />
}
