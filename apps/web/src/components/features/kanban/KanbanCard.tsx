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

    const priorityBorderColors = {
        urgent: 'border-l-[#EF4444]',
        high: 'border-l-[#F59E0B]',
        medium: 'border-l-[#6366F1]',
        low: 'border-l-[#2E2E35]',
    }

    const statusIndicators = {
        todo: { color: 'bg-[#6366F1]' },
        in_progress: { color: 'bg-[#06B6D4]' },
        blocked: { color: 'bg-[#EF4444]' },
        done: { color: 'bg-[#22C55E]' },
        backlog: { color: 'bg-[#6B7280]' },
        in_review: { color: 'bg-[#F59E0B]' },
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
        <div
            className={clsx(
                'relative overflow-hidden transition-all duration-200 group',
                'bg-[#0A0A0A] border-2 border-[#2E2E35] border-l-[3px]',
                'hover:border-[#F9FAFB]/20 hover:-translate-y-[1px]',
                priorityBorderColors[task.priority as keyof typeof priorityBorderColors]
            )}
            role="article"
            aria-label={`Task: ${task.title}`}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onClick={() => onViewDetails?.(task._id)}
        >
            {/* Status indicator bar */}
            <div
                className={clsx(
                    'absolute top-0 left-0 w-full h-[2px]',
                    statusIndicators[task.status as keyof typeof statusIndicators]?.color || 'bg-[#2E2E35]'
                )}
            />

            <div className={clsx(
                isCompact ? "p-1.5 space-y-0.5" : "px-2.5 py-2 space-y-1"
            )}>
                {/* Header: type + number + menu */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                        <span className={clsx(
                            "text-[10px] font-mono font-bold shrink-0",
                            task.type === 'bug' && "text-[#EF4444]",
                            task.type === 'feature' && "text-[#22C55E]",
                            task.type === 'improvement' && "text-[#06B6D4]",
                            task.type === 'task' && "text-[#6B7280]",
                            task.type === 'epic' && "text-[#F59E0B]"
                        )}>
                            {typeIcons[task.type as keyof typeof typeIcons] || '[TASK]'}
                        </span>
                        <span className="text-[10px] font-mono text-[#6B7280] truncate">
                            {task.project?.key ? `${task.project.key}-${task.number}` : `#${task.number}`}
                        </span>
                        {task.priority === 'urgent' && (
                            <span className="text-[10px] font-bold text-[#EF4444] animate-pulse shrink-0">!</span>
                        )}
                    </div>

                    <div className="relative shrink-0">
                        <button
                            ref={buttonRef}
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowMenu(!showMenu)
                            }}
                            className="p-0.5 hover:bg-[#111111] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Task options"
                        >
                            <HiOutlineDotsVertical className="w-3 h-3 text-[#6B7280]" />
                        </button>

                        {showMenu && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 top-full mt-1 z-50 bg-[#0A0A0A] border-2 border-[#2E2E35] shadow-[4px_4px_0px_#000000] min-w-[130px]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => { setShowMenu(false); onEdit?.(task) }}
                                    className="w-full px-2.5 py-1.5 text-[10px] font-mono uppercase text-left text-[#9CA3AF] hover:bg-[#111111] hover:text-[#F9FAFB] transition-colors flex items-center gap-1.5"
                                >
                                    <HiOutlinePencil className="w-3 h-3" />
                                    EDIT
                                </button>
                                <button
                                    onClick={() => { setShowMenu(false); onDuplicate?.(task) }}
                                    className="w-full px-2.5 py-1.5 text-[10px] font-mono uppercase text-left text-[#9CA3AF] hover:bg-[#111111] hover:text-[#F9FAFB] transition-colors flex items-center gap-1.5"
                                >
                                    <HiOutlineDuplicate className="w-3 h-3" />
                                    DUPLICATE
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/task/${task._id}`)
                                        toast.success('Link copied!')
                                        setShowMenu(false)
                                    }}
                                    className="w-full px-2.5 py-1.5 text-[10px] font-mono uppercase text-left text-[#9CA3AF] hover:bg-[#111111] hover:text-[#F9FAFB] transition-colors flex items-center gap-1.5"
                                >
                                    <HiOutlineLink className="w-3 h-3" />
                                    COPY LINK
                                </button>
                                <div className="border-t border-[#2E2E35]" />
                                <button
                                    onClick={handleDelete}
                                    className="w-full px-2.5 py-1.5 text-[10px] font-mono uppercase text-left text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-colors flex items-center gap-1.5"
                                >
                                    <HiOutlineTrash className="w-3 h-3" />
                                    DELETE
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Title only — no description on board cards */}
                <h4 className="font-semibold text-[13px] leading-snug text-[#F9FAFB] break-words line-clamp-2">
                    {task.title}
                </h4>

                {/* Inline labels as tiny chips */}
                {!isCompact && task.labels && task.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {task.labels.slice(0, 2).map((label: string) => (
                            <span key={label} className="text-[9px] font-mono uppercase tracking-wider text-[#9CA3AF] bg-[#111111] px-1 py-px border border-[#2E2E35] truncate max-w-[80px]">
                                {label}
                            </span>
                        ))}
                        {task.labels.length > 2 && (
                            <span className="text-[9px] font-mono text-[#6B7280]">+{task.labels.length - 2}</span>
                        )}
                    </div>
                )}

                {/* Compact footer */}
                {!isCompact && (
                    <div className="flex items-center justify-between pt-1 border-t border-[#1F1F23]">
                        <div className="flex items-center gap-1.5">
                            <UserDisplay
                                userId={task.assigneeId || (task.assigneeIds && task.assigneeIds[0])}
                                size="sm"
                                showStatus={false}
                                compact={true}
                            />
                            {task.commentCount > 0 && (
                                <span className="text-[10px] font-mono text-[#6B7280] flex items-center gap-0.5">
                                    <HiOutlineChat className="w-2.5 h-2.5" />
                                    {task.commentCount}
                                </span>
                            )}
                            {task.points && (
                                <span className="text-[10px] font-mono text-[#6366F1]">{task.points}pt</span>
                            )}
                        </div>
                        {task.dueDate && (
                            <span className={clsx(
                                "text-[10px] font-mono flex items-center gap-0.5",
                                new Date(task.dueDate) < new Date() ? 'text-[#EF4444]' : 'text-[#6B7280]'
                            )}>
                                <HiOutlineClock className="w-2.5 h-2.5" />
                                {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
