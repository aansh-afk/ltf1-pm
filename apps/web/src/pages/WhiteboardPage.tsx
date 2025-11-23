import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import WhiteboardCanvas from '@/components/features/whiteboard/WhiteboardCanvasKonva'
import BrutalistLoader from '@/components/common/BrutalistLoader'
import BrutalButton from '@/components/ui/BrutalButton'
import { HiOutlinePlus, HiOutlineBriefcase, HiOutlineFolder } from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function WhiteboardPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId?: string }>()
  const [activeWhiteboardId, setActiveWhiteboardId] = useState<Id<"whiteboards"> | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<Id<"workspaces"> | null>(null)

  // Get all user workspaces
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)

  // Use selected workspace or first workspace as fallback
  const currentWorkspace = workspaces?.find(w => w._id === selectedWorkspaceId) || workspaces?.[0]

  // Get projects for current workspace
  const projects = useQuery(
    api.projects.queries.getWorkspaceProjects,
    currentWorkspace ? { workspaceId: currentWorkspace._id } : 'skip'
  )

  // Get whiteboards for current workspace
  const whiteboards = useQuery(
    api.whiteboard.getWhiteboards,
    currentWorkspace ? {
      workspaceId: currentWorkspace._id,
      projectId: projectId as Id<"projects"> | undefined
    } : 'skip'
  )

  // Create whiteboard mutation
  const createWhiteboard = useMutation(api.whiteboard.createWhiteboard)

  const handleCreateWhiteboard = async () => {
    if (!currentWorkspace) return

    setIsCreating(true)
    try {
      const whiteboardId = await createWhiteboard({
        workspaceId: currentWorkspace._id,
        name: `Whiteboard ${new Date().toLocaleDateString()}`,
        description: 'Collaborative whiteboard',
        projectId: projectId as Id<"projects"> | undefined,
      })

      setActiveWhiteboardId(whiteboardId)
      toast.success('Whiteboard created!')
    } catch (error: any) {
      console.error('Failed to create whiteboard:', error)
      toast.error(error.message || 'Failed to create whiteboard')
    } finally {
      setIsCreating(false)
    }
  }

  if (!currentWorkspace) {
    return <BrutalistLoader />
  }

  if (activeWhiteboardId) {
    return (
      <WhiteboardCanvas
        workspaceId={currentWorkspace._id}
        whiteboardId={activeWhiteboardId}
        projectId={projectId as Id<"projects"> | undefined}
        onClose={() => setActiveWhiteboardId(null)}
      />
    )
  }

  return (
    <div className="p-24px">
      <div className="mb-24px">
        <div className="flex items-center justify-between mb-16px">
          <div>
            <h1 className="text-brutal-3xl font-bold mb-8px">WHITEBOARD COLLABORATION</h1>
            <p className="text-[var(--theme-muted)]">
              Create and collaborate on visual whiteboards in real-time
            </p>
          </div>
          <BrutalButton
            onClick={handleCreateWhiteboard}
            variant="primary"
            icon={<HiOutlinePlus className="w-20px h-20px" />}
            disabled={isCreating}
          >
            {isCreating ? 'CREATING...' : 'NEW WHITEBOARD'}
          </BrutalButton>
        </div>

        {/* Workspace Selector */}
        {workspaces && workspaces.length > 1 && (
          <div className="flex items-center gap-12px">
            <label className="text-sm font-mono font-bold text-[var(--theme-text)]">
              WORKSPACE:
            </label>
            <select
              value={currentWorkspace?._id || ''}
              onChange={(e) => setSelectedWorkspaceId(e.target.value as Id<"workspaces">)}
              className="px-12px py-8px border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] text-[var(--theme-text)] font-mono text-sm focus:border-[var(--theme-primary)] focus:outline-none"
            >
              {workspaces.map(workspace => (
                <option key={workspace._id} value={workspace._id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16px">
        {whiteboards?.map(whiteboard => {
          // Find project name if whiteboard has a project
          const project = whiteboard.projectId
            ? projects?.find(p => p._id === whiteboard.projectId)
            : null

          return (
            <button
              key={whiteboard._id}
              onClick={() => setActiveWhiteboardId(whiteboard._id)}
              className="p-24px border-2 border-[var(--theme-border)] hover:border-[var(--theme-primary)] bg-[var(--theme-background-secondary)] text-left transition-all"
            >
              {/* Context badges */}
              <div className="flex items-center gap-8px mb-12px">
                <div className="flex items-center gap-4px px-8px py-4px border border-[var(--theme-border)] bg-[var(--theme-background)] text-xs font-mono">
                  <HiOutlineBriefcase className="w-12px h-12px" />
                  <span>{currentWorkspace?.name}</span>
                </div>
                {project && (
                  <div className="flex items-center gap-4px px-8px py-4px border border-[var(--theme-border)] bg-[var(--theme-background)] text-xs font-mono">
                    <HiOutlineFolder className="w-12px h-12px" />
                    <span>{project.name}</span>
                  </div>
                )}
              </div>

              <h3 className="text-brutal-lg font-bold mb-8px">{whiteboard.name}</h3>
              <p className="text-sm text-[var(--theme-muted)] mb-12px">
                {whiteboard.description || 'No description'}
              </p>
              <div className="flex items-center gap-8px text-xs text-[var(--theme-muted)]">
                <span>{whiteboard.elements.length} elements</span>
                <span>•</span>
                <span>Version {whiteboard.version}</span>
                <span>•</span>
                <span>{whiteboard.collaborators.length} collaborators</span>
              </div>
            </button>
          )
        })}

        {(!whiteboards || whiteboards.length === 0) && (
          <div className="col-span-full text-center py-48px">
            <p className="text-brutal-lg font-bold mb-16px">NO WHITEBOARDS YET</p>
            <p className="text-sm text-[var(--theme-muted)] mb-16px">
              {currentWorkspace ? `Create your first whiteboard for ${currentWorkspace.name}` : 'Select a workspace to get started'}
            </p>
            <BrutalButton
              onClick={handleCreateWhiteboard}
              variant="primary"
              disabled={isCreating}
            >
              {isCreating ? 'CREATING...' : 'CREATE FIRST WHITEBOARD'}
            </BrutalButton>
          </div>
        )}
      </div>
    </div>
  )
}
