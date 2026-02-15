import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { HiOutlinePlus, HiOutlineBriefcase, HiOutlineGlobeAlt } from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import CreateWorkspaceModal from '@/components/features/workspace/CreateWorkspaceModal'
import WorkspaceCard from '@/components/features/workspace/WorkspaceCard'
import BrutalButton from '@/components/ui/BrutalButton'
import { motion } from 'framer-motion'

export default function WorkspacesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)

  if (workspaces === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] inline-block mb-1.5">
            Workspaces
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[var(--theme-foreground)] flex items-center gap-2">
            <HiOutlineGlobeAlt className="w-5 h-5 text-[var(--theme-primary)]" />
            Mission Select
          </h1>
          <p className="text-xs text-[var(--theme-foreground-tertiary)] mt-1 font-mono">
            Select active theater of operations
          </p>
        </div>
        <BrutalButton
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          size="sm"
          className="flex items-center gap-1.5"
        >
          <HiOutlinePlus className="w-3.5 h-3.5" />
          New Workspace
        </BrutalButton>
      </div>

      {/* Workspaces Grid */}
      {workspaces.length === 0 ? (
        <div className="border-2 border-[var(--theme-border)] border-dashed p-8 text-center">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
            <HiOutlineBriefcase className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[var(--theme-foreground)] mb-1">No Active Workspaces</h3>
          <p className="text-xs text-[var(--theme-foreground-tertiary)] mb-4 max-w-sm mx-auto">
            No workspaces detected. Initialize a new workspace to begin operations.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[var(--theme-primary)] text-white text-xs font-semibold font-mono uppercase tracking-wider border-2 border-[var(--theme-primary-active)]"
          >
            Initialize Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {workspaces.map((workspace: any, index: number) => (
            <motion.div
              key={workspace._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.5 }}
            >
              <WorkspaceCard
                workspace={workspace}
                index={index}
              />
            </motion.div>
          ))}

          {/* Add New Card Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: workspaces.length * 0.06, duration: 0.5 }}
            onClick={() => setShowCreateModal(true)}
            className="group cursor-pointer"
          >
            <div className="h-full min-h-[140px] border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/50 hover:bg-[var(--theme-background-secondary)] hover:border-[var(--theme-border-hover)] transition-all flex flex-col items-center justify-center p-4 gap-3">
              <div className="w-10 h-10 border-2 border-[var(--theme-border)] group-hover:border-[var(--theme-border-hover)] flex items-center justify-center transition-colors">
                <HiOutlinePlus className="w-5 h-5 text-[var(--theme-foreground-tertiary)] group-hover:text-[var(--theme-primary)] transition-colors" />
              </div>
              <span className="font-mono text-xs font-semibold text-[var(--theme-foreground-tertiary)] group-hover:text-[var(--theme-primary)] uppercase tracking-wider transition-colors">
                Deploy New Workspace
              </span>
            </div>
          </motion.div>
        </div>
      )}

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}
