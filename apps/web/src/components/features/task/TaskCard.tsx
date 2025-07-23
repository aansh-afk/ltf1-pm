import { HiOutlineUser, HiOutlineClock, HiOutlineChat } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import BrutalBadge from '../../ui/BrutalBadge'
import BrutalAvatar from '../../ui/BrutalAvatar'

interface TaskCardProps {
  task: any
}

export default function TaskCard({ task }: TaskCardProps) {
  const priorityColors = {
    urgent: 'border-brutal-error',
    high: 'border-brutal-warning',
    medium: 'border-brutal-info',
    low: 'border-basalt-border',
  }

  const statusIndicators = {
    todo: { color: 'bg-basalt-border', label: 'TODO' },
    in_progress: { color: 'bg-brutal-info', label: 'IN_PROGRESS' },
    blocked: { color: 'bg-brutal-error', label: 'BLOCKED' },
    done: { color: 'bg-brutal-success', label: 'DONE' },
  }

  const typeIcons = {
    bug: '[BUG]',
    feature: '[FEAT]',
    improvement: '[IMPR]',
    task: '[TASK]',
    epic: '[EPIC]',
  }

  return (
    <div 
      className={clsx(
        'bg-carbon-plate border-2 shadow-brutal',
        'hover:shadow-brutal-hover hover:translate-x-[-2px] hover:translate-y-[-2px]',
        'transition-all duration-200 ease-brutal-out cursor-pointer',
        'relative overflow-hidden',
        priorityColors[task.priority as keyof typeof priorityColors]
      )}
      style={{ borderRadius: '0 !important' }}
    >
      {/* Status indicator bar */}
      <div 
        className={clsx(
          'absolute top-0 left-0 w-full h-2px',
          statusIndicators[task.status as keyof typeof statusIndicators]?.color
        )}
      />
      
      <div className="p-24px space-y-16px">
        <div className="flex items-start justify-between gap-16px">
          <div className="flex-1">
            <div className="flex items-center gap-8px mb-8px">
              <span className="text-xs font-bold text-brutal-info">
                {typeIcons[task.type as keyof typeof typeIcons]}
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-cathode-white/60">
                {task.project?.key}-{task.number}
              </span>
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-cathode-white line-clamp-2">
              {task.title}
            </h4>
          </div>
          {task.priority === 'urgent' && (
            <div className="w-32px h-32px bg-brutal-error flex items-center justify-center animate-brutal-pulse">
              <span className="text-xs font-bold text-event-horizon">!</span>
            </div>
          )}
        </div>

        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-8px">
            {task.labels.slice(0, 3).map((label: string) => (
              <BrutalBadge key={label} size="sm">{label}</BrutalBadge>
            ))}
            {task.labels.length > 3 && (
              <BrutalBadge size="sm" variant="info">+{task.labels.length - 3}</BrutalBadge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-16px">
            {task.assignee ? (
              <BrutalAvatar
                size="sm"
                src={task.assignee.avatarUrl}
                name={task.assignee.name}
              />
            ) : (
              <div className="w-32px h-32px border-2 border-basalt-border flex items-center justify-center">
                <HiOutlineUser className="w-16px h-16px text-cathode-white/60" />
              </div>
            )}
            
            {task.commentCount > 0 && (
              <div className="flex items-center gap-8px text-xs font-mono uppercase">
                <HiOutlineChat className="w-16px h-16px" />
                <span>{task.commentCount}</span>
              </div>
            )}
          </div>

          <div className="text-xs font-mono uppercase tracking-wider text-cathode-white/60">
            {statusIndicators[task.status as keyof typeof statusIndicators]?.label}
          </div>
        </div>

        {task.dueDate && (
          <div className="flex items-center gap-8px text-xs font-mono uppercase text-cathode-white/60 border-t-2 border-basalt-border pt-16px">
            <HiOutlineClock className="w-16px h-16px" />
            <span>DUE {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true }).toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  )
}