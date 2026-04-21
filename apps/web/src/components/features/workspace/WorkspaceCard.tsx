import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineUsers, HiOutlineFolder, HiOutlineTrash } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import toast from 'react-hot-toast'

interface WorkspaceCardProps {
  workspace: any
  index: number
}

export default function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteDemo = useMutation(api.onboarding.seedDemo.deleteMyDemo)

  const roleColors: Record<string, { text: string; border: string; bg: string }> = {
    owner: { text: '#EF4444', border: 'border-[#EF4444]/30', bg: 'bg-[#EF4444]/10' },
    admin: { text: '#F59E0B', border: 'border-[#F59E0B]/30', bg: 'bg-[#F59E0B]/10' },
    member: { text: '#6366F1', border: 'border-[#6366F1]/30', bg: 'bg-[#6366F1]/10' },
    viewer: { text: '#6B7280', border: 'border-[#2E2E35]', bg: 'bg-[#2E2E35]/30' },
  }

  const role = workspace.role as string || 'viewer'
  const colors = roleColors[role] || roleColors.viewer
  const isDemo = workspace.isDemo === true

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setDeleting(true)
    try {
      const count = await deleteDemo({})
      if (count > 0) {
        toast.success('Demo workspace removed')
      } else {
        toast('No demo workspace to remove')
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete demo')
      setDeleting(false)
    }
  }

  return (
    <Link
      to={`/workspace/${workspace._id}`}
      className={clsx(
        'block bg-[#111111] border-2 transition-all duration-200 group',
        isDemo
          ? 'border-[#6366F1]/60 hover:border-[#6366F1]'
          : 'border-[#2E2E35] hover:border-[#6366F1]',
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {isDemo && (
                <span
                  className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest border border-[#6366F1] text-[#6366F1] bg-[#6366F1]/10"
                  title="Seeded tutorial data — safe to delete"
                >
                  DEMO
                </span>
              )}
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#F9FAFB] truncate">
                {workspace.name}
              </h3>
            </div>
            {workspace.description && (
              <p className="text-xs font-mono text-[#6B7280] line-clamp-1 mt-1">
                {workspace.description}
              </p>
            )}
          </div>
          <span
            className={clsx(
              'px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border shrink-0',
              colors.border, colors.bg
            )}
            style={{ color: colors.text }}
          >
            {workspace.role}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-[#6B7280] py-2 border-t border-[#1F1F23]">
          <div className="flex items-center gap-1">
            <HiOutlineUsers className="w-3.5 h-3.5" />
            <span>{workspace.memberCount} members</span>
          </div>
          <div className="flex items-center gap-1">
            <HiOutlineFolder className="w-3.5 h-3.5" />
            <span>{workspace.projectCount || 0} projects</span>
          </div>
          {isDemo && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={deleting}
              className={clsx(
                'ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 border text-[9px] font-mono uppercase tracking-widest transition-colors',
                confirmDelete
                  ? 'border-[#EF4444] text-[#EF4444] bg-[#EF4444]/10'
                  : 'border-[#2E2E35] text-[#6B7280] hover:border-[#EF4444] hover:text-[#EF4444]',
              )}
              title={confirmDelete ? 'Click again to confirm' : 'Remove the tutorial workspace'}
            >
              <HiOutlineTrash className="w-3 h-3" />
              {deleting ? 'DELETING...' : confirmDelete ? 'CONFIRM?' : 'DELETE DEMO'}
            </button>
          )}
        </div>

        <div className="mt-1.5 text-[10px] font-mono text-[#6B7280]/60">
          Created {formatDistanceToNow(new Date(workspace.createdAt))} ago
        </div>
      </div>
    </Link>
  )
}
