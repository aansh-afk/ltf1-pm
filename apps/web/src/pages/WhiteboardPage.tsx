import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import WhiteboardCanvas from '@/components/features/whiteboard/WhiteboardCanvasKonva'
import BrutalistLoader from '@/components/common/BrutalistLoader'
import BrutalButton from '@/components/ui/BrutalButton'
import {
  HiOutlinePlus,
  HiOutlineShare,
  HiOutlineChatAlt2,
  HiOutlinePencil,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { m } from 'framer-motion'

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
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <BrutalistLoader />
      </div>
    )
  }

  // ── Active whiteboard view ──
  if (activeWhiteboardId) {
    return (
      <div className="h-screen flex flex-col bg-[#050505]">
        {/* Whiteboard Header */}
        <div className="h-12 border-b-2 border-[#2E2E35] flex items-center justify-between px-4 bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <BrutalButton
              variant="ghost"
              size="sm"
              onClick={() => setActiveWhiteboardId(null)}
            >
              ← Back
            </BrutalButton>
            <div className="h-6 w-px bg-[#2E2E35]" />
            <h2 className="font-mono text-sm font-bold uppercase text-[#F9FAFB]">
              {whiteboards?.find(w => w._id === activeWhiteboardId)?.name || 'Whiteboard'}
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
              LIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <BrutalButton
              variant="secondary"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <HiOutlineShare className="w-4 h-4" />
              Share
            </BrutalButton>
            <BrutalButton
              variant="ghost"
              size="sm"
              onClick={() => toast('Team chat coming soon', { icon: '💬' })}
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

  // ── Listing view ──
  return (
    <div className="p-4">
      {/* Page Header */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 flex items-start justify-between"
      >
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#6366F1] inline-block mb-1.5">
            Canvas
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[#F9FAFB]">
            Whiteboard
          </h1>
          <p className="text-xs text-[#6B7280] mt-1 font-mono">
            Collaborate visually · {currentWorkspace.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {workspaces && workspaces.length > 1 && (
            <select
              value={currentWorkspace._id}
              onChange={(e) => setSelectedWorkspaceId(e.target.value as Id<"workspaces">)}
              className="px-3 py-1.5 bg-[#111111] border-2 border-[#2E2E35] font-mono text-xs text-[#9CA3AF] focus:border-[#6366F1] focus:outline-none"
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
            size="sm"
            disabled={isCreating}
            className="flex items-center gap-2"
          >
            <HiOutlinePlus className="w-4 h-4" />
            {isCreating ? 'Creating...' : 'New Whiteboard'}
          </BrutalButton>
        </div>
      </m.div>

      {/* Whiteboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {whiteboards?.map((whiteboard, i) => {
          const project = whiteboard.projectId
            ? projects?.find(p => p._id === whiteboard.projectId)
            : null

          return (
            <m.div
              key={whiteboard._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              onClick={() => setActiveWhiteboardId(whiteboard._id)}
              className="group cursor-pointer bg-[#111111] border-2 border-[#2E2E35] hover:border-[#6366F1] transition-colors p-4"
            >
              {/* Context badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6B7280] px-1.5 py-0.5 border border-[#2E2E35] bg-[#0A0A0A]">
                  {currentWorkspace?.name}
                </span>
                {project && (
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6B7280] px-1.5 py-0.5 border border-[#2E2E35] bg-[#0A0A0A]">
                    {project.name}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-[#F9FAFB] mb-1 group-hover:text-[#6366F1] transition-colors">
                {whiteboard.name}
              </h3>
              <p className="text-xs text-[#6B7280] mb-3 line-clamp-2">
                {whiteboard.description || 'No description'}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#6B7280] pt-3 border-t border-[#1F1F23]">
                <span>{whiteboard.elements.length} elements</span>
                <span>{whiteboard.collaborators.length} users</span>
              </div>
            </m.div>
          )
        })}

        {/* Empty State */}
        {(!whiteboards || whiteboards.length === 0) && (
          <div className="col-span-full">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="border-2 border-[#2E2E35] border-dashed p-8 text-center"
            >
              <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[#2E2E35] bg-[#0A0A0A] text-[#6B7280]">
                <HiOutlinePencil className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#F9FAFB] mb-1">No Whiteboards Yet</h3>
              <p className="text-xs text-[#6B7280] mb-4 max-w-sm mx-auto font-mono">
                {currentWorkspace
                  ? `Create your first whiteboard for ${currentWorkspace.name} to start collaborating visually.`
                  : 'Select a workspace to get started'}
              </p>
              <BrutalButton
                onClick={handleCreateWhiteboard}
                variant="primary"
                size="sm"
                disabled={isCreating}
                className="flex items-center gap-2 mx-auto"
              >
                <HiOutlinePlus className="w-4 h-4" />
                {isCreating ? 'Creating...' : 'Create First Whiteboard'}
              </BrutalButton>
            </m.div>
          </div>
        )}
      </div>
    </div>
  )
}
