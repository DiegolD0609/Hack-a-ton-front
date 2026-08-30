import { useEffect, useMemo, useState, type FormEvent } from 'react'
import IterationTree, { type IterationStatus } from '@/components/studio/IterationTree'
import ProjectHistory from '@/components/studio/ProjectHistory'
import StudioCanvas from '@/components/studio/StudioCanvas'
import StudioIcon from '@/components/studio/StudioIcon'
import { studioResponseMeta } from '@/studio/StudioRenderer'
import { generateStudioUI, StudioApiError } from '@/studio/api'
import {
  createStudioProject,
  loadStudioWorkspace,
  saveStudioWorkspace,
  type StudioProject,
  type StudioProjectIteration,
} from '@/studio/projects'

function latestCompletedIteration(
  iterations: StudioProjectIteration[],
  conversationId: string | null,
): StudioProjectIteration | null {
  if (!conversationId) return null
  for (let index = iterations.length - 1; index >= 0; index -= 1) {
    const iteration = iterations[index]
    if (iteration.conversationId === conversationId && iteration.status === 'completed') {
      return iteration
    }
  }
  return null
}

export default function Studio() {
  const [workspace, setWorkspace] = useState(loadStudioWorkspace)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [storageError, setStorageError] = useState(false)

  const activeProject = (
    workspace.projects.find((project) => project.id === workspace.activeProjectId)
    ?? workspace.projects[0]
  ) as StudioProject
  const selectedIteration = useMemo(
    () => activeProject.iterations.find((iteration) => iteration.id === activeProject.selectedId) ?? null,
    [activeProject.iterations, activeProject.selectedId],
  )
  const selectedResponse = selectedIteration?.status === 'completed'
    ? selectedIteration.response
    : null
  const selectedMeta = studioResponseMeta(selectedResponse)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

  useEffect(() => {
    setStorageError(!saveStudioWorkspace(workspace))
  }, [workspace])

  const updateProject = (projectId: string, update: (project: StudioProject) => StudioProject) => {
    setWorkspace((current) => ({
      ...current,
      projects: current.projects.map((project) => project.id === projectId ? update(project) : project),
    }))
  }

  const sessionStatus = activeProject.error
    ? 'Atención requerida'
    : isGenerating
      ? 'Generando en el API'
      : selectedResponse !== null
        ? `Iteración ${String(selectedIteration?.id ?? 0).padStart(2, '0')}`
        : 'Playground vacío'

  const createProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const project = createStudioProject(newProjectName)
    setWorkspace((current) => ({
      ...current,
      activeProjectId: project.id,
      projects: [...current.projects, project],
    }))
    setNewProjectName('')
    setIsCreatingProject(false)
  }

  const openProjectCreator = () => {
    setNewProjectName(`UI Project ${workspace.projects.length + 1}`)
    setIsCreatingProject(true)
  }

  const generate = async () => {
    const exactPrompt = activeProject.prompt.trim()
    if (!exactPrompt || isGenerating) return

    const projectId = activeProject.id
    const selectedConversationId = selectedIteration?.conversationId ?? null
    const parent = latestCompletedIteration(activeProject.iterations, selectedConversationId)
    const iterationId = Math.max(0, ...activeProject.iterations.map((iteration) => iteration.id)) + 1
    const pending: StudioProjectIteration = {
      id: iterationId,
      parentId: parent?.id ?? null,
      prompt: exactPrompt,
      status: 'generating',
      suggestion: null,
      conversationId: parent?.conversationId ?? null,
      response: null,
    }

    updateProject(projectId, (project) => ({
      ...project,
      iterations: [...project.iterations, pending],
      selectedId: iterationId,
      error: null,
    }))
    setIsGenerating(true)
    try {
      let generated: unknown
      try {
        generated = await generateStudioUI(apiUrl, exactPrompt, parent?.conversationId)
      } catch (requestError) {
        if (!(requestError instanceof StudioApiError) || requestError.status !== 404 || !parent) {
          throw requestError
        }

        updateProject(projectId, (project) => ({
          ...project,
          iterations: project.iterations.map((iteration) => iteration.id === iterationId
            ? { ...iteration, parentId: null, conversationId: null }
            : iteration),
        }))
        generated = await generateStudioUI(apiUrl, exactPrompt)
      }

      const responseMeta = studioResponseMeta(generated)
      if (!responseMeta.conversationId) {
        throw new Error('El API no devolvió conversationId.')
      }
      updateProject(projectId, (project) => ({
        ...project,
        iterations: project.iterations.map((iteration) => iteration.id === iterationId
          ? {
              ...iteration,
              status: 'completed' as IterationStatus,
              suggestion: responseMeta.reason,
              conversationId: responseMeta.conversationId,
              response: generated,
            }
          : iteration),
      }))
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'No fue posible generar la interfaz.'
      updateProject(projectId, (project) => ({
        ...project,
        error: message,
        iterations: project.iterations.map((iteration) => iteration.id === iterationId
          ? { ...iteration, status: 'error' as IterationStatus, suggestion: message }
          : iteration),
      }))
    } finally {
      setIsGenerating(false)
    }
  }

  const selectIteration = (id: number | null) => {
    updateProject(activeProject.id, (project) => {
      const selected = project.iterations.find((iteration) => iteration.id === id)
      return {
        ...project,
        selectedId: id,
        error: selected?.status === 'error' ? selected.suggestion : null,
      }
    })
  }

  const clear = () => {
    updateProject(activeProject.id, (project) => ({
      ...project,
      prompt: '',
      iterations: [],
      selectedId: null,
      error: null,
    }))
  }

  return (
    <div className="studio-shell">
      <header className="studio-topbar">
        <a className="studio-brand" href="/" aria-label="Kernel Panic Studio, inicio">
          <span className="studio-brand-mark">K</span>
          <span>
            <b>Kernel Panic</b>
            <small>Standalone UI studio</small>
          </span>
        </a>

        <div className="studio-project-switcher">
          <StudioIcon name="layers" size={16} />
          <label>
            <span>Project</span>
            <select
              aria-label="Cambiar proyecto"
              value={activeProject.id}
              disabled={isGenerating}
              onChange={(event) => setWorkspace((current) => ({
                ...current,
                activeProjectId: event.target.value,
              }))}
            >
              {workspace.projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            aria-label="Crear nuevo proyecto"
            disabled={isGenerating}
            onClick={openProjectCreator}
          >
            +
          </button>

          {isCreatingProject ? (
            <form className="studio-project-dialog" role="dialog" aria-label="Nuevo proyecto" onSubmit={createProject}>
              <label htmlFor="new-project-name">Project name</label>
              <input
                id="new-project-name"
                value={newProjectName}
                maxLength={60}
                autoFocus
                onChange={(event) => setNewProjectName(event.target.value)}
              />
              <div>
                <button type="button" onClick={() => setIsCreatingProject(false)}>Cancel</button>
                <button type="submit" disabled={!newProjectName.trim()}>Create project</button>
              </div>
            </form>
          ) : null}
        </div>

        <div className="studio-top-actions">
          <div className="studio-session-status" role="status">
            <span className={`status-orb ${activeProject.error ? 'is-paused' : ''}`} />
            <span>{sessionStatus}</span>
          </div>
          <button type="button" className="studio-icon-button" aria-label="Limpiar playground" onClick={clear}>
            <StudioIcon name="refresh" />
          </button>
        </div>
      </header>

      <main className="studio-workspace">
        <aside className="studio-sidebar" aria-label="Solicitud al API">
          <section className="studio-brief-block">
            <div className="flex items-center justify-between">
              <span className="studio-sidebar-label">Solicitud</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/30">API input</span>
            </div>
            <label className="sr-only" htmlFor="studio-prompt">Instrucción exacta para el API</label>
            <textarea
              id="studio-prompt"
              className="studio-prompt"
              value={activeProject.prompt}
              maxLength={2000}
              disabled={isGenerating}
              placeholder="Ej. Genera exclusivamente dos botones: Aceptar y Cancelar."
              onChange={(event) => updateProject(activeProject.id, (project) => ({
                ...project,
                prompt: event.target.value,
              }))}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] text-black/35">{activeProject.prompt.length}/2000</span>
              <button
                type="button"
                className="studio-run-button"
                disabled={!activeProject.prompt.trim() || isGenerating}
                onClick={() => void generate()}
              >
                {isGenerating ? <StudioIcon name="refresh" className="animate-spin" /> : <StudioIcon name="arrow" />}
                {isGenerating ? 'Generando…' : 'Generar UI'}
              </button>
            </div>
          </section>

          <IterationTree
            iterations={activeProject.iterations}
            selectedId={activeProject.selectedId}
            onSelect={selectIteration}
          />

          <ProjectHistory
            iterations={activeProject.iterations}
            selectedId={activeProject.selectedId}
            onSelect={selectIteration}
          />

          {activeProject.error ? (
            <div className="studio-error" role="alert">
              <strong>El API no pudo responder</strong>
              <span>{activeProject.error}</span>
            </div>
          ) : null}

          {storageError ? (
            <div className="studio-error" role="alert">
              <strong>Project storage is full</strong>
              <span>The current session still works, but recent changes may not survive a refresh.</span>
            </div>
          ) : null}
        </aside>

        <div className="studio-main-grid">
          <StudioCanvas
            response={selectedResponse}
            isBuilding={isGenerating}
            iterationId={selectedIteration?.id ?? null}
          />

          <section className="studio-suggestion-card" aria-labelledby="backend-suggestion-title">
            <div className="studio-suggestion-mark"><StudioIcon name="spark" /></div>
            <div>
              <span className="studio-sidebar-label">Backend output</span>
              <h2 id="backend-suggestion-title">Backend suggestion</h2>
              <p>{selectedMeta.reason ?? 'The backend suggestion will appear here after an iteration.'}</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
