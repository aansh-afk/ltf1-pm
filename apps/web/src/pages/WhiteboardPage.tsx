import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import WhiteboardCanvas from '@/components/features/whiteboard/WhiteboardCanvasKonva'
import BrutalistLoader from '@/components/common/BrutalistLoader'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalBadge from '@/components/ui/BrutalBadge'
import {
  HiOutlinePlus,
  HiOutlineBriefcase,
  HiOutlineFolder,
  HiOutlineShare,
  HiOutlineChatAlt2,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDuplicate
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function WhiteboardPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId?: string }>()
  const [activeWhiteboardId, setActiveWhiteboardId] = useState<Id<"whiteboards"> | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<Id<"workspaces"> | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)

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

  const handleShare = () => {
    // In a real app, this would open a modal with link/invite options
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--theme-background)]">
        <BrutalistLoader />
      </div>
    )
  }

  if (activeWhiteboardId) {
    return (
      <div className="h-screen flex flex-col bg-[var(--theme-background)]">
        {/* Whiteboard Header */}
        <div className="h-16 border-b-2 border-[var(--theme-border)] flex items-center justify-between px-6 bg-[var(--theme-background)]">
          <div className="flex items-center gap-4">
            <BrutalButton
              variant="ghost"
              onClick={() => setActiveWhiteboardId(null)}
              className="font-mono text-xs uppercase"
            >
              ← Back
            </BrutalButton>
            <div className="h-8 w-[2px] bg-[var(--theme-border)]"></div>
            <h2 className="font-mono text-lg font-bold uppercase">
              {whiteboards?.find(w => w._id === activeWhiteboardId)?.name || 'Whiteboard'}
            </h2>
            <BrutalBadge variant="default">LIVE</BrutalBadge>
          </div>

          <div className="flex items-center gap-2">
            <BrutalButton
              variant="secondary"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <HiOutlineShare className="w-4 h-4" />
              Share
            </BrutalButton>
            {/* Placeholder for future chat integration */}
            <BrutalButton
              variant="ghost"
              onClick={() => toast('Team chat coming soon', { icon: '💬' })}
              className="flex items-center gap-2"
            >
              <HiOutlineChatAlt2 className="w-4 h-4" />
            </BrutalButton>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <WhiteboardCanvas
            workspaceId={currentWorkspace._id}
            whiteboardId={activeWhiteboardId}
            projectId={projectId as Id<"projects"> | undefined}
            onClose={() => setActiveWhiteboardId(null)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-[var(--theme-background)]">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <HiOutlinePencil className="w-8 h-8 md:w-10 md:h-10 text-[var(--theme-primary)]" />
            WHITEBOARD
          </h1>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60 uppercase tracking-wide">
            Collaborate visually • {currentWorkspace.name}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {workspaces && workspaces.length > 1 && (
            <select
              value={currentWorkspace._id}
              onChange={(e) => setSelectedWorkspaceId(e.target.value as Id<"workspaces">)}
              className="px-4 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-xs uppercase font-bold focus:border-[var(--theme-primary)] focus:outline-none cursor-pointer"
            >
              {workspaces.map(workspace => (
                <option key={workspace._id} value={workspace._id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          )}

          <BrutalButton
            onClick={handleCreateWhiteboard}
            variant="primary"
            disabled={isCreating}
            className="flex items-center gap-2"
          >
            <HiOutlinePlus className="w-4 h-4" />
            {isCreating ? 'CREATING...' : 'NEW WHITEBOARD'}
          </BrutalButton>
        </div>
      </div>

      {/* Whiteboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {whiteboards?.map(whiteboard => {
          const project = whiteboard.projectId
            ? projects?.find(p => p._id === whiteboard.projectId)
            : null

          return (
            <BrutalCard
              key={whiteboard._id}
              variant="default"
              className="group cursor-pointer hover:border-[var(--theme-primary)] transition-all relative overflow-hidden"
              onClick={() => setActiveWhiteboardId(whiteboard._id)}
            >
              <div className="p-6">
                {/* Context badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <BrutalBadge variant="outline" className="flex items-center gap-1">
                    <HiOutlineBriefcase className="w-3 h-3" />
                    {currentWorkspace?.name}
                  </BrutalBadge>
                  {project && (
                    <BrutalBadge variant="outline" className="flex items-center gap-1">
                      <HiOutlineFolder className="w-3 h-3" />
                      {project.name}
                    </BrutalBadge>
                  )}
                </div>

                <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--theme-primary)] transition-colors">
                  {whiteboard.name}
                </h3>
                <p className="text-sm font-mono text-[var(--theme-foreground)]/60 mb-6 line-clamp-2">
                  {whiteboard.description || 'No description'}
                </p>

                <div className="flex items-center justify-between text-xs font-mono text-[var(--theme-foreground)]/40 pt-4 border-t-2 border-[var(--theme-border)]">
                  <span>{whiteboard.elements.length} ELEMENTS</span>
                  <span>{whiteboard.collaborators.length} USERS</span>
                </div>
              </div>

              {/* Hover Actions Overlay */}
              <div className="absolute inset-0 bg-[var(--theme-background)]/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-none group-hover:pointer-events-auto">
                <BrutalButton variant="primary" onClick={(e) => {
                  e.stopPropagation()
                  setActiveWhiteboardId(whiteboard._id)
                }}>
                  OPEN
                </BrutalButton>
                <BrutalButton variant="secondary" onClick={(e) => {
                  e.stopPropagation()
                  // Duplicate logic would go here
                  toast('Duplicate coming soon', { icon: '📋' })
                }}>
                  <HiOutlineDuplicate className="w-4 h-4" />
                </BrutalButton>
              </div>
            </BrutalCard>
          )
        })}

        {/* Empty State */}
        {(!whiteboards || whiteboards.length === 0) && (
          <div className="col-span-full py-12">
            <BrutalCard className="p-12 text-center border-dashed flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-[var(--theme-background-secondary)] rounded-full flex items-center justify-center mb-6">
                <HiOutlinePencil className="w-8 h-8 text-[var(--theme-foreground)]/40" />
              </div>
              <h3 className="text-xl font-bold mb-2 uppercase">No Whiteboards Yet</h3>
              <p className="text-[var(--theme-foreground)]/60 font-mono text-sm mb-8 max-w-md">
                {currentWorkspace ? `Create your first whiteboard for ${currentWorkspace.name} to start collaborating visually.` : 'Select a workspace to get started'}
              </p>
              <BrutalButton
                onClick={handleCreateWhiteboard}
                variant="primary"
                disabled={isCreating}
                className="flex items-center gap-2"
              >
                <HiOutlinePlus className="w-4 h-4" />
                {isCreating ? 'CREATING...' : 'CREATE FIRST WHITEBOARD'}
              </BrutalButton>
            </BrutalCard>
          </div>
        )}
      </div>
    </div>
  )
}
