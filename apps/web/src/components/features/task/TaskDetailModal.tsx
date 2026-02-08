import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlineX,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineFlag,
  HiOutlineTag
} from 'react-icons/hi'
import BrutalModal from '../../ui/BrutalModal'
import TimeTracker from './TimeTracker'
import TaskTimeDisplay from './TaskTimeDisplay'
import { formatDistanceToNow, format } from 'date-fns'
import clsx from 'clsx'

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
}

export default function TaskDetailModal({ isOpen, onClose, taskId }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'time' | 'comments'>('details')

  const task = useQuery(
    api.tasks.queries.getTask,
    taskId ? { taskId: taskId as any } : 'skip'
  )

  const timeEntries = useQuery(
    api.tasks.queries.getTaskTimeEntries,
    taskId ? { taskId: taskId as any } : 'skip'
  )

  const activeTimeEntry = useQuery(
    api.tasks.queries.getActiveTimeEntry,
    taskId ? { taskId: taskId as any } : 'skip'
  )

  if (!task) return null

  const priorityColors = {
    urgent: 'text-[var(--theme-error)] border-[var(--theme-error)]',
    high: 'text-warning-brutalist border-warning-brutalist',
    medium: 'text-primary-brutalist border-primary-brutalist',
    low: 'text-neutral-400 border-neutral-400',
  }

  const statusColors = {
    backlog: 'text-neutral-400',
    todo: 'text-primary-brutalist',
    in_progress: 'text-warning-brutalist',
    in_review: 'text-[#FF6B00]',
    done: 'text-[var(--theme-success)]',
    cancelled: 'text-[var(--theme-error)]',
  }

  const tabs = [
    { id: 'details', label: 'DETAILS' },
    { id: 'time', label: 'TIME TRACKING' },
    { id: 'comments', label: 'COMMENTS' },
  ]

  const totalTimeTracked = timeEntries?.reduce((total, entry) => total + (entry.duration || 0), 0) || 0

  return (
    <BrutalModal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-0">
        {/* Header */}
        <div className="p-[16px] border-b-2 border-[var(--theme-border)]">
          <div className="flex items-start justify-between gap-[8px]">
            <div className="flex-1">
              <div className="flex items-center gap-[6px] mb-[4px]">
                <span className="text-brutal-xs font-mono text-neutral-400 uppercase">
                  {task.project?.key}-{task.number}
                </span>
                <span className={clsx(
                  'px-[4px] py-2px border text-brutal-xs font-mono uppercase',
                  priorityColors[task.priority as keyof typeof priorityColors]
                )}>
                  {task.priority}
                </span>
                <span className={clsx(
                  'text-brutal-xs font-mono uppercase',
                  statusColors[task.status as keyof typeof statusColors]
                )}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-[16px] font-bold font-bold uppercase">
                {task.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-[4px] hover:bg-[var(--theme-background-secondary)]/20 transition-colors"
            >
              <HiOutlineX className="w-20px h-20px" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-[var(--theme-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'px-[12px] py-[8px] text-brutal-sm font-mono uppercase transition-colors',
                'border-b-4 -mb-2px',
                activeTab === tab.id
                  ? 'border-primary-brutalist bg-[var(--theme-background-secondary)]/10 text-primary-brutalist'
                  : 'border-transparent hover:bg-[var(--theme-background-secondary)]/5'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-[16px] max-h-[600px] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-[12px]">
              {/* Description */}
              {task.description && (
                <div>
                  <h3 className="text-brutal-sm font-mono uppercase mb-[6px]">DESCRIPTION</h3>
                  <div className="p-[10px] bg-[var(--theme-background-secondary)]/5 border-2 border-[var(--theme-border)]">
                    <p className="text-brutal-sm whitespace-pre-wrap">{task.description}</p>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-[8px]">
                <div className="space-y-[8px]">
                  {/* Assignee */}
                  <div className="flex items-center gap-[6px]">
                    <HiOutlineUser className="w-16px h-16px text-neutral-400" />
                    <div>
                      <div className="text-brutal-xs text-neutral-400 uppercase">ASSIGNEE</div>
                      <div className="text-brutal-sm">
                        {task.assignee?.name || 'Unassigned'}
                      </div>
                    </div>
                  </div>

                  {/* Due Date */}
                  {task.dueDate && (
                    <div className="flex items-center gap-[6px]">
                      <HiOutlineCalendar className="w-16px h-16px text-neutral-400" />
                      <div>
                        <div className="text-brutal-xs text-neutral-400 uppercase">DUE DATE</div>
                        <div className="text-brutal-sm">
                          {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-[8px]">
                  {/* Time Tracked */}
                  <div className="flex items-center gap-[6px]">
                    <HiOutlineClock className="w-16px h-16px text-neutral-400" />
                    <div>
                      <div className="text-brutal-xs text-neutral-400 uppercase">TIME TRACKED</div>
                      <TaskTimeDisplay 
                        timeTracked={totalTimeTracked} 
                        isActive={!!activeTimeEntry}
                        size="md"
                      />
                    </div>
                  </div>

                  {/* Created */}
                  <div className="flex items-center gap-[6px]">
                    <HiOutlineFlag className="w-16px h-16px text-neutral-400" />
                    <div>
                      <div className="text-brutal-xs text-neutral-400 uppercase">CREATED</div>
                      <div className="text-brutal-sm">
                        {formatDistanceToNow(new Date(task.createdAt))} ago
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Labels */}
              {task.labels && task.labels.length > 0 && (
                <div>
                  <h3 className="text-brutal-sm font-mono uppercase mb-[6px] flex items-center gap-[4px]">
                    <HiOutlineTag className="w-16px h-16px" />
                    LABELS
                  </h3>
                  <div className="flex flex-wrap gap-[4px]">
                    {task.labels.map((label: string) => (
                      <span
                        key={label}
                        className="px-[8px] py-4px bg-[var(--theme-background-secondary)]/10 border border-[var(--theme-border)] text-brutal-xs font-mono uppercase"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'time' && (
            <div className="space-y-[12px]">
              {/* Time Tracker */}
              <div>
                <h3 className="text-brutal-sm font-mono uppercase mb-[6px]">ACTIVE TIMER</h3>
                <TimeTracker
                  taskId={taskId}
                  isRunning={!!activeTimeEntry}
                  currentDuration={totalTimeTracked}
                />
              </div>

              {/* Time Entries History */}
              {timeEntries && timeEntries.length > 0 && (
                <div>
                  <h3 className="text-brutal-sm font-mono uppercase mb-[6px]">TIME ENTRIES</h3>
                  <div className="space-y-[4px]">
                    {timeEntries.map((entry: any) => (
                      <div
                        key={entry._id}
                        className="p-[10px] bg-[var(--theme-background-secondary)]/5 border border-[var(--theme-border)]"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-brutal-sm font-mono">
                              {Math.floor((entry.duration || 0) / (1000 * 60))}m
                            </div>
                            <div className="text-brutal-xs text-neutral-400">
                              {format(new Date(entry.startTime), 'MMM dd, HH:mm')}
                              {entry.endTime && ` - ${format(new Date(entry.endTime), 'HH:mm')}`}
                            </div>
                          </div>
                          {entry.description && (
                            <div className="text-brutal-xs text-neutral-400">
                              {entry.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div>
              <div className="text-center py-32px text-neutral-400">
                <div className="text-brutal-sm font-mono uppercase">COMMENTS COMING SOON</div>
                <div className="text-brutal-xs mt-[4px]">Task comments and collaboration features</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </BrutalModal>
  )
}