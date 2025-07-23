import { Link } from 'react-router-dom'
import { HiOutlineClipboardList, HiOutlineUser } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import BrutalBadge from '../../ui/BrutalBadge'
import BrutalProgress from '../../ui/BrutalProgress'

interface ProjectCardProps {
  project: any
  workspaceId: string
  index: number
}

export default function ProjectCard({ project, workspaceId, index }: ProjectCardProps) {
  const statusVariants = {
    planning: 'info' as const,
    active: 'success' as const,
    on_hold: 'warning' as const,
    completed: 'info' as const,
    archived: 'default' as const,
  }

  const statusBorders = {
    planning: 'border-brutal-info',
    active: 'border-brutal-success',
    on_hold: 'border-brutal-warning',
    completed: 'border-basalt-border',
    archived: 'border-basalt-border opacity-50',
  }

  const completionPercentage = project.taskStats?.total > 0
    ? Math.round((project.taskStats.completed / project.taskStats.total) * 100)
    : 0

  // Generate ASCII icon based on project name first letter
  const getProjectIcon = () => {
    const firstLetter = project.name?.[0]?.toUpperCase() || '?'
    return `[${firstLetter}]`
  }

  return (
    <Link 
      to={`/workspace/${workspaceId}/project/${project._id}`}
      className={clsx(
        'block bg-carbon-plate border-2 shadow-brutal',
        'hover:shadow-brutal-hover hover:translate-x-[-2px] hover:translate-y-[-2px]',
        'transition-all duration-200 ease-brutal-out',
        'relative overflow-hidden animate-brutal-fade',
        statusBorders[project.status as keyof typeof statusBorders]
      )}
      style={{ 
        borderRadius: '0 !important',
        animationDelay: `${index * 100}ms`
      }}
    >
      <div className="p-32px">
        <div className="flex items-start justify-between mb-24px">
          <div className="flex items-center gap-16px">
            <div className="w-48px h-48px border-2 border-basalt-border flex items-center justify-center bg-event-horizon">
              <span className="text-xl font-bold text-cathode-white font-mono">
                {getProjectIcon()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-cathode-white">
                {project.name}
              </h3>
              <p className="text-xs font-mono uppercase tracking-wider text-cathode-white/60">
                {project.key}
              </p>
            </div>
          </div>
          <BrutalBadge variant={statusVariants[project.status as keyof typeof statusVariants]}>
            {project.status.toUpperCase().replace('_', ' ')}
          </BrutalBadge>
        </div>

        {project.description && (
          <p className="text-sm font-mono text-cathode-white/70 mb-24px line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="space-y-16px mb-24px">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider">
            <span className="text-cathode-white/60">PROGRESS</span>
            <span className="font-bold text-cathode-white">{completionPercentage}%</span>
          </div>
          <BrutalProgress 
            value={project.taskStats?.completed || 0} 
            max={project.taskStats?.total || 100}
            variant={completionPercentage === 100 ? 'glitch' : 'default'}
          />
        </div>

        <div className="flex items-center gap-24px text-xs font-mono uppercase tracking-wider text-cathode-white/60 border-t-2 border-basalt-border pt-16px">
          <div className="flex items-center gap-8px">
            <HiOutlineClipboardList className="w-16px h-16px" />
            <span>{project.taskStats?.total || 0} TASKS</span>
          </div>
          {project.lead && (
            <div className="flex items-center gap-8px">
              <HiOutlineUser className="w-16px h-16px" />
              <span>{project.lead.name}</span>
            </div>
          )}
        </div>

        <div className="mt-16px text-xs font-mono uppercase tracking-wider text-cathode-white/50">
          UPDATED {formatDistanceToNow(new Date(project.updatedAt)).toUpperCase()} AGO
        </div>

        {/* Sprint indicator */}
        {project.activeSprint && (
          <div className="absolute top-0 right-0 px-8px py-2px bg-brutal-info text-event-horizon text-xs font-bold uppercase">
            SPRINT ACTIVE
          </div>
        )}
      </div>
    </Link>
  )
}