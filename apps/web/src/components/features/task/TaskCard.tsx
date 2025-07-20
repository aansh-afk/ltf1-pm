import { HiOutlineUser, HiOutlineClock, HiOutlineChat, HiOutlineExclamation } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

interface TaskCardProps {
  task: any
}

export default function TaskCard({ task }: TaskCardProps) {
  const priorityColors = {
    urgent: 'text-error border-error',
    high: 'text-warning border-warning',
    medium: 'text-info border-info',
    low: 'text-base-content/50 border-base-content/50',
  }

  const typeIcons = {
    bug: '🐛',
    feature: '✨',
    improvement: '💡',
    task: '📋',
    epic: '🎯',
  }

  return (
    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="card-body p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{typeIcons[task.type as keyof typeof typeIcons]}</span>
              <span className="text-xs text-base-content/60">
                {task.project?.key}-{task.number}
              </span>
            </div>
            <h4 className="text-sm font-medium line-clamp-2">{task.title}</h4>
          </div>
          {task.priority === 'urgent' && (
            <HiOutlineExclamation className="w-4 h-4 text-error flex-shrink-0" />
          )}
        </div>

        {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.slice(0, 3).map((label: string) => (
              <span key={label} className="badge badge-xs">{label}</span>
            ))}
            {task.labels.length > 3 && (
              <span className="badge badge-xs">+{task.labels.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-base-content/60">
          <div className="flex items-center gap-3">
            {task.assignee ? (
              <div className="flex items-center gap-1">
                <div className="avatar">
                  <div className="w-5 h-5 rounded-full">
                    {task.assignee.avatarUrl ? (
                      <img src={task.assignee.avatarUrl} alt={task.assignee.name} />
                    ) : (
                      <div className="bg-primary text-primary-content flex items-center justify-center text-[10px]">
                        {task.assignee.name[0]}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <HiOutlineUser className="w-4 h-4" />
            )}
            
            {task.commentCount > 0 && (
              <div className="flex items-center gap-1">
                <HiOutlineChat className="w-3 h-3" />
                <span>{task.commentCount}</span>
              </div>
            )}
          </div>

          <div className={clsx(
            'w-2 h-2 rounded-full border-2',
            priorityColors[task.priority as keyof typeof priorityColors]
          )} />
        </div>

        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-base-content/60">
            <HiOutlineClock className="w-3 h-3" />
            <span>Due {formatDistanceToNow(new Date(task.dueDate))} ago</span>
          </div>
        )}
      </div>
    </div>
  )
}