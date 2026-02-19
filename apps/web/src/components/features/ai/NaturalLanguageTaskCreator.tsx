import React, { useReducer } from 'react'
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
  HiOutlinePencil
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
}

type NLTaskState = {
  input: string
  isGenerating: boolean
  generatedTasks: GeneratedTask[]
  editingIndex: number | null
  showAdvanced: boolean
  epicTitle: string
}

const nlTaskInitialState: NLTaskState = {
  input: '',
  isGenerating: false,
  generatedTasks: [],
  editingIndex: null,
  showAdvanced: false,
  epicTitle: '',
}

type NLTaskAction =
  | { type: 'UPDATE'; field: keyof NLTaskState; value: unknown }
  | { type: 'RESET_FORM' }

function nlTaskReducer(state: NLTaskState, action: NLTaskAction): NLTaskState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'RESET_FORM':
      return { ...state, generatedTasks: [], input: '', epicTitle: '' }
    default:
      return state
  }
}

// --- Sub-components ---

interface NLGeneratedTaskItemProps {
  task: GeneratedTask
  index: number
  isEditing: boolean
  onToggleEdit: (index: number) => void
  onEditField: (index: number, field: keyof GeneratedTask, value: any) => void
  onRemove: (index: number) => void
}

function NLGeneratedTaskItem({ task, index, isEditing, onToggleEdit, onEditField, onRemove }: NLGeneratedTaskItemProps) {
  return (
    <div
      className="p-[10px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]"
    >
      <div className="flex items-start justify-between mb-12px">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={task.title}
              onChange={(e) => onEditField(index, 'title', e.target.value)}
              aria-label="Edit task title"
              className="w-full p-4px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]
                       text-brutal-sm font-bold"
            />
          ) : (
            <h5 className="text-brutal-sm font-bold">{task.title}</h5>
          )}
        </div>
        <div className="flex items-center gap-8px ml-16px">
          <button
            onClick={() => onToggleEdit(index)}
            className="p-4px hover:bg-[var(--theme-background-secondary)]"
          >
            <HiOutlinePencil className="text-brutal-sm" />
          </button>
          <button
            onClick={() => onRemove(index)}
            className="p-4px hover:bg-[var(--theme-error)] hover:text-[var(--theme-background)]"
          >
            <HiOutlineX className="text-brutal-sm" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={task.description}
          onChange={(e) => onEditField(index, 'description', e.target.value)}
          aria-label="Edit task description"
          className="w-full h-80px p-8px mb-12px bg-[var(--theme-background-secondary)]
                   border border-[var(--theme-border)] text-brutal-xs resize-none"
        />
      ) : (
        <p className="text-brutal-xs text-[var(--theme-foreground-secondary)] mb-12px">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap gap-8px text-brutal-xs">
        <span className={`px-8px py-2px border ${
          task.type === 'feature' ? 'border-[var(--theme-success)] text-[var(--theme-success)]' :
          task.type === 'bug' ? 'border-[var(--theme-error)] text-[var(--theme-error)]' :
          task.type === 'improvement' ? 'border-[var(--theme-info)] text-[var(--theme-info)]' :
          'border-[var(--theme-border)]'
        }`}>
          {task.type}
        </span>

        <span className={`px-8px py-2px border ${
          task.priority === 'urgent' ? 'border-[var(--theme-error)] text-[var(--theme-error)]' :
          task.priority === 'high' ? 'border-[var(--theme-warning)] text-[var(--theme-warning)]' :
          task.priority === 'medium' ? 'border-[var(--theme-info)] text-[var(--theme-info)]' :
          'border-[var(--theme-border)]'
        }`}>
          {task.priority}
        </span>

        {task.estimatedPoints && (
          <span className="px-8px py-2px border border-[var(--theme-border)]">
            {task.estimatedPoints} points
          </span>
        )}

        {task.suggestedAssigneeRole && (
          <span className="px-8px py-2px bg-[var(--theme-primary)] text-[var(--theme-background)]">
            {task.suggestedAssigneeRole}
          </span>
        )}
      </div>

      {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
        <div className="mt-12px pt-12px border-t border-[var(--theme-border)]">
          <p className="text-brutal-xs font-bold uppercase mb-4px">Acceptance Criteria:</p>
          <ul className="list-disc list-inside text-brutal-xs text-[var(--theme-foreground-secondary)]">
            {task.acceptanceCriteria.map((criteria) => (
              <li key={criteria}>{criteria}</li>
            ))}
          </ul>
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
  const { input, isGenerating, generatedTasks, editingIndex, showAdvanced, epicTitle } = state
  
  const generateTasks = useAction(api.ai.projectInsights.generateTasksFromDescription)
  const createTask = useMutation(api.tasks.create)
  
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
        dispatch({ type: 'UPDATE', field: 'generatedTasks', value: result.tasks })
        toast.success(`Generated ${result.tasks.length} tasks from your description`)
      } else {
        toast.error('Could not generate tasks. Please try a different description.')
      }
    } catch (error) {
      console.error('Error generating tasks:', error)
      toast.error('Failed to generate tasks. Please check your API key setup.')
    } finally {
      dispatch({ type: 'UPDATE', field: 'isGenerating', value: false })
    }
  }
  
  const handleCreateTasks = async () => {
    if (generatedTasks.length === 0) return
    
    try {
      const createdTasks = []
      
      for (const task of generatedTasks) {
        const taskId = await createTask({
          projectId,
          title: task.title,
          description: task.description,
          type: task.type,
          priority: task.priority,
          sprintId: sprintId || undefined,
          labels: task.suggestedAssigneeRole ? [task.suggestedAssigneeRole] : [],
          estimate: task.estimatedPoints ? { points: task.estimatedPoints } : undefined
        })
        createdTasks.push(taskId)
      }
      
      toast.success(`Created ${createdTasks.length} tasks successfully`)
      dispatch({ type: 'RESET_FORM' })
      onTasksCreated?.()
    } catch (error) {
      console.error('Error creating tasks:', error)
      toast.error('Failed to create some tasks')
    }
  }
  
  const handleEditTask = (index: number, field: keyof GeneratedTask, value: any) => {
    const updated = [...generatedTasks]
    updated[index] = {
      ...updated[index],
      [field]: value
    }
    dispatch({ type: 'UPDATE', field: 'generatedTasks', value: updated })
  }
  
  const handleRemoveTask = (index: number) => {
    dispatch({ type: 'UPDATE', field: 'generatedTasks', value: generatedTasks.filter((_, i) => i !== index) })
  }
  
  const examplePrompts = [
    "Build a user authentication system with email verification and password reset",
    "Create a dashboard with charts showing monthly revenue and user growth metrics",
    "Implement a real-time chat feature with typing indicators and read receipts",
    "Add dark mode support to the entire application with theme persistence",
    "Build a file upload system with progress tracking and preview capabilities"
  ]
  
  return (
    <div className="w-full">
      <div className="mb-[12px]">
        <h3 className="text-[14px] font-semibold font-bold uppercase mb-8px flex items-center gap-8px">
          <HiOutlineSparkles className="text-[var(--theme-primary)]" />
          Natural Language Task Creator
        </h3>
        <p className="text-brutal-sm text-[var(--theme-foreground-secondary)]">
          Describe what you want to build and AI will break it down into actionable tasks
        </p>
      </div>
      
      {/* Input Section */}
      <div className="space-y-[8px]">
        <div>
          <label htmlFor="nl-task-description" className="block text-brutal-xs font-bold uppercase mb-8px">
            Describe Your Feature or Epic
          </label>
          <textarea
            id="nl-task-description"
            value={input}
            onChange={(e) => dispatch({ type: 'UPDATE', field: 'input', value: e.target.value })}
            placeholder="E.g., Build a user profile page with avatar upload, bio editing, and social links..."
            className="w-full h-100px p-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                     text-brutal-sm font-mono resize-none
                     focus:border-[var(--theme-primary)] focus:outline-none"
            disabled={isGenerating}
          />
        </div>
        
        {/* Advanced Options */}
        <div>
          <button
            onClick={() => dispatch({ type: 'UPDATE', field: 'showAdvanced', value: !showAdvanced })}
            className="flex items-center gap-8px text-brutal-xs font-bold uppercase
                     text-[var(--theme-foreground-secondary)] hover:text-[var(--theme-primary)]"
          >
            <HiOutlineAdjustments />
            Advanced Options
          </button>
          
          {showAdvanced && (
            <div className="mt-12px p-12px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
              <label htmlFor="nl-task-epic-title" className="block text-brutal-xs font-bold uppercase mb-8px">
                Epic Title (Optional)
              </label>
              <input
                id="nl-task-epic-title"
                type="text"
                value={epicTitle}
                onChange={(e) => dispatch({ type: 'UPDATE', field: 'epicTitle', value: e.target.value })}
                placeholder="E.g., User Profile Management"
                className="w-full p-8px bg-[var(--theme-background)] border border-[var(--theme-border)]
                         text-brutal-sm font-mono
                         focus:border-[var(--theme-primary)] focus:outline-none"
              />
            </div>
          )}
        </div>
        
        {/* Example Prompts */}
        <div>
          <p className="text-brutal-xs font-bold uppercase mb-8px text-[var(--theme-foreground-secondary)]">
            Example Prompts:
          </p>
          <div className="flex flex-wrap gap-8px">
            {examplePrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => dispatch({ type: 'UPDATE', field: 'input', value: prompt })}
                className="px-8px py-4px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]
                         text-brutal-xs hover:bg-[var(--theme-primary)] hover:text-[var(--theme-background)]
                         transition-colors"
              >
                {prompt.substring(0, 40)}...
              </button>
            ))}
          </div>
        </div>
        
        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !input.trim()}
          className="px-[10px] py-12px bg-[var(--theme-primary)] text-[var(--theme-background)]
                   font-bold text-brutal-sm uppercase
                   hover:bg-[var(--theme-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center gap-8px"
        >
          {isGenerating ? (
            <>
              <HiOutlineRefresh className="animate-spin" />
              Generating Tasks...
            </>
          ) : (
            <>
              <HiOutlineLightBulb />
              Generate Tasks
            </>
          )}
        </button>
      </div>
      
      {/* Generated Tasks */}
      {generatedTasks.length > 0 && (
        <div className="mt-[16px]">
          <div className="flex items-center justify-between mb-[8px]">
            <h4 className="text-brutal-md font-bold uppercase">
              Generated Tasks ({generatedTasks.length})
            </h4>
            <div className="flex gap-8px">
              <button
                onClick={() => dispatch({ type: 'UPDATE', field: 'generatedTasks', value: [] })}
                className="px-12px py-8px border-2 border-[var(--theme-border)]
                         text-brutal-xs font-bold uppercase
                         hover:bg-[var(--theme-error)] hover:text-[var(--theme-background)]"
              >
                <HiOutlineX className="inline mr-4px" />
                Clear All
              </button>
              <button
                onClick={handleCreateTasks}
                className="px-12px py-8px bg-[var(--theme-success)] text-[var(--theme-background)]
                         text-brutal-xs font-bold uppercase
                         hover:bg-[var(--theme-success-hover)]"
              >
                <HiOutlinePlus className="inline mr-4px" />
                Create All Tasks
              </button>
            </div>
          </div>
          
          <div className="space-y-[6px]">
            {generatedTasks.map((task, index) => (
              <NLGeneratedTaskItem
                key={`${task.title}-${task.type}`}
                task={task}
                index={index}
                isEditing={editingIndex === index}
                onToggleEdit={(i) => dispatch({ type: 'UPDATE', field: 'editingIndex', value: editingIndex === i ? null : i })}
                onEditField={handleEditTask}
                onRemove={handleRemoveTask}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}