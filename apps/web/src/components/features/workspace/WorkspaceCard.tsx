import { Link } from 'react-router-dom'
import { HiOutlineUsers, HiOutlineFolder } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

interface WorkspaceCardProps {
  workspace: any
  index: number
}

export default function WorkspaceCard({ workspace, index }: WorkspaceCardProps) {
  const roleColors: Record<string, { text: string; border: string; bg: string }> = {
    owner: { text: '#EF4444', border: 'border-[#EF4444]/30', bg: 'bg-[#EF4444]/10' },
    admin: { text: '#F59E0B', border: 'border-[#F59E0B]/30', bg: 'bg-[#F59E0B]/10' },
    member: { text: '#6366F1', border: 'border-[#6366F1]/30', bg: 'bg-[#6366F1]/10' },
    viewer: { text: '#6B7280', border: 'border-[#2E2E35]', bg: 'bg-[#2E2E35]/30' },
  }

  const role = workspace.role as string || 'viewer'
  const colors = roleColors[role] || roleColors.viewer

  return (
    <Link
      to={`/workspace/${workspace._id}`}
      className="block bg-[#111111] border-2 border-[#2E2E35] hover:border-[#6366F1] transition-all duration-200 group"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F9FAFB] truncate">
              {workspace.name}
            </h3>
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
        </div>

        <div className="mt-1.5 text-[10px] font-mono text-[#6B7280]/60">
          Created {formatDistanceToNow(new Date(workspace.createdAt))} ago
        </div>
      </div>
    </Link>
  )
}
