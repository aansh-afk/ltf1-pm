import { Link } from 'react-router-dom'
import { HiOutlineClipboardList, HiOutlineUser } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import BrutalProgress from '../../ui/BrutalProgress'

interface ProjectCardProps {
  project: any
  workspaceId: string
  index: number
}

export default function ProjectCard({ project, workspaceId, index }: ProjectCardProps) {
  const statusColors: Record<string, { text: string; border: string; bg: string; label: string }> = {
    planning: { text: '#06B6D4', border: 'border-[#06B6D4]/30', bg: 'bg-[#06B6D4]/10', label: 'PLANNING' },
    active: { text: '#22C55E', border: 'border-[#22C55E]/30', bg: 'bg-[#22C55E]/10', label: 'ACTIVE' },
    on_hold: { text: '#F59E0B', border: 'border-[#F59E0B]/30', bg: 'bg-[#F59E0B]/10', label: 'ON HOLD' },
    completed: { text: '#8B5CF6', border: 'border-[#8B5CF6]/30', bg: 'bg-[#8B5CF6]/10', label: 'COMPLETED' },
    archived: { text: '#6B7280', border: 'border-[#2E2E35]', bg: 'bg-[#2E2E35]/30', label: 'ARCHIVED' },
  }

  const status = (project.status as string) || 'planning'
  const colors = statusColors[status] || statusColors.planning

  const completionPercentage = project.taskStats?.total > 0
    ? Math.round((project.taskStats.completed / project.taskStats.total) * 100)
    : 0

  return (
    <Link
      to={`/workspace/${workspaceId}/project/${project._id}`}
      className={clsx(
        'block bg-[#111111] border-2 border-[#2E2E35] hover:border-[#22C55E] transition-all duration-200 group relative overflow-hidden',
        status === 'archived' && 'opacity-60'
      )}
    >
      <div className="p-4">
        {/* Header: Key + Name + Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-mono font-semibold text-[#6B7280] uppercase tracking-wider">
              {project.key}
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F9FAFB] truncate">
              {project.name}
            </h3>
          </div>
          <span
            className={clsx(
              'px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border shrink-0',
              colors.border, colors.bg
            )}
            style={{ color: colors.text }}
          >
            {colors.label}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-xs font-mono text-[#6B7280] line-clamp-1 mb-3">
            {project.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280]">Progress</span>
            <span className="text-[10px] font-mono font-bold text-[#F9FAFB]">{completionPercentage}%</span>
          </div>
          <BrutalProgress
            value={project.taskStats?.completed || 0}
            max={project.taskStats?.total || 100}
            variant={completionPercentage === 100 ? 'glitch' : 'default'}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-[#6B7280] py-2 border-t border-[#1F1F23]">
          <div className="flex items-center gap-1">
            <HiOutlineClipboardList className="w-3.5 h-3.5" />
            <span>{project.taskStats?.total || 0} tasks</span>
          </div>
          {project.lead && (
            <div className="flex items-center gap-1">
              <HiOutlineUser className="w-3.5 h-3.5" />
              <span>{project.lead.name}</span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="mt-1.5 text-[10px] font-mono text-[#6B7280]/60">
          Updated {formatDistanceToNow(new Date(project.updatedAt))} ago
        </div>

        {/* Sprint indicator */}
        {project.activeSprint && (
          <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-[#22C55E] text-[#050505] text-[10px] font-bold uppercase tracking-wider">
            Sprint
          </div>
        )}
      </div>
    </Link>
  )
}
