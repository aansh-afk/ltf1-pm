import { useState, useRef, useEffect } from 'react'
import {
    HiOutlineDotsVertical,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineDuplicate,
    HiOutlineLink,
    HiOutlineClock,
    HiOutlineChat
} from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import BrutalCard from '../../ui/BrutalCard'
import BrutalBadge from '../../ui/BrutalBadge'
import UserDisplay from '../user/UserDisplay'
import toast from 'react-hot-toast'

interface KanbanCardProps {
    task: any
    isCompact?: boolean
    onEdit?: (task: any) => void
    onDelete?: (taskId: string) => void
    onDuplicate?: (task: any) => void
    onViewDetails?: (taskId: string) => void
}

export default function KanbanCard({
    task,
    isCompact = false,
    onEdit,
    onDelete,
    onDuplicate,
    onViewDetails
}: KanbanCardProps) {
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    // Close menu when clicking outside
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
        backlog: { color: 'bg-[var(--theme-border)]', label: 'BACKLOG' },
        in_review: { color: 'bg-brutal-warning', label: 'REVIEW' },
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
            onViewDetails?.(task._id)
        }
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        setShowMenu(false)
        if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
            onDelete?.(task._id)
        }
    }

    return (
        <BrutalCard
            variant="elevated"
            padding={isCompact ? 'sm' : 'md'}
            hoverable={true}
            className={clsx(
                'relative overflow-hidden transition-all duration-200 group',
                priorityColors[task.priority as keyof typeof priorityColors]
            )}
            style={{ borderRadius: '0 !important' }}
            role="article"
            aria-label={`Task: ${task.title}`}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onClick={() => onViewDetails?.(task._id)}
        >
            {/* Status indicator bar */}
            <div
                className={clsx(
                    'absolute top-0 left-0 w-full',
                    isCompact ? 'h-1px' : 'h-2px',
                    statusIndicators[task.status as keyof typeof statusIndicators]?.color || 'bg-[var(--theme-border)]'
                )}
            />

            <div className={clsx(
                isCompact ? "space-y-4px" : "space-y-[6px]"
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
                            {typeIcons[task.type as keyof typeof typeIcons] || '[TASK]'}
                        </span>
                        <span className="text-xs font-mono uppercase tracking-wider text-[var(--theme-foreground)]/60">
                            {task.project?.key ? `${task.project.key}-${task.number}` : `#${task.number}`}
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
                            className="p-4px hover:bg-[var(--theme-background-secondary)] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Task options"
                        >
                            <HiOutlineDotsVertical className="w-16px h-16px" />
                        </button>

                        {showMenu && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 top-full mt-4px z-50 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] shadow-brutal min-w-[160px]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => {
                                        setShowMenu(false)
                                        onEdit?.(task)
                                    }}
                                    className="w-full px-[10px] py-8px text-xs font-mono uppercase text-left hover:bg-[var(--theme-background-secondary)] transition-colors flex items-center gap-8px"
                                >
                                    <HiOutlinePencil className="w-16px h-16px" />
                                    EDIT
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMenu(false)
                                        onDuplicate?.(task)
                                    }}
                                    className="w-full px-[10px] py-8px text-xs font-mono uppercase text-left hover:bg-[var(--theme-background-secondary)] transition-colors flex items-center gap-8px"
                                >
                                    <HiOutlineDuplicate className="w-16px h-16px" />
                                    DUPLICATE
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/task/${task._id}`)
                                        toast.success('Link copied!')
                                        setShowMenu(false)
                                    }}
                                    className="w-full px-[10px] py-8px text-xs font-mono uppercase text-left hover:bg-[var(--theme-background-secondary)] transition-colors flex items-center gap-8px"
                                >
                                    <HiOutlineLink className="w-16px h-16px" />
                                    COPY LINK
                                </button>
                                <div className="border-t-2 border-[var(--theme-border)]" />
                                <button
                                    onClick={handleDelete}
                                    className="w-full px-[10px] py-8px text-xs font-mono uppercase text-left hover:bg-brutal-error hover:text-white transition-colors flex items-center gap-8px text-brutal-error"
                                >
                                    <HiOutlineTrash className="w-16px h-16px" />
                                    DELETE
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-[var(--theme-foreground)] break-words line-clamp-2 mb-4px">
                        {task.title}
                    </h4>
                    {!isCompact && task.description && (
                        <p className="text-xs font-mono text-[var(--theme-foreground)]/60 line-clamp-2 break-words">
                            {task.description}
                        </p>
                    )}
                </div>

                {/* Labels */}
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

                {/* Footer */}
                {!isCompact && (
                    <div className="flex items-center justify-between pt-8px border-t border-[var(--theme-border)]/50">
                        <div className="flex items-center gap-[6px]">
                            <UserDisplay
                                userId={task.assigneeId || (task.assigneeIds && task.assigneeIds[0])}
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
                            {task.points && (
                                <div className="text-xs font-mono text-primary-brutalist">
                                    {task.points}pts
                                </div>
                            )}
                            {task.dueDate && (
                                <div className={clsx(
                                    "flex items-center gap-4px text-xs font-mono uppercase",
                                    new Date(task.dueDate) < new Date() ? 'text-brutal-error' : 'text-[var(--theme-foreground)]/60'
                                )}>
                                    <HiOutlineClock className="w-12px h-12px" />
                                    <span>{formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </BrutalCard>
    )
}
