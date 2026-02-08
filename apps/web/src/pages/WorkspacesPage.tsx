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
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#6B7280] inline-block mb-1.5">
            Workspaces
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[#F9FAFB] flex items-center gap-2">
            <HiOutlineGlobeAlt className="w-5 h-5 text-[#6366F1]" />
            Mission Select
          </h1>
          <p className="text-xs text-[#6B7280] mt-1 font-mono">
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
        <div className="border-2 border-[#2E2E35] border-dashed p-8 text-center">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[#2E2E35] text-[#6B7280]">
            <HiOutlineBriefcase className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#F9FAFB] mb-1">No Active Workspaces</h3>
          <p className="text-xs text-[#6B7280] mb-4 max-w-sm mx-auto">
            No workspaces detected. Initialize a new workspace to begin operations.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#6366F1] text-white text-xs font-semibold font-mono uppercase tracking-wider border-2 border-[#4F46E5]"
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
            <div className="h-full min-h-[140px] border-2 border-dashed border-[#2E2E35] bg-[#0A0A0A]/50 hover:bg-[#0A0A0A] hover:border-[#6366F1] transition-all flex flex-col items-center justify-center p-4 gap-3">
              <div className="w-10 h-10 border-2 border-[#2E2E35] group-hover:border-[#6366F1] flex items-center justify-center transition-colors">
                <HiOutlinePlus className="w-5 h-5 text-[#6B7280] group-hover:text-[#6366F1] transition-colors" />
              </div>
              <span className="font-mono text-xs font-semibold text-[#6B7280] group-hover:text-[#6366F1] uppercase tracking-wider transition-colors">
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
