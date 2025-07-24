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
    urgent: 'text-[#FF0000] border-[#FF0000]',
    high: 'text-warning-brutalist border-warning-brutalist',
    medium: 'text-primary-brutalist border-primary-brutalist',
    low: 'text-neutral-400 border-neutral-400',
  }

  const statusColors = {
    backlog: 'text-neutral-400',
    todo: 'text-primary-brutalist',
    in_progress: 'text-warning-brutalist',
    in_review: 'text-[#FF6B00]',
    done: 'text-[#00FF00]',
    cancelled: 'text-[#FF0000]',
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
        <div className="p-24px border-b-2 border-basalt-border">
          <div className="flex items-start justify-between gap-16px">
            <div className="flex-1">
              <div className="flex items-center gap-12px mb-8px">
                <span className="text-brutal-xs font-mono text-neutral-400 uppercase">
                  {task.project?.key}-{task.number}
                </span>
                <span className={clsx(
                  'px-8px py-2px border text-brutal-xs font-mono uppercase',
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
              <h2 className="text-brutal-xl font-bold uppercase">
                {task.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-8px hover:bg-event-horizon/20 transition-colors"
            >
              <HiOutlineX className="w-20px h-20px" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-basalt-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'px-24px py-16px text-brutal-sm font-mono uppercase transition-colors',
                'border-b-4 -mb-2px',
                activeTab === tab.id
                  ? 'border-primary-brutalist bg-event-horizon/10 text-primary-brutalist'
                  : 'border-transparent hover:bg-event-horizon/5'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-24px max-h-[600px] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-24px">
              {/* Description */}
              {task.description && (
                <div>
                  <h3 className="text-brutal-sm font-mono uppercase mb-12px">DESCRIPTION</h3>
                  <div className="p-16px bg-event-horizon/5 border-2 border-basalt-border">
                    <p className="text-brutal-sm whitespace-pre-wrap">{task.description}</p>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-16px">
                <div className="space-y-16px">
                  {/* Assignee */}
                  <div className="flex items-center gap-12px">
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
                    <div className="flex items-center gap-12px">
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

                <div className="space-y-16px">
                  {/* Time Tracked */}
                  <div className="flex items-center gap-12px">
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
                  <div className="flex items-center gap-12px">
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
                  <h3 className="text-brutal-sm font-mono uppercase mb-12px flex items-center gap-8px">
                    <HiOutlineTag className="w-16px h-16px" />
                    LABELS
                  </h3>
                  <div className="flex flex-wrap gap-8px">
                    {task.labels.map((label: string) => (
                      <span
                        key={label}
                        className="px-12px py-4px bg-event-horizon/10 border border-basalt-border text-brutal-xs font-mono uppercase"
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
            <div className="space-y-24px">
              {/* Time Tracker */}
              <div>
                <h3 className="text-brutal-sm font-mono uppercase mb-12px">ACTIVE TIMER</h3>
                <TimeTracker
                  taskId={taskId}
                  isRunning={!!activeTimeEntry}
                  currentDuration={totalTimeTracked}
                />
              </div>

              {/* Time Entries History */}
              {timeEntries && timeEntries.length > 0 && (
                <div>
                  <h3 className="text-brutal-sm font-mono uppercase mb-12px">TIME ENTRIES</h3>
                  <div className="space-y-8px">
                    {timeEntries.map((entry: any) => (
                      <div
                        key={entry._id}
                        className="p-16px bg-event-horizon/5 border border-basalt-border"
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
                <div className="text-brutal-xs mt-8px">Task comments and collaboration features</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </BrutalModal>
  )
}