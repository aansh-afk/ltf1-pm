import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { HiOutlinePlus, HiOutlineBriefcase, HiOutlineGlobeAlt, HiOutlineUsers } from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import CreateWorkspaceModal from '@/components/features/workspace/CreateWorkspaceModal'
import WorkspaceCard from '@/components/features/workspace/WorkspaceCard'
import { BrutalButton, BrutalCard } from '@/components/ui'
import { motion } from 'framer-motion'

export default function WorkspacesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)

  if (workspaces === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--theme-background)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-[var(--theme-background)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 border-b-2 border-[var(--theme-border)] pb-6 gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2 flex items-center gap-4">
            <HiOutlineGlobeAlt className="w-12 h-12 md:w-16 md:h-16 text-[var(--theme-primary)] animate-pulse" />
            MISSION_SELECT
          </h1>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60 uppercase tracking-widest pl-2">
            SELECT ACTIVE THEATER OF OPERATIONS
          </p>
        </div>
        <BrutalButton
          onClick={() => setShowCreateModal(true)}
          variant="glitch"
          className="flex items-center gap-2"
        >
          <HiOutlinePlus className="w-5 h-5" />
          ESTABLISH NEW BASE
        </BrutalButton>
      </div>

      {/* Workspaces Grid */}
      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <BrutalCard variant="glitch" className="p-12 text-center border-dashed max-w-lg">
            <HiOutlineBriefcase className="w-24 h-24 text-[var(--theme-foreground)]/20 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">NO ACTIVE OPERATIONS</h2>
            <p className="font-mono text-sm text-[var(--theme-foreground)]/60 mb-8">
              No workspaces detected in the system. Initialize a new workspace to begin operations.
            </p>
            <BrutalButton
              onClick={() => setShowCreateModal(true)}
              variant="primary"
            >
              INITIALIZE WORKSPACE
            </BrutalButton>
          </BrutalCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace: any, index: number) => (
            <motion.div
              key={workspace._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
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
            transition={{ delay: workspaces.length * 0.1 }}
            onClick={() => setShowCreateModal(true)}
            className="group cursor-pointer"
          >
            <div className="h-full min-h-[200px] border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/50 hover:bg-[var(--theme-background-secondary)] hover:border-[var(--theme-primary)] transition-all flex flex-col items-center justify-center p-6 gap-4">
              <div className="w-16 h-16 border-2 border-[var(--theme-border)] group-hover:border-[var(--theme-primary)] flex items-center justify-center rounded-full transition-colors">
                <HiOutlinePlus className="w-8 h-8 text-[var(--theme-foreground)]/50 group-hover:text-[var(--theme-primary)] transition-colors" />
              </div>
              <span className="font-mono text-sm font-bold text-[var(--theme-foreground)]/50 group-hover:text-[var(--theme-primary)] transition-colors">
                DEPLOY NEW WORKSPACE
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