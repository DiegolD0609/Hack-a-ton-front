import WorkflowEditor from '@/editor/WorkflowEditor'
import Demo from '@/pages/Demo'
import Landing from '@/pages/Landing'

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/demo') return <Demo />
  if (path === '/editor') return <WorkflowEditor />
  return <Landing />
}
