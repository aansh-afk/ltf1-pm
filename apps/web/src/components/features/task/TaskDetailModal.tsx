import { useState, useRef, useEffect } from 'react'
import { useQuery, useAction, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import {
  HiOutlineX,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineFlag,
  HiOutlineTag,
  HiOutlineLightningBolt,
  HiOutlineSparkles,
} from 'react-icons/hi'
import BrutalModal from '@/components/ui/BrutalModal'
import BrutalButton from '@/components/ui/BrutalButton'
import TimeTracker from './TimeTracker'
import TaskTimeDisplay from './TaskTimeDisplay'
import TaskAgentActivity from './TaskAgentActivity'
import TaskAssignmentSuggestions from '../ai/TaskAssignmentSuggestions'
import AITaskEnhancer from '../ai/AITaskEnhancer'
import { useShortcuts } from '@/contexts/ShortcutContext'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
}

export default function TaskDetailModal({ isOpen, onClose, taskId }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'time' | 'comments'>('details')
  const [showAssigneeSuggestions, setShowAssigneeSuggestions] = useState(false)
  const [showAIEnhancer, setShowAIEnhancer] = useState(false)
  const [showSkillDropdown, setShowSkillDropdown] = useState(false)
  const [runningSkillId, setRunningSkillId] = useState<string | null>(null)
  const skillDropdownRef = useRef<HTMLDivElement>(null)

  const task = useQuery(
    api.tasks.queries.getTask,
    taskId ? { taskId: taskId as Id<"tasks"> } : 'skip'
  )

  const timeEntries = useQuery(
    api.tasks.queries.getTaskTimeEntries,
    taskId ? { taskId: taskId as Id<"tasks"> } : 'skip'
  )

  const activeTimeEntry = useQuery(
    api.tasks.queries.getActiveTimeEntry,
    taskId ? { taskId: taskId as Id<"tasks"> } : 'skip'
  )

  const workspaceId = task?.project?.workspaceId as Id<"workspaces"> | undefined

  const skills = useQuery(
    api.skills.queries.getWorkspaceSkills,
    workspaceId ? { workspaceId } : 'skip'
  )

  const executeSkill = useAction(api.skills.execution.executeSkill)
  const updateTask = useMutation(api.tasks.mutations.updateTask)
  const { registerRuntimeCommands } = useShortcuts()

  const activeSkills = skills?.filter(s => s.isActive && (s.trigger === 'manual' || s.trigger === 'both')) || []

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (skillDropdownRef.current && !skillDropdownRef.current.contains(event.target as Node)) {
        setShowSkillDropdown(false)
      }
    }
    if (showSkillDropdown) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSkillDropdown])

  // Press "S" while the task modal is open to open the skill dropdown.
  // Ignored when focus is in an input/textarea so it doesn't hijack typing.
  useEffect(() => {
    if (!isOpen) return
    const isTypingTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false
      if (target.isContentEditable) return true
      return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      if (event.key.toLowerCase() !== 's') return
      if (activeSkills.length === 0) return
      event.preventDefault()
      setShowSkillDropdown((v) => !v)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, activeSkills.length])

  const handleRunSkill = async (skillId: Id<"skills">) => {
    setShowSkillDropdown(false)
    setRunningSkillId(skillId)
    try {
      const result = await executeSkill({
        skillId,
        taskId: taskId as Id<"tasks">,
      })
      if (result.success) {
        toast.success(`Skill executed — ${result.actionsExecuted} action${result.actionsExecuted !== 1 ? 's' : ''} applied`)
      } else {
        toast.error(result.error || 'Skill execution failed')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to execute skill')
    } finally {
      setRunningSkillId(null)
    }
  }

  // Register each active skill as a command palette entry while this modal
  // is open. ⌘K → type the skill name → enter runs it on this task.
  useEffect(() => {
    if (!isOpen || !taskId || activeSkills.length === 0) return
    const dispose = registerRuntimeCommands(
      activeSkills.map((skill) => ({
        id: `runtime:skill:${taskId}:${skill._id}`,
        name: `Run skill: ${skill.displayName}`,
        description: skill.description,
        category: 'skills',
        keywords: ['run', 'skill', skill.name, skill.displayName],
        action: () => {
          handleRunSkill(skill._id as Id<"skills">)
        },
      })),
    )
    return dispose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taskId, activeSkills.map((s) => s._id).join(',')])

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
            <div className="flex items-center gap-[6px]">
              {/* Run Skill Button */}
              {activeSkills.length > 0 && (
                <div className="relative" ref={skillDropdownRef}>
                  <BrutalButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSkillDropdown(!showSkillDropdown)}
                    disabled={!!runningSkillId}
                    loading={!!runningSkillId}
                    className="!border-[rgba(245,158,11,0.3)] !text-[#F59E0B] hover:!bg-[rgba(245,158,11,0.1)] hover:!border-[#F59E0B]"
                  >
                    <span className="flex items-center gap-1">
                      <HiOutlineLightningBolt className="w-3.5 h-3.5" />
                      RUN SKILL
                    </span>
                  </BrutalButton>

                  {showSkillDropdown && (
                    <div
                      className="absolute right-0 top-full mt-1 z-50 min-w-[200px] border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
                      style={{ boxShadow: '4px 4px 0px var(--theme-shadow)' }}
                    >
                      {activeSkills.map((skill) => (
                        <button
                          key={skill._id}
                          onClick={() => handleRunSkill(skill._id)}
                          disabled={!!runningSkillId}
                          className="w-full px-3 py-2 text-left hover:bg-[var(--theme-background-secondary)] transition-colors border-b border-[var(--theme-border)] last:border-b-0"
                        >
                          <div className="text-[11px] font-mono font-bold uppercase text-[var(--theme-foreground)]">
                            {skill.displayName}
                          </div>
                          <div className="text-[9px] font-mono text-[var(--theme-foreground-tertiary)] truncate mt-px">
                            {skill.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className="p-[4px] hover:bg-[var(--theme-background-secondary)]/20 transition-colors"
              >
                <HiOutlineX className="w-20px h-20px" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-[var(--theme-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'details' | 'time' | 'comments')}
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
                  <div className="flex items-center justify-between mb-[6px]">
                    <h3 className="text-brutal-sm font-mono uppercase">DESCRIPTION</h3>
                    <button
                      onClick={() => setShowAIEnhancer(!showAIEnhancer)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-mono uppercase border border-[#6366F1]/30 hover:bg-[#6366F1]/10 text-[#6366F1] transition-colors"
                      title="Enhance with AI"
                    >
                      <HiOutlineSparkles className="w-3 h-3" />
                      AI Enhance
                    </button>
                  </div>
                  <div className="p-[10px] bg-[var(--theme-background-secondary)]/5 border-2 border-[var(--theme-border)]">
                    <p className="text-brutal-sm whitespace-pre-wrap">{task.description}</p>
                  </div>
                </div>
              )}

              {/* AI Task Enhancer Panel */}
              {showAIEnhancer && task.project && (
                <AITaskEnhancer
                  task={{
                    _id: task._id as Id<"tasks">,
                    title: task.title,
                    description: task.description,
                    type: task.type,
                    priority: task.priority,
                    assigneeId: task.assigneeId as Id<"users"> | undefined,
                    labels: task.labels,
                    estimate: task.estimate,
                  }}
                  onUpdate={async (updates) => {
                    try {
                      await updateTask({
                        taskId: task._id as Id<"tasks">,
                        ...updates,
                      })
                      toast.success('Task updated with AI suggestions')
                    } catch (e: any) {
                      toast.error(e.message || 'Failed to update task')
                    }
                  }}
                />
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-[8px]">
                <div className="space-y-[8px]">
                  {/* Assignee */}
                  <div className="flex items-center gap-[6px]">
                    <HiOutlineUser className="w-16px h-16px text-neutral-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <div className="text-brutal-xs text-neutral-400 uppercase">ASSIGNEE</div>
                        {task.project && (
                          <button
                            onClick={() => setShowAssigneeSuggestions(!showAssigneeSuggestions)}
                            className="p-0.5 hover:bg-[var(--theme-primary)]/10 transition-colors"
                            title="AI suggest assignee"
                          >
                            <HiOutlineSparkles className="w-3 h-3 text-[#6366F1]" />
                          </button>
                        )}
                      </div>
                      <div className="text-brutal-sm">
                        {task.assignee?.name || 'Unassigned'}
                      </div>
                    </div>
                  </div>
                  {showAssigneeSuggestions && task.project && (
                    <TaskAssignmentSuggestions
                      projectId={task.project._id as Id<"projects">}
                      taskTitle={task.title}
                      taskDescription={task.description}
                      taskType={task.type}
                      priority={task.priority}
                      labels={task.labels}
                      currentAssignees={task.assigneeId ? [task.assigneeId] : []}
                      onAssign={async (userId) => {
                        try {
                          await updateTask({
                            taskId: task._id as Id<"tasks">,
                            assigneeId: userId as Id<"users">,
                          })
                          toast.success('Assignee updated')
                          setShowAssigneeSuggestions(false)
                        } catch (e: any) {
                          toast.error(e.message || 'Failed to assign')
                        }
                      }}
                      compact
                    />
                  )}

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

              {/* Agent activity timeline — hidden if empty */}
              <TaskAgentActivity taskId={task._id as Id<"tasks">} />
            </div>
          )}

          {activeTab === 'time' && (
            <div className="space-y-[12px]">
              {/* Time Tracker */}
              <div>
                <h3 className="text-brutal-sm font-mono uppercase mb-[6px]">ACTIVE TIMER</h3>
                <TimeTracker
                  taskId={taskId as Id<"tasks">}
                  isRunning={!!activeTimeEntry}
                  currentDuration={totalTimeTracked}
                />
              </div>

              {/* Time Entries History */}
              {timeEntries && timeEntries.length > 0 && (
                <div>
                  <h3 className="text-brutal-sm font-mono uppercase mb-[6px]">TIME ENTRIES</h3>
                  <div className="space-y-[4px]">
                    {timeEntries.map((entry) => (
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