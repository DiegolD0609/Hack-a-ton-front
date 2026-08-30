import { useEffect, useMemo, useState, type FormEvent } from 'react'
import IterationTree, { type IterationStatus } from '@/components/studio/IterationTree'
import ProjectFeedback from '@/components/studio/ProjectFeedback'
import ProjectHistory from '@/components/studio/ProjectHistory'
import StudioCanvas from '@/components/studio/StudioCanvas'
import StudioIcon from '@/components/studio/StudioIcon'
import { studioResponseMeta } from '@/studio/StudioRenderer'
import {
  generateStudioUI,
  getStudioProject,
  listStudioProjects,
  submitStudioProjectFeedback,
  StudioApiError,
} from '@/studio/api'
import {
  createStudioProject,
  createStudioWorkspace,
  projectFromSummary,
  studioProjectFromDetail,
  studioProjectSummaries,
  type StudioProject,
  type StudioProjectIteration,
} from '@/studio/projects'

function latestCompletedIteration(iterations: StudioProjectIteration[]): StudioProjectIteration | null {
  for (let index = iterations.length - 1; index >= 0; index -= 1) {
    if (iterations[index].status === 'completed') return iterations[index]
  }
  return null
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export default function Studio() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
  const [workspace, setWorkspace] = useState(createStudioWorkspace)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [isRenamingProject, setIsRenamingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [projectNameDraft, setProjectNameDraft] = useState('')

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

  const updateProject = (projectId: string, update: (project: StudioProject) => StudioProject) => {
    setWorkspace((current) => {
      let activeProjectId = current.activeProjectId
      const projects = current.projects.map((project) => {
        if (project.id !== projectId) return project
        const updated = update(project)
        if (activeProjectId === project.id && updated.id !== project.id) {
          activeProjectId = updated.id
        }
        return updated
      })
      return { activeProjectId, projects }
    })
  }

  const removeMissingProject = (projectId: string) => {
    setWorkspace((current) => {
      const remaining = current.projects.filter((project) => project.id !== projectId)
      const loadedFallback = remaining.find((project) => project.isLoaded)
      if (loadedFallback) {
        return {
          activeProjectId: current.activeProjectId === projectId ? loadedFallback.id : current.activeProjectId,
          projects: remaining,
        }
      }
      const draft = createStudioProject(`UI Project ${remaining.length + 1}`)
      return { activeProjectId: draft.id, projects: [...remaining, draft] }
    })
  }

  const loadProject = async (projectId: string) => {
    updateProject(projectId, (project) => ({ ...project, isLoaded: false, error: null }))
    try {
      const detail = studioProjectFromDetail(await getStudioProject(apiUrl, projectId))
      if (!detail) throw new Error('El backend devolvió un proyecto inválido.')
      updateProject(projectId, (project) => ({ ...detail, prompt: project.prompt }))
      setProjectsError(null)
    } catch (requestError) {
      if (requestError instanceof StudioApiError && requestError.status === 404) {
        removeMissingProject(projectId)
      } else {
        updateProject(projectId, (project) => ({
          ...project,
          isLoaded: true,
          error: errorMessage(requestError, 'No fue posible cargar el proyecto.'),
        }))
      }
      setProjectsError(errorMessage(requestError, 'No fue posible cargar el proyecto.'))
    }
  }

  useEffect(() => {
    window.localStorage.removeItem('kernel-panic.studio.workspace.v1')
    let cancelled = false

    const load = async () => {
      setIsLoadingProjects(true)
      try {
        const summaries = studioProjectSummaries(await listStudioProjects(apiUrl))
        if (cancelled) return
        if (!summaries.length) {
          setWorkspace(createStudioWorkspace())
          setProjectsError(null)
          return
        }

        const projects = summaries.map(projectFromSummary)
        const firstProjectId = projects[0].id
        setWorkspace({ activeProjectId: firstProjectId, projects })
        const detail = studioProjectFromDetail(await getStudioProject(apiUrl, firstProjectId))
        if (cancelled) return
        if (!detail) throw new Error('El backend devolvió un proyecto inválido.')
        setWorkspace((current) => ({
          ...current,
          projects: current.projects.map((project) => project.id === firstProjectId ? detail : project),
        }))
        setProjectsError(null)
      } catch (requestError) {
        if (!cancelled) {
          if (requestError instanceof StudioApiError && requestError.status === 404) {
            setWorkspace(createStudioWorkspace())
          }
          setProjectsError(errorMessage(requestError, 'No fue posible listar los proyectos.'))
        }
      } finally {
        if (!cancelled) setIsLoadingProjects(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [apiUrl])

  const sessionStatus = projectsError || activeProject.error
    ? 'Atención requerida'
    : isGenerating
      ? 'Generando en el API'
      : isLoadingProjects || !activeProject.isLoaded
        ? 'Cargando proyecto'
        : selectedResponse !== null
          ? `Iteración ${String(selectedIteration?.id ?? 0).padStart(2, '0')}`
          : 'Playground vacío'

  const createProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const project = createStudioProject(newProjectName)
    setWorkspace((current) => {
      const active = current.projects.find((candidate) => candidate.id === current.activeProjectId)
      const replaceEmptyDraft = active?.isDraft
        && active.iterations.length === 0
        && !active.prompt.trim()
      return {
        activeProjectId: project.id,
        projects: replaceEmptyDraft
          ? current.projects.map((candidate) => candidate.id === current.activeProjectId ? project : candidate)
          : [...current.projects, project],
      }
    })
    setNewProjectName('')
    setProjectsError(null)
    setIsCreatingProject(false)
  }

  const openProjectCreator = () => {
    setNewProjectName(`UI Project ${workspace.projects.length + 1}`)
    setIsRenamingProject(false)
    setIsCreatingProject(true)
  }

  const openProjectRenamer = () => {
    if (!activeProject.isDraft) return
    setProjectNameDraft(activeProject.name)
    setIsCreatingProject(false)
    setIsRenamingProject(true)
  }

  const renameDraftProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = projectNameDraft.trim()
    if (!name || !activeProject.isDraft) return
    updateProject(activeProject.id, (project) => ({ ...project, name }))
    setIsRenamingProject(false)
  }

  const switchProject = (projectId: string) => {
    const project = workspace.projects.find((candidate) => candidate.id === projectId)
    if (!project) return
    setWorkspace((current) => ({ ...current, activeProjectId: projectId }))
    setProjectsError(null)
    if (!project.isDraft && !project.isLoaded) void loadProject(projectId)
  }

  const generate = async () => {
    const exactPrompt = activeProject.prompt.trim()
    if (!exactPrompt || isGenerating || !activeProject.isLoaded) return

    const projectId = activeProject.id
    const parent = latestCompletedIteration(activeProject.iterations)
    const iterationId = Math.max(0, ...activeProject.iterations.map((iteration) => iteration.id)) + 1
    const pending: StudioProjectIteration = {
      id: iterationId,
      parentId: parent?.id ?? null,
      prompt: exactPrompt,
      status: 'generating',
      suggestion: null,
      conversationId: activeProject.isDraft ? null : activeProject.id,
      response: null,
      feedbackScore: null,
      feedbackComment: '',
      feedbackStatus: 'idle',
      feedbackMessage: null,
    }

    updateProject(projectId, (project) => ({
      ...project,
      iterations: [...project.iterations, pending],
      selectedId: iterationId,
      error: null,
    }))
    setIsGenerating(true)
    setProjectsError(null)
    try {
      let generated: unknown
      try {
        generated = await generateStudioUI(apiUrl, exactPrompt, activeProject.isDraft
          ? { name: activeProject.name }
          : { conversationId: activeProject.id })
      } catch (requestError) {
        if (!(requestError instanceof StudioApiError) || requestError.status !== 404 || activeProject.isDraft) {
          throw requestError
        }

        updateProject(projectId, (project) => ({
          ...project,
          isDraft: true,
          iterations: [{ ...pending, parentId: null, conversationId: null }],
          selectedId: iterationId,
        }))
        generated = await generateStudioUI(apiUrl, exactPrompt, { name: activeProject.name })
      }

      const responseMeta = studioResponseMeta(generated)
      if (!responseMeta.conversationId) throw new Error('El API no devolvió conversationId.')
      const timestamp = new Date().toISOString()
      updateProject(projectId, (project) => ({
        ...project,
        id: responseMeta.conversationId as string,
        isDraft: false,
        isLoaded: true,
        createdAt: project.createdAt ?? timestamp,
        updatedAt: timestamp,
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
      const message = errorMessage(requestError, 'No fue posible generar la interfaz.')
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

  const refreshProject = () => {
    if (activeProject.isDraft) {
      updateProject(activeProject.id, (project) => ({
        ...project,
        prompt: '',
        iterations: [],
        selectedId: null,
        error: null,
      }))
      return
    }
    void loadProject(activeProject.id)
  }

  const updateSelectedFeedback = (update: Partial<Pick<
    StudioProjectIteration,
    'feedbackScore' | 'feedbackComment' | 'feedbackStatus' | 'feedbackMessage'
  >>) => {
    const iterationId = activeProject.selectedId
    if (iterationId === null) return
    updateProject(activeProject.id, (project) => ({
      ...project,
      iterations: project.iterations.map((iteration) => iteration.id === iterationId
        ? { ...iteration, ...update }
        : iteration),
    }))
  }

  const submitFeedback = () => {
    const iteration = activeProject.iterations.find((candidate) => candidate.id === activeProject.selectedId)
    if (activeProject.isDraft || !iteration || iteration.status !== 'completed' || iteration.feedbackScore === null) {
      return
    }

    const projectId = activeProject.id
    const iterationId = iteration.id
    const score = iteration.feedbackScore
    const comment = iteration.feedbackComment
    updateSelectedFeedback({ feedbackStatus: 'sending', feedbackMessage: 'Sending feedback…' })

    void submitStudioProjectFeedback(apiUrl, projectId, { score, comment })
      .then(() => {
        updateProject(projectId, (project) => ({
          ...project,
          iterations: project.iterations.map((candidate) => candidate.id === iterationId
            ? {
                ...candidate,
                feedbackStatus: 'sent',
                feedbackMessage: 'Feedback saved. It will guide the next iteration.',
              }
            : candidate),
        }))
      })
      .catch((requestError: unknown) => {
        updateProject(projectId, (project) => ({
          ...project,
          iterations: project.iterations.map((candidate) => candidate.id === iterationId
            ? {
                ...candidate,
                feedbackStatus: 'error',
                feedbackMessage: errorMessage(requestError, 'Feedback could not be saved.'),
              }
            : candidate),
        }))
      })
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
              disabled={isGenerating || isLoadingProjects}
              onChange={(event) => switchProject(event.target.value)}
            >
              {workspace.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}{project.isDraft ? ' · draft' : ''}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            aria-label="Crear nuevo proyecto"
            disabled={isGenerating || isLoadingProjects}
            onClick={openProjectCreator}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Renombrar proyecto"
            title={activeProject.isDraft
              ? 'Rename this draft before its first generation'
              : 'Backend endpoint required to rename saved projects'}
            disabled={isGenerating || isLoadingProjects || !activeProject.isDraft}
            onClick={openProjectRenamer}
          >
            ✎
          </button>

          {isCreatingProject ? (
            <form className="studio-project-dialog" role="dialog" aria-label="Nuevo proyecto" onSubmit={createProject}>
              <label htmlFor="new-project-name">Project name</label>
              <input
                id="new-project-name"
                value={newProjectName}
                maxLength={120}
                autoFocus
                onChange={(event) => setNewProjectName(event.target.value)}
              />
              <div>
                <button type="button" onClick={() => setIsCreatingProject(false)}>Cancel</button>
                <button type="submit" disabled={!newProjectName.trim()}>Create project</button>
              </div>
            </form>
          ) : null}

          {isRenamingProject ? (
            <form className="studio-project-dialog" role="dialog" aria-label="Renombrar proyecto" onSubmit={renameDraftProject}>
              <label htmlFor="rename-project-name">Project name</label>
              <input
                id="rename-project-name"
                value={projectNameDraft}
                maxLength={120}
                autoFocus
                onChange={(event) => setProjectNameDraft(event.target.value)}
              />
              <p className="studio-project-dialog-note">The name will be persisted with the first generation.</p>
              <div>
                <button type="button" onClick={() => setIsRenamingProject(false)}>Cancel</button>
                <button type="submit" disabled={!projectNameDraft.trim()}>Save name</button>
              </div>
            </form>
          ) : null}
        </div>

        <div className="studio-top-actions">
          <div className="studio-session-status" role="status">
            <span className={`status-orb ${projectsError || activeProject.error ? 'is-paused' : ''}`} />
            <span>{sessionStatus}</span>
          </div>
          <button
            type="button"
            className="studio-icon-button"
            aria-label="Recargar proyecto"
            disabled={isGenerating || !activeProject.isLoaded}
            onClick={refreshProject}
          >
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
              disabled={isGenerating || !activeProject.isLoaded}
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
                disabled={!activeProject.prompt.trim() || isGenerating || !activeProject.isLoaded}
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

          {projectsError || activeProject.error ? (
            <div className="studio-error" role="alert">
              <strong>El API no pudo cargar el proyecto</strong>
              <span>{projectsError ?? activeProject.error}</span>
            </div>
          ) : null}
        </aside>

        <div className="studio-main-grid">
          <StudioCanvas
            response={selectedResponse}
            isBuilding={isGenerating || !activeProject.isLoaded}
            iterationId={selectedIteration?.id ?? null}
          />

          <div className={`studio-output-row ${!activeProject.isDraft && selectedIteration?.status === 'completed' ? 'has-feedback' : ''}`}>
            <section className="studio-suggestion-card" aria-labelledby="backend-suggestion-title">
              <div className="studio-suggestion-mark"><StudioIcon name="spark" /></div>
              <div>
                <span className="studio-sidebar-label">Backend output</span>
                <h2 id="backend-suggestion-title">Backend suggestion</h2>
                <p>{selectedMeta.reason ?? 'The backend suggestion will appear here after an iteration.'}</p>
              </div>
            </section>

            {!activeProject.isDraft ? (
              <ProjectFeedback
                iteration={selectedIteration}
                projectName={activeProject.name}
                onCommentChange={(feedbackComment) => updateSelectedFeedback({
                  feedbackComment,
                  feedbackStatus: 'idle',
                  feedbackMessage: null,
                })}
                onScoreChange={(feedbackScore) => updateSelectedFeedback({
                  feedbackScore,
                  feedbackStatus: 'idle',
                  feedbackMessage: null,
                })}
                onSubmit={submitFeedback}
              />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
