import { useState, useRef, useEffect } from 'react'
import { HiOutlineClock, HiOutlineChat, HiOutlineDotsVertical, HiOutlinePencil, HiOutlineTrash, HiOutlineDuplicate, HiOutlineLink, HiOutlineInformationCircle } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import BrutalBadge from '../../ui/BrutalBadge'
import BrutalCard from '../../ui/BrutalCard'
import UserDisplay from '../user/UserDisplay'
import toast from 'react-hot-toast'

interface TaskCardProps {
  task: any
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onViewDetails?: () => void
  isCompact?: boolean
}

export default function TaskCard({ task, onEdit, onDelete, onDuplicate, onViewDetails, isCompact = false }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

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
    low: 'border-[var(--theme-border)]',
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onViewDetails?.()
    } else if (e.key === 'e' && e.ctrlKey) {
      e.preventDefault()
      onEdit?.()
    } else if (e.key === 'Delete') {
      e.preventDefault()
      onDelete?.()
    }
  }

  return (
    <BrutalCard
      ref={cardRef}
      variant="elevated"
      padding={isCompact ? 'sm' : 'md'}
      hoverable={true}
      className={clsx(
        'relative overflow-hidden transition-all duration-200',
        priorityColors[task.priority as keyof typeof priorityColors]
      )}
      style={{ borderRadius: '0 !important' }}
      role="article"
      aria-label={`Task: ${task.title}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={onViewDetails}
    >
      {/* Status indicator bar */}
      <div
        className={clsx(
          'absolute top-0 left-0 w-full',
          isCompact ? 'h-1px' : 'h-2px',
          statusIndicators[task.status as keyof typeof statusIndicators]?.color
        )}
      />

      <div className={clsx(
        isCompact ? "p-8px space-y-4px" : "p-16px space-y-12px"
      )}>
        {/* Header with type, number, and menu */}
        <div className="flex items-center justify-between mb-4px">
          <div className="flex items-center gap-8px">
            <span className={clsx(
              "text-xs font-bold px-6px py-2px",
              task.type === 'bug' && "text-brutal-error bg-brutal-error/10",
              task.type === 'feature' && "text-brutal-success bg-brutal-success/10",
              task.type === 'improvement' && "text-brutal-info bg-brutal-info/10",
              task.type === 'task' && "text-[var(--theme-foreground)] bg-basalt-border/20",
              task.type === 'epic' && "text-brutal-warning bg-brutal-warning/10"
            )}>
              {typeIcons[task.type as keyof typeof typeIcons]}
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--theme-foreground)]/60">
              {task.project?.key}-{task.number}
            </span>
            {(task.priority === 'urgent' || task.priority === 'high') && (
              <span className={clsx(
                "text-xs font-bold px-4px py-1px",
                task.priority === 'urgent' && "text-brutal-error bg-brutal-error/20 animate-brutal-pulse",
                task.priority === 'high' && "text-brutal-warning bg-brutal-warning/20"
              )}>
                {task.priority === 'urgent' ? '🔥' : '⚡'}
              </span>
            )}
          </div>

          {/* Three dots menu */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-4px hover:bg-[var(--theme-background-secondary)] transition-colors"
            >
              <HiOutlineDotsVertical className="w-16px h-16px" />
            </button>

            {showMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-4px z-50 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] shadow-brutal min-w-[160px]"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    onEdit?.()
                  }}
                  className="w-full px-16px py-8px text-xs font-mono uppercase text-left hover:bg-[var(--theme-background-secondary)] transition-colors flex items-center gap-8px"
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
                  className="w-full px-16px py-8px text-xs font-mono uppercase text-left hover:bg-[var(--theme-background-secondary)] transition-colors flex items-center gap-8px"
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
                  className="w-full px-16px py-8px text-xs font-mono uppercase text-left hover:bg-[var(--theme-background-secondary)] transition-colors flex items-center gap-8px"
                >
                  <HiOutlineLink className="w-16px h-16px" />
                  COPY LINK
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    onViewDetails?.()
                  }}
                  className="w-full px-16px py-8px text-xs font-mono uppercase text-left hover:bg-[var(--theme-background-secondary)] transition-colors flex items-center gap-8px"
                >
                  <HiOutlineInformationCircle className="w-16px h-16px" />
                  MORE INFO
                </button>
                <div className="border-t-2 border-[var(--theme-border)]" />
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
        {isCompact ? (
          // Compact mode: title and tags in vertical layout
          <>
            <h4 className="font-bold text-sm uppercase tracking-wider text-[var(--theme-foreground)] break-words line-clamp-1">
              {task.title}
            </h4>

            {/* Compact tags, user, and status */}
            <div className="flex items-center justify-between gap-8px">
              <div className="flex items-center gap-6px flex-1 min-w-0">
                <UserDisplay
                  userId={task.assigneeId}
                  size="xs"
                  showStatus={false}
                  compact={true}
                />

                {task.labels && task.labels.length > 0 && (
                  <div className="flex gap-4px overflow-hidden">
                    {task.labels.slice(0, 1).map((label: string) => (
                      <BrutalBadge key={label} size="xs">{label}</BrutalBadge>
                    ))}
                    {task.labels.length > 1 && (
                      <BrutalBadge size="xs" variant="info">+{task.labels.length - 1}</BrutalBadge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4px text-xs font-mono">
                <span className="text-[var(--theme-foreground)]/60">
                  {task.points || 0}pts
                </span>
                <span className="text-[var(--theme-foreground)]/40">•</span>
                <span className="uppercase tracking-wider text-[var(--theme-foreground)]/60">
                  {statusIndicators[task.status as keyof typeof statusIndicators]?.label}
                </span>
              </div>
            </div>
          </>
        ) : (
          // Normal mode: vertical layout
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-[var(--theme-foreground)] break-words line-clamp-2 mb-4px">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs font-mono text-[var(--theme-foreground)]/60 line-clamp-2 break-words">
                {task.description}
              </p>
            )}
          </div>
        )}

        {!isCompact && task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-8px">
            {task.labels.slice(0, 3).map((label: string) => (
              <BrutalBadge key={label} size="sm">{label}</BrutalBadge>
            ))}
            {task.labels.length > 3 && (
              <BrutalBadge size="sm" variant="info">+{task.labels.length - 3}</BrutalBadge>
            )}
          </div>
        )}

        {!isCompact && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-12px">
              <UserDisplay
                userId={task.assigneeId}
                size="sm"
                showStatus={true}
                compact={true}
              />

              {task.commentCount > 0 && (
                <div className="flex items-center gap-4px text-xs font-mono uppercase text-[var(--theme-foreground)]/60">
                  <HiOutlineChat className="w-12px h-12px" />
                  <span>{task.commentCount}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-8px">
              <div className="text-xs font-mono uppercase tracking-wider text-[var(--theme-foreground)]/60">
                {statusIndicators[task.status as keyof typeof statusIndicators]?.label}
              </div>
              {task.points && (
                <div className="text-xs font-mono text-primary-brutalist">
                  {task.points}pts
                </div>
              )}
            </div>
          </div>
        )}

        {!isCompact && task.dueDate && (
          <div className="flex items-center gap-8px text-xs font-mono uppercase text-[var(--theme-foreground)]/60 border-t border-[var(--theme-border)] pt-8px">
            <HiOutlineClock className="w-12px h-12px" />
            <span className={clsx(
              new Date(task.dueDate) < new Date() && 'text-brutal-error'
            )}>
              DUE {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true }).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </BrutalCard>
  )
}