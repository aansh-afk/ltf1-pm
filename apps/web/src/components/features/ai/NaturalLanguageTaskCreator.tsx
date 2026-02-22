import React, { useReducer, useEffect, useRef } from 'react'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import {
  HiOutlineSparkles,
  HiOutlineLightBulb,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineAdjustments,
  HiOutlinePencil,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from 'react-icons/hi'
import toast from 'react-hot-toast'

interface NaturalLanguageTaskCreatorProps {
  projectId: Id<'projects'>
  sprintId?: Id<'sprints'>
  onTasksCreated?: () => void
}

interface GeneratedTask {
  title: string
  description: string
  type: 'task' | 'feature' | 'bug' | 'improvement' | 'epic'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedPoints?: number
  suggestedAssigneeRole?: string
  dependencies?: string[]
  acceptanceCriteria?: string[]
  selected: boolean
}

type NLTaskState = {
  input: string
  isGenerating: boolean
  isCreating: boolean
  createdCount: number
  generatedTasks: GeneratedTask[]
  editingIndex: number | null
  showAdvanced: boolean
  showModal: boolean
  epicTitle: string
  expandedIndex: number | null
}

const nlTaskInitialState: NLTaskState = {
  input: '',
  isGenerating: false,
  isCreating: false,
  createdCount: 0,
  generatedTasks: [],
  editingIndex: null,
  showAdvanced: false,
  showModal: false,
  epicTitle: '',
  expandedIndex: null,
}

type NLTaskAction =
  | { type: 'UPDATE'; field: keyof NLTaskState; value: unknown }
  | { type: 'RESET_FORM' }
  | { type: 'CLOSE_MODAL' }

function nlTaskReducer(state: NLTaskState, action: NLTaskAction): NLTaskState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'RESET_FORM':
      return { ...nlTaskInitialState }
    case 'CLOSE_MODAL':
      // Keep tasks so user can re-open
      return { ...state, showModal: false, editingIndex: null, expandedIndex: null, isCreating: false, createdCount: 0 }
    default:
      return state
  }
}

// --- Priority & type badge helpers ---

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'border-[#EF4444] text-[#EF4444] bg-[#EF4444]/10',
  high: 'border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10',
  medium: 'border-[#6366F1] text-[#6366F1] bg-[#6366F1]/10',
  low: 'border-[#6B7280] text-[#6B7280] bg-[#6B7280]/10',
}

const TYPE_STYLES: Record<string, string> = {
  feature: 'border-[#22C55E] text-[#22C55E] bg-[#22C55E]/10',
  bug: 'border-[#EF4444] text-[#EF4444] bg-[#EF4444]/10',
  improvement: 'border-[#06B6D4] text-[#06B6D4] bg-[#06B6D4]/10',
  task: 'border-[#9CA3AF] text-[#9CA3AF] bg-[#9CA3AF]/10',
  epic: 'border-[#8B5CF6] text-[#8B5CF6] bg-[#8B5CF6]/10',
}

// --- Task card in the review modal ---

function ReviewTaskCard({
  task,
  index,
  isEditing,
  isExpanded,
  onToggleSelect,
  onToggleEdit,
  onToggleExpand,
  onEditField,
  onRemove
}: {
  task: GeneratedTask
  index: number
  isEditing: boolean
  isExpanded: boolean
  onToggleSelect: (index: number) => void
  onToggleEdit: (index: number) => void
  onToggleExpand: (index: number) => void
  onEditField: (index: number, field: keyof GeneratedTask, value: any) => void
  onRemove: (index: number) => void
}) {
  return (
    <div className={`border-2 transition-colors ${
      task.selected
        ? 'border-[#6366F1] bg-[#6366F1]/5'
        : 'border-[#2E2E35] bg-[#0A0A0A]'
    }`}>
      {/* Header row — always visible */}
      <div className="flex items-center gap-[10px] p-[12px]">
        {/* Checkbox */}
        <button
          onClick={() => onToggleSelect(index)}
          className={`w-[20px] h-[20px] border-2 flex items-center justify-center flex-shrink-0 ${
            task.selected
              ? 'border-[#6366F1] bg-[#6366F1] text-[#050505]'
              : 'border-[#2E2E35] hover:border-[#6366F1]'
          }`}
        >
          {task.selected && <HiOutlineCheck className="w-[14px] h-[14px]" />}
        </button>

        {/* Title + badges */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={task.title}
              onChange={(e) => onEditField(index, 'title', e.target.value)}
              aria-label="Edit task title"
              className="w-full px-[8px] py-[4px] bg-[#111111] border border-[#2E2E35] text-[13px] font-semibold text-[#F9FAFB]
                       focus:border-[#6366F1] focus:outline-none font-['Inter']"
            />
          ) : (
            <p className="text-[13px] font-semibold text-[#F9FAFB] truncate font-['Inter']">{task.title}</p>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-[6px] flex-shrink-0">
          <span className={`px-[6px] py-[2px] text-[10px] font-bold uppercase border font-['IBM_Plex_Mono'] ${TYPE_STYLES[task.type] || TYPE_STYLES.task}`}>
            {task.type}
          </span>
          <span className={`px-[6px] py-[2px] text-[10px] font-bold uppercase border font-['IBM_Plex_Mono'] ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.low}`}>
            {task.priority}
          </span>
          {task.estimatedPoints && (
            <span className="px-[6px] py-[2px] text-[10px] font-bold border border-[#2E2E35] text-[#9CA3AF] font-['IBM_Plex_Mono']">
              {task.estimatedPoints}pt
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-[4px] flex-shrink-0">
          <button
            onClick={() => onToggleExpand(index)}
            className="p-[4px] text-[#6B7280] hover:text-[#F9FAFB]"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <HiOutlineChevronUp className="w-[14px] h-[14px]" /> : <HiOutlineChevronDown className="w-[14px] h-[14px]" />}
          </button>
          <button
            onClick={() => onToggleEdit(index)}
            className={`p-[4px] ${isEditing ? 'text-[#6366F1]' : 'text-[#6B7280] hover:text-[#F9FAFB]'}`}
            aria-label="Edit task"
          >
            <HiOutlinePencil className="w-[14px] h-[14px]" />
          </button>
          <button
            onClick={() => onRemove(index)}
            className="p-[4px] text-[#6B7280] hover:text-[#EF4444]"
            aria-label="Remove task"
          >
            <HiOutlineX className="w-[14px] h-[14px]" />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {(isExpanded || isEditing) && (
        <div className="px-[12px] pb-[12px] border-t border-[#1F1F23]">
          <div className="pt-[10px]">
            {isEditing ? (
              <textarea
                value={task.description}
                onChange={(e) => onEditField(index, 'description', e.target.value)}
                aria-label="Edit task description"
                className="w-full h-[60px] px-[8px] py-[6px] bg-[#111111] border border-[#2E2E35]
                         text-[12px] text-[#9CA3AF] resize-none font-['Inter']
                         focus:border-[#6366F1] focus:outline-none"
              />
            ) : (
              <p className="text-[12px] text-[#9CA3AF] font-['Inter'] leading-relaxed">
                {task.description}
              </p>
            )}

            {task.suggestedAssigneeRole && (
              <div className="mt-[8px]">
                <span className="text-[10px] font-bold uppercase text-[#6B7280] font-['IBM_Plex_Mono']">Role: </span>
                <span className="text-[10px] text-[#6366F1] font-bold uppercase font-['IBM_Plex_Mono']">{task.suggestedAssigneeRole}</span>
              </div>
            )}

            {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
              <div className="mt-[8px]">
                <p className="text-[10px] font-bold uppercase text-[#6B7280] mb-[4px] font-['IBM_Plex_Mono']">Acceptance Criteria:</p>
                <ul className="space-y-[2px]">
                  {task.acceptanceCriteria.map((c, i) => (
                    <li key={i} className="text-[11px] text-[#9CA3AF] font-['Inter'] flex items-start gap-[6px]">
                      <span className="text-[#6366F1] mt-[2px]">-</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Main component ---

export default function NaturalLanguageTaskCreator({
  projectId,
  sprintId,
  onTasksCreated
}: NaturalLanguageTaskCreatorProps) {
  const [state, dispatch] = useReducer(nlTaskReducer, nlTaskInitialState)
  const { input, isGenerating, isCreating, createdCount, generatedTasks, editingIndex, showAdvanced, showModal, epicTitle, expandedIndex } = state
  const modalRef = useRef<HTMLDivElement>(null)

  const generateTasks = useAction(api.ai.projectInsights.generateTasksFromDescription)
  const createTask = useMutation(api.tasks.mutations.createTask)

  // Close modal on Escape
  useEffect(() => {
    if (!showModal) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'CLOSE_MODAL' })
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showModal])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showModal])

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error('Please describe what you want to build')
      return
    }

    dispatch({ type: 'UPDATE', field: 'isGenerating', value: true })
    try {
      const result = await generateTasks({
        projectId,
        description: input,
        epicTitle: epicTitle || undefined
      })

      if (result.tasks && result.tasks.length > 0) {
        const tasksWithSelection = result.tasks.map((t: any) => ({ ...t, selected: true }))
        dispatch({ type: 'UPDATE', field: 'generatedTasks', value: tasksWithSelection })
        dispatch({ type: 'UPDATE', field: 'showModal', value: true })
      } else {
        toast.error('Could not generate tasks. Try a more detailed description.')
      }
    } catch (error) {
      console.error('Error generating tasks:', error)
      toast.error('Failed to generate tasks. Check console for details.')
    } finally {
      dispatch({ type: 'UPDATE', field: 'isGenerating', value: false })
    }
  }

  const selectedTasks = generatedTasks.filter(t => t.selected)

  const handleCreateSelected = async () => {
    if (selectedTasks.length === 0) {
      toast.error('Select at least one task to create')
      return
    }

    dispatch({ type: 'UPDATE', field: 'isCreating', value: true })
    dispatch({ type: 'UPDATE', field: 'createdCount', value: 0 })

    let created = 0
    for (const task of selectedTasks) {
      try {
        await createTask({
          projectId,
          title: task.title,
          description: task.description,
          type: task.type,
          priority: task.priority,
          labels: task.suggestedAssigneeRole ? [task.suggestedAssigneeRole] : [],
          estimate: task.estimatedPoints ? { points: task.estimatedPoints } : undefined,
        })
        created++
        dispatch({ type: 'UPDATE', field: 'createdCount', value: created })
      } catch (error) {
        console.error(`Failed to create task "${task.title}":`, error)
      }
    }

    if (created > 0) {
      toast.success(`${created} task${created > 1 ? 's' : ''} added to Backlog`)
      dispatch({ type: 'CLOSE_MODAL' })
      dispatch({ type: 'RESET_FORM' })
      onTasksCreated?.()
    } else {
      toast.error('Failed to create tasks')
      dispatch({ type: 'UPDATE', field: 'isCreating', value: false })
    }
  }

  const handleToggleSelect = (index: number) => {
    const updated = [...generatedTasks]
    updated[index] = { ...updated[index], selected: !updated[index].selected }
    dispatch({ type: 'UPDATE', field: 'generatedTasks', value: updated })
  }

  const handleToggleAll = () => {
    const allSelected = generatedTasks.every(t => t.selected)
    const updated = generatedTasks.map(t => ({ ...t, selected: !allSelected }))
    dispatch({ type: 'UPDATE', field: 'generatedTasks', value: updated })
  }

  const handleEditTask = (index: number, field: keyof GeneratedTask, value: any) => {
    const updated = [...generatedTasks]
    updated[index] = { ...updated[index], [field]: value }
    dispatch({ type: 'UPDATE', field: 'generatedTasks', value: updated })
  }

  const handleRemoveTask = (index: number) => {
    const updated = generatedTasks.filter((_, i) => i !== index)
    if (updated.length === 0) {
      dispatch({ type: 'CLOSE_MODAL' })
    } else {
      dispatch({ type: 'UPDATE', field: 'generatedTasks', value: updated })
    }
  }

  const totalPoints = selectedTasks.reduce((sum, t) => sum + (t.estimatedPoints || 0), 0)

  const examplePrompts = [
    "Build a user authentication system with email verification and password reset",
    "Create a dashboard with charts showing monthly revenue and user growth metrics",
    "Implement a real-time chat feature with typing indicators and read receipts",
    "Add dark mode support to the entire application with theme persistence",
    "Build a file upload system with progress tracking and preview capabilities"
  ]

  return (
    <>
      {/* Inline input section */}
      <div className="w-full p-[16px]">
        <div className="mb-[12px]">
          <h3 className="text-[14px] font-bold uppercase mb-[4px] flex items-center gap-[8px] font-['Inter']">
            <HiOutlineSparkles className="text-[#6366F1]" />
            Natural Language Task Creator
          </h3>
          <p className="text-[12px] text-[#6B7280] font-['Inter']">
            Describe what you want to build and AI will break it down into actionable tasks
          </p>
        </div>

        <div className="space-y-[8px]">
          <textarea
            id="nl-task-description"
            value={input}
            onChange={(e) => dispatch({ type: 'UPDATE', field: 'input', value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && input.trim() && !isGenerating) {
                handleGenerate()
              }
            }}
            placeholder="E.g., Build a user profile page with avatar upload, bio editing, and social links..."
            className="w-full h-[80px] p-[12px] bg-[#0A0A0A] border-2 border-[#2E2E35]
                     text-[13px] text-[#F9FAFB] font-['IBM_Plex_Mono'] resize-none
                     focus:border-[#6366F1] focus:outline-none placeholder:text-[#6B7280]"
            disabled={isGenerating}
          />

          {/* Advanced toggle */}
          <button
            onClick={() => dispatch({ type: 'UPDATE', field: 'showAdvanced', value: !showAdvanced })}
            className="flex items-center gap-[6px] text-[11px] font-bold uppercase
                     text-[#6B7280] hover:text-[#6366F1] font-['IBM_Plex_Mono']"
          >
            <HiOutlineAdjustments className="w-[14px] h-[14px]" />
            Advanced Options
            {showAdvanced ? <HiOutlineChevronUp className="w-[12px] h-[12px]" /> : <HiOutlineChevronDown className="w-[12px] h-[12px]" />}
          </button>

          {showAdvanced && (
            <div className="p-[10px] bg-[#0A0A0A] border border-[#1F1F23]">
              <label htmlFor="nl-task-epic-title" className="block text-[10px] font-bold uppercase mb-[6px] text-[#6B7280] font-['IBM_Plex_Mono']">
                Epic Title (Optional)
              </label>
              <input
                id="nl-task-epic-title"
                type="text"
                value={epicTitle}
                onChange={(e) => dispatch({ type: 'UPDATE', field: 'epicTitle', value: e.target.value })}
                placeholder="E.g., User Profile Management"
                className="w-full px-[8px] py-[6px] bg-[#111111] border border-[#2E2E35]
                         text-[12px] text-[#F9FAFB] font-['IBM_Plex_Mono']
                         focus:border-[#6366F1] focus:outline-none placeholder:text-[#6B7280]"
              />
            </div>
          )}

          {/* Example prompts */}
          <div className="flex flex-wrap gap-[6px]">
            <span className="text-[10px] font-bold uppercase text-[#6B7280] self-center mr-[2px] font-['IBM_Plex_Mono']">Try:</span>
            {examplePrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => dispatch({ type: 'UPDATE', field: 'input', value: prompt })}
                className="px-[8px] py-[3px] bg-[#0A0A0A] border border-[#1F1F23]
                         text-[10px] text-[#9CA3AF] font-['Inter']
                         hover:border-[#6366F1] hover:text-[#F9FAFB] transition-colors"
              >
                {prompt.substring(0, 40)}...
              </button>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !input.trim()}
            className="w-full py-[10px] bg-[#6366F1] text-[#050505]
                     font-bold text-[13px] uppercase font-['IBM_Plex_Mono']
                     hover:bg-[#4F46E5] disabled:opacity-40 disabled:cursor-not-allowed
                     flex items-center justify-center gap-[8px] transition-colors"
          >
            {isGenerating ? (
              <>
                <HiOutlineRefresh className="animate-spin w-[16px] h-[16px]" />
                Generating...
              </>
            ) : (
              <>
                <HiOutlineLightBulb className="w-[16px] h-[16px]" />
                Generate Tasks
                <span className="text-[10px] opacity-60 ml-[4px]">{navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter</span>
              </>
            )}
          </button>

          {/* Resume banner — shows when tasks exist but modal is closed */}
          {generatedTasks.length > 0 && !showModal && (
            <div className="flex items-center justify-between p-[10px] bg-[#6366F1]/10 border-2 border-[#6366F1]/30">
              <div className="flex items-center gap-[8px]">
                <HiOutlineSparkles className="w-[14px] h-[14px] text-[#6366F1]" />
                <span className="text-[12px] text-[#F9FAFB] font-['Inter']">
                  {generatedTasks.length} generated task{generatedTasks.length !== 1 ? 's' : ''} ready for review
                </span>
              </div>
              <div className="flex items-center gap-[8px]">
                <button
                  onClick={() => dispatch({ type: 'UPDATE', field: 'showModal', value: true })}
                  className="px-[12px] py-[4px] bg-[#6366F1] text-[#050505] text-[11px] font-bold uppercase
                           font-['IBM_Plex_Mono'] hover:bg-[#4F46E5] transition-colors"
                >
                  Review Tasks
                </button>
                <button
                  onClick={() => {
                    dispatch({ type: 'UPDATE', field: 'generatedTasks', value: [] })
                  }}
                  className="p-[4px] text-[#6B7280] hover:text-[#EF4444]"
                  aria-label="Discard tasks"
                >
                  <HiOutlineX className="w-[14px] h-[14px]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget && !isCreating) dispatch({ type: 'CLOSE_MODAL' }) }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <div
            ref={modalRef}
            className="relative w-full max-w-[680px] max-h-[85vh] mx-[16px] bg-[#0A0A0A] border-2 border-[#2E2E35] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-[20px] py-[14px] border-b-2 border-[#2E2E35]">
              <div>
                <h2 className="text-[16px] font-bold text-[#F9FAFB] uppercase font-['Inter'] flex items-center gap-[8px]">
                  <HiOutlineSparkles className="text-[#6366F1]" />
                  Review Generated Tasks
                </h2>
                <p className="text-[11px] text-[#6B7280] mt-[2px] font-['Inter']">
                  {generatedTasks.length} tasks generated — select which to add to your backlog
                </p>
              </div>
              {!isCreating && (
                <button
                  onClick={() => dispatch({ type: 'CLOSE_MODAL' })}
                  className="p-[6px] text-[#6B7280] hover:text-[#F9FAFB] hover:bg-[#111111]"
                  aria-label="Close"
                >
                  <HiOutlineX className="w-[18px] h-[18px]" />
                </button>
              )}
            </div>

            {/* Select all bar */}
            <div className="flex items-center justify-between px-[20px] py-[8px] bg-[#111111] border-b border-[#1F1F23]">
              <button
                onClick={handleToggleAll}
                className="flex items-center gap-[8px] text-[11px] font-bold uppercase text-[#9CA3AF] hover:text-[#F9FAFB] font-['IBM_Plex_Mono']"
              >
                <div className={`w-[16px] h-[16px] border-2 flex items-center justify-center ${
                  generatedTasks.every(t => t.selected)
                    ? 'border-[#6366F1] bg-[#6366F1] text-[#050505]'
                    : 'border-[#2E2E35]'
                }`}>
                  {generatedTasks.every(t => t.selected) && <HiOutlineCheck className="w-[10px] h-[10px]" />}
                </div>
                {generatedTasks.every(t => t.selected) ? 'Deselect All' : 'Select All'}
              </button>

              <div className="flex items-center gap-[12px] text-[11px] text-[#6B7280] font-['IBM_Plex_Mono']">
                <span>{selectedTasks.length}/{generatedTasks.length} selected</span>
                {totalPoints > 0 && <span>{totalPoints} points total</span>}
              </div>
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto px-[20px] py-[12px] space-y-[8px]">
              {generatedTasks.map((task, index) => (
                <ReviewTaskCard
                  key={`${task.title}-${index}`}
                  task={task}
                  index={index}
                  isEditing={editingIndex === index}
                  isExpanded={expandedIndex === index}
                  onToggleSelect={handleToggleSelect}
                  onToggleEdit={(i) => dispatch({ type: 'UPDATE', field: 'editingIndex', value: editingIndex === i ? null : i })}
                  onToggleExpand={(i) => dispatch({ type: 'UPDATE', field: 'expandedIndex', value: expandedIndex === i ? null : i })}
                  onEditField={handleEditTask}
                  onRemove={handleRemoveTask}
                />
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-[20px] py-[14px] border-t-2 border-[#2E2E35] bg-[#111111]">
              {isCreating ? (
                /* Progress bar during creation */
                <div>
                  <div className="flex items-center justify-between mb-[8px]">
                    <span className="text-[12px] font-bold uppercase text-[#F9FAFB] font-['IBM_Plex_Mono']">
                      Creating tasks...
                    </span>
                    <span className="text-[12px] text-[#6366F1] font-bold font-['IBM_Plex_Mono']">
                      {createdCount}/{selectedTasks.length}
                    </span>
                  </div>
                  <div className="w-full h-[4px] bg-[#2E2E35]">
                    <div
                      className="h-full bg-[#6366F1] transition-all duration-300"
                      style={{ width: `${(createdCount / selectedTasks.length) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => dispatch({ type: 'CLOSE_MODAL' })}
                    className="px-[16px] py-[8px] border-2 border-[#2E2E35] text-[12px] font-bold uppercase
                             text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#F9FAFB] font-['IBM_Plex_Mono']
                             transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleCreateSelected}
                    disabled={selectedTasks.length === 0}
                    className="px-[20px] py-[8px] bg-[#22C55E] text-[#050505]
                             text-[12px] font-bold uppercase font-['IBM_Plex_Mono']
                             hover:bg-[#16A34A] disabled:opacity-40 disabled:cursor-not-allowed
                             flex items-center gap-[6px] transition-colors"
                  >
                    <HiOutlinePlus className="w-[14px] h-[14px]" />
                    Add {selectedTasks.length} Task{selectedTasks.length !== 1 ? 's' : ''} to Backlog
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
