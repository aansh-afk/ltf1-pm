import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import WhiteboardCanvas from '@/components/features/whiteboard/WhiteboardCanvas'
import BrutalistLoader from '@/components/common/BrutalistLoader'
import BrutalButton from '@/components/ui/BrutalButton'
import { HiOutlinePlus } from 'react-icons/hi'

export default function WhiteboardPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId?: string }>()
  const [activeWhiteboardId, setActiveWhiteboardId] = useState<Id<"whiteboards"> | null>(null)

  // Get current workspace
  const workspaces = useQuery(api.workspaces.listWorkspaces)
  const currentWorkspace = workspaces?.[0]

  // Get whiteboards
  const whiteboards = useQuery(
    api.whiteboard.getWhiteboards,
    currentWorkspace ? {
      workspaceId: currentWorkspace._id,
      projectId: projectId as Id<"projects"> | undefined
    } : 'skip'
  )

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
      <div className="mb-24px flex items-center justify-between">
        <div>
          <h1 className="text-brutal-3xl font-bold mb-8px">WHITEBOARD COLLABORATION</h1>
          <p className="text-[var(--theme-muted)]">
            Create and collaborate on visual whiteboards in real-time
          </p>
        </div>
        <BrutalButton
          onClick={() => setActiveWhiteboardId(null as any)}
          variant="primary"
          icon={<HiOutlinePlus className="w-20px h-20px" />}
        >
          NEW WHITEBOARD
        </BrutalButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16px">
        {whiteboards?.map(whiteboard => (
          <button
            key={whiteboard._id}
            onClick={() => setActiveWhiteboardId(whiteboard._id)}
            className="p-24px border-2 border-[var(--theme-border)] hover:border-[var(--theme-primary)] bg-[var(--theme-background-secondary)] text-left transition-all"
          >
            <h3 className="text-brutal-lg font-bold mb-8px">{whiteboard.name}</h3>
            <p className="text-sm text-[var(--theme-muted)] mb-12px">
              {whiteboard.description || 'No description'}
            </p>
            <div className="flex items-center gap-8px text-xs text-[var(--theme-muted)]">
              <span>{whiteboard.elements.length} elements</span>
              <span>•</span>
              <span>Version {whiteboard.version}</span>
            </div>
          </button>
        ))}

        {(!whiteboards || whiteboards.length === 0) && (
          <div className="col-span-full text-center py-48px">
            <p className="text-brutal-lg font-bold mb-16px">NO WHITEBOARDS YET</p>
            <BrutalButton
              onClick={() => setActiveWhiteboardId(null as any)}
              variant="primary"
            >
              CREATE FIRST WHITEBOARD
            </BrutalButton>
          </div>
        )}
      </div>
    </div>
  )
}
