import { useState, useRef, useEffect } from 'react'
import { HiOutlineClock, HiOutlineChat, HiOutlineDotsVertical, HiOutlinePencil, HiOutlineTrash, HiOutlineDuplicate, HiOutlineLink, HiOutlineInformationCircle } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import BrutalBadge from '../../ui/BrutalBadge'
import BrutalCard from '../../ui/BrutalCard'
import UserDisplay from '../user/UserDisplay'
import toast from 'react-hot-toast'

// --- Sub-components ---

interface TaskContextMenuProps {
  taskId: string
  onEdit?: () => void
  onDuplicate?: () => void
  onViewDetails?: () => void
  onDelete?: () => void
  onClose: () => void
}

function TaskContextMenu({ taskId, onEdit, onDuplicate, onViewDetails, onDelete, onClose }: TaskContextMenuProps) {
  return (
    <div
      className="absolute right-0 top-full mt-4px z-50 bg-[#050505] border-2 border-[#2E2E35] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] min-w-[160px]"
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
          onEdit?.()
        }}
        className="w-full px-[10px] py-[4px] text-xs font-['IBM_Plex_Mono',monospace] uppercase text-left hover:bg-[#0A0A0A] transition-colors flex items-center gap-[4px]"
      >
        <HiOutlinePencil className="w-16px h-16px" />
        EDIT
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
          onDuplicate?.()
        }}
        className="w-full px-[10px] py-[4px] text-xs font-['IBM_Plex_Mono',monospace] uppercase text-left hover:bg-[#0A0A0A] transition-colors flex items-center gap-[4px]"
      >
        <HiOutlineDuplicate className="w-16px h-16px" />
        DUPLICATE
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          navigator.clipboard.writeText(`${window.location.origin}/task/${taskId}`)
          toast.success('Link copied!')
          onClose()
        }}
        className="w-full px-[10px] py-[4px] text-xs font-['IBM_Plex_Mono',monospace] uppercase text-left hover:bg-[#0A0A0A] transition-colors flex items-center gap-[4px]"
      >
        <HiOutlineLink className="w-16px h-16px" />
        COPY LINK
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
          onViewDetails?.()
        }}
        className="w-full px-[10px] py-[4px] text-xs font-['IBM_Plex_Mono',monospace] uppercase text-left hover:bg-[#0A0A0A] transition-colors flex items-center gap-[4px]"
      >
        <HiOutlineInformationCircle className="w-16px h-16px" />
        MORE INFO
      </button>
      <div className="border-t-2 border-[#2E2E35]" />
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
          onDelete?.()
        }}
        className="w-full px-[10px] py-[4px] text-xs font-['IBM_Plex_Mono',monospace] uppercase text-left hover:bg-[#EF4444] hover:text-[#050505] transition-colors flex items-center gap-[4px]"
      >
        <HiOutlineTrash className="w-16px h-16px" />
        DELETE
      </button>
    </div>
  )
}

interface TaskNormalModeContentProps {
  task: any
  statusIndicators: Record<string, { color: string; label: string }>
}

function TaskNormalModeContent({ task, statusIndicators }: TaskNormalModeContentProps) {
  return (
    <>
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-[4px]">
          {task.labels.slice(0, 3).map((label: string) => (
            <BrutalBadge key={label} size="sm">{label}</BrutalBadge>
          ))}
          {task.labels.length > 3 && (
            <BrutalBadge size="sm" variant="info">+{task.labels.length - 3}</BrutalBadge>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[6px]">
          <UserDisplay
            userId={task.assigneeId}
            size="sm"
            showStatus={true}
            compact={true}
          />

          {task.commentCount > 0 && (
            <div className="flex items-center gap-4px text-xs font-['IBM_Plex_Mono',monospace] uppercase text-[#6B7280]">
              <HiOutlineChat className="w-12px h-12px" />
              <span>{task.commentCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-[4px]">
          <div className="text-xs font-['IBM_Plex_Mono',monospace] uppercase tracking-wider text-[#6B7280]">
            {statusIndicators[task.status as keyof typeof statusIndicators]?.label}
          </div>
          {task.points && (
            <div className="text-xs font-['IBM_Plex_Mono',monospace] text-[#6366F1]">
              {task.points}pts
            </div>
          )}
        </div>
      </div>

      {task.dueDate && (
        <div className="flex items-center gap-[4px] text-xs font-['IBM_Plex_Mono',monospace] uppercase text-[#6B7280] border-t border-[#2E2E35] pt-8px">
          <HiOutlineClock className="w-12px h-12px" />
          <span className={clsx(
            new Date(task.dueDate) < new Date() && 'text-[#EF4444]'
          )}>
            DUE {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true }).toUpperCase()}
          </span>
        </div>
      )}
    </>
  )
}

// --- Main component ---

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
    urgent: 'border-[#EF4444]',
    high: 'border-[#F59E0B]',
    medium: 'border-[#06B6D4]',
    low: 'border-[#2E2E35]',
  }

  const statusIndicators = {
    todo: { color: 'bg-[#6B7280]', label: 'TODO' },
    in_progress: { color: 'bg-[#06B6D4]', label: 'IN_PROGRESS' },
    blocked: { color: 'bg-[#EF4444]', label: 'BLOCKED' },
    done: { color: 'bg-[#22C55E]', label: 'DONE' },
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
        isCompact ? "p-[4px] space-y-4px" : "p-[10px] space-y-[6px]"
      )}>
        {/* Header with type, number, and menu */}
        <div className="flex items-center justify-between mb-[2px]">
          <div className="flex items-center gap-[4px]">
            <span className={clsx(
              "text-xs font-bold px-6px py-2px",
              task.type === 'bug' && "text-[#EF4444] bg-[#EF4444]/10",
              task.type === 'feature' && "text-[#22C55E] bg-[#22C55E]/10",
              task.type === 'improvement' && "text-[#06B6D4] bg-[#06B6D4]/10",
              task.type === 'task' && "text-[#F9FAFB] bg-[#2E2E35]/20",
              task.type === 'epic' && "text-[#F59E0B] bg-[#F59E0B]/10"
            )}>
              {typeIcons[task.type as keyof typeof typeIcons]}
            </span>
            <span className="text-xs font-['IBM_Plex_Mono',monospace] uppercase tracking-wider text-[#6B7280]">
              {task.project?.key}-{task.number}
            </span>
            {(task.priority === 'urgent' || task.priority === 'high') && (
              <span className={clsx(
                "text-xs font-bold px-4px py-1px",
                task.priority === 'urgent' && "text-[#EF4444] bg-[#EF4444]/20 animate-pulse",
                task.priority === 'high' && "text-[#F59E0B] bg-[#F59E0B]/20"
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
              className="p-4px hover:bg-[#0A0A0A] transition-colors"
            >
              <HiOutlineDotsVertical className="w-16px h-16px" />
            </button>

            {showMenu && (
              <div ref={menuRef}>
                <TaskContextMenu
                  taskId={task._id}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onViewDetails={onViewDetails}
                  onDelete={onDelete}
                  onClose={() => setShowMenu(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Title with priority indicator */}
        {isCompact ? (
          // Compact mode: title and tags in vertical layout
          <>
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#F9FAFB] break-words line-clamp-1">
              {task.title}
            </h4>

            {/* Compact tags, user, and status */}
            <div className="flex items-center justify-between gap-[4px]">
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
              <div className="flex items-center gap-4px text-xs font-['IBM_Plex_Mono',monospace]">
                <span className="text-[#6B7280]">
                  {task.points || 0}pts
                </span>
                <span className="text-[#6B7280]">•</span>
                <span className="uppercase tracking-wider text-[#6B7280]">
                  {statusIndicators[task.status as keyof typeof statusIndicators]?.label}
                </span>
              </div>
            </div>
          </>
        ) : (
          // Normal mode: vertical layout
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#F9FAFB] break-words line-clamp-2 mb-[2px]">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs font-['IBM_Plex_Mono',monospace] text-[#6B7280] line-clamp-2 break-words">
                {task.description}
              </p>
            )}
          </div>
        )}

        {!isCompact && (
          <TaskNormalModeContent task={task} statusIndicators={statusIndicators} />
        )}
      </div>
    </BrutalCard>
  )
}