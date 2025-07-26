import { useState, useRef, useEffect } from 'react'
import { HiOutlineUser, HiOutlineClock, HiOutlineChat, HiOutlineDotsVertical, HiOutlinePencil, HiOutlineTrash, HiOutlineDuplicate, HiOutlineLink } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import BrutalBadge from '../../ui/BrutalBadge'
import BrutalAvatar from '../../ui/BrutalAvatar'
import toast from 'react-hot-toast'

interface TaskCardProps {
  task: any
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
}

export default function TaskCard({ task, onEdit, onDelete, onDuplicate }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])
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
      
      <div className="p-16px space-y-12px">
        {/* Header with type, number, and menu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8px">
            <span className="text-xs font-bold text-brutal-info">
              {typeIcons[task.type as keyof typeof typeIcons]}
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-cathode-white/60">
              {task.project?.key}-{task.number}
            </span>
          </div>
          
          {/* Three dots menu */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-4px hover:bg-event-horizon transition-colors"
            >
              <HiOutlineDotsVertical className="w-16px h-16px" />
            </button>
            
            {showMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-4px z-50 bg-carbon-plate border-2 border-basalt-border shadow-brutal min-w-[160px]"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    onEdit?.()
                  }}
                  className="w-full px-16px py-8px text-xs font-mono uppercase text-left hover:bg-event-horizon transition-colors flex items-center gap-8px"
                >
                  <HiOutlinePencil className="w-16px h-16px" />
                  EDIT
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    onDuplicate?.()
                  }}
                  className="w-full px-16px py-8px text-xs font-mono uppercase text-left hover:bg-event-horizon transition-colors flex items-center gap-8px"
                >
                  <HiOutlineDuplicate className="w-16px h-16px" />
                  DUPLICATE
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(`${window.location.origin}/task/${task._id}`)
                    toast.success('Link copied!')
                    setShowMenu(false)
                  }}
                  className="w-full px-16px py-8px text-xs font-mono uppercase text-left hover:bg-event-horizon transition-colors flex items-center gap-8px"
                >
                  <HiOutlineLink className="w-16px h-16px" />
                  COPY LINK
                </button>
                <div className="border-t-2 border-basalt-border" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    onDelete?.()
                  }}
                  className="w-full px-16px py-8px text-xs font-mono uppercase text-left hover:bg-brutal-error hover:text-event-horizon transition-colors flex items-center gap-8px"
                >
                  <HiOutlineTrash className="w-16px h-16px" />
                  DELETE
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title with priority indicator */}
        <div className="flex items-start gap-8px">
          <div className="flex-1">
            <h4 className="text-sm font-bold uppercase tracking-wider text-cathode-white line-clamp-2 break-words">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs font-mono text-cathode-white/60 line-clamp-2 mt-4px break-words">
                {task.description}
              </p>
            )}
          </div>
          {task.priority === 'urgent' && (
            <div className="w-24px h-24px bg-brutal-error flex items-center justify-center animate-brutal-pulse flex-shrink-0">
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
          <div className="flex items-center gap-12px">
            {task.assignee ? (
              <BrutalAvatar
                size="sm"
                src={task.assignee.avatarUrl}
                name={task.assignee.name}
              />
            ) : (
              <div className="w-24px h-24px border-2 border-basalt-border flex items-center justify-center">
                <HiOutlineUser className="w-12px h-12px text-cathode-white/60" />
              </div>
            )}
            
            {task.commentCount > 0 && (
              <div className="flex items-center gap-4px text-xs font-mono uppercase">
                <HiOutlineChat className="w-12px h-12px" />
                <span>{task.commentCount}</span>
              </div>
            )}
          </div>

          <div className="text-xs font-mono uppercase tracking-wider text-cathode-white/60">
            {statusIndicators[task.status as keyof typeof statusIndicators]?.label}
          </div>
        </div>

        {task.dueDate && (
          <div className="flex items-center gap-8px text-xs font-mono uppercase text-cathode-white/60 border-t border-basalt-border pt-8px">
            <HiOutlineClock className="w-12px h-12px" />
            <span className={clsx(
              new Date(task.dueDate) < new Date() && 'text-brutal-error'
            )}>
              DUE {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true }).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}