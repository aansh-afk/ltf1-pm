import React, { useState } from 'react'
import { useAction, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { HiOutlineSparkles, HiOutlinePlus, HiOutlineX, HiOutlineCheck, HiOutlineAdjustments } from 'react-icons/hi'

interface SmartTaskGeneratorProps {
  projectId: Id<'projects'>
  sprintId?: Id<'sprints'>
  onTasksCreated?: () => void
  compact?: boolean
}

interface GeneratedTask {
  title: string
  description: string
  type: 'task' | 'feature' | 'bug' | 'improvement'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedPoints: number
  suggestedAssigneeRole: string
  dependencies: string[]
  acceptanceCriteria: string[]
  selected?: boolean
}

export default function SmartTaskGenerator({ 
  projectId, 
  sprintId, 
  onTasksCreated,
  compact = false 
}: SmartTaskGeneratorProps) {
  const [isOpen, setIsOpen] = useState(!compact)
  const [description, setDescription] = useState('')
  const [epicTitle, setEpicTitle] = useState('')
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const generateTasks = useAction(api.ai.projectInsights.generateTasksFromDescription)
  const createTask = useMutation(api.tasks.mutations.createTask)
  
  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter a feature description')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await generateTasks({
        projectId,
        description,
        epicTitle: epicTitle || undefined,
      })
      
      // Add selected flag to all tasks (default true)
      const tasksWithSelection = result.tasks.map((task: GeneratedTask) => ({
        ...task,
        selected: true,
      }))
      
      setGeneratedTasks(tasksWithSelection)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tasks')
      console.error('Task generation failed:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const toggleTaskSelection = (index: number) => {
    setGeneratedTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, selected: !task.selected } : task
    ))
  }
  
  const handleCreateTasks = async () => {
    const selectedTasks = generatedTasks.filter(task => task.selected)
    
    if (selectedTasks.length === 0) {
      setError('Please select at least one task to create')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Create tasks sequentially to maintain order
      for (const task of selectedTasks) {
        await createTask({
          title: task.title,
          description: task.description,
          type: task.type,
          priority: task.priority,
          points: task.estimatedPoints,
          projectId,
          sprintId,
          status: 'todo',
          tags: task.suggestedAssigneeRole ? [task.suggestedAssigneeRole] : [],
        })
      }
      
      // Reset state
      setDescription('')
      setEpicTitle('')
      setGeneratedTasks([])
      setShowAdvanced(false)
      
      if (compact) {
        setIsOpen(false)
      }
      
      onTasksCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tasks')
      console.error('Task creation failed:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'var(--theme-error)'
      case 'high':
        return 'var(--theme-warning)'
      case 'medium':
        return 'var(--theme-info)'
      case 'low':
        return 'var(--theme-foreground-tertiary)'
      default:
        return 'var(--theme-foreground-secondary)'
    }
  }
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return '✨'
      case 'bug':
        return '🐛'
      case 'improvement':
        return '🔧'
      case 'task':
      default:
        return '📝'
    }
  }
  
  if (compact && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-[10px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)] hover:border-[var(--theme-primary)] transition-colors"
      >
        <div className="flex items-center justify-center gap-[6px]">
          <HiOutlineSparkles className="w-20px h-20px text-[var(--theme-primary)]" />
          <span className="text-brutal-sm font-bold uppercase">Generate Tasks with AI</span>
        </div>
      </button>
    )
  }
  
  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[16px]">
      <div className="flex items-center justify-between mb-[8px]">
        <div className="flex items-center gap-[6px]">
          <HiOutlineSparkles className="w-4 h-4 text-[var(--theme-primary)]" />
          <h3 className="text-[14px] font-semibold font-bold uppercase">Smart Task Generator</h3>
        </div>
        {compact && (
          <button
            onClick={() => setIsOpen(false)}
            className="p-[4px] hover:bg-[var(--theme-hover)] transition-colors"
          >
            <HiOutlineX className="w-20px h-20px" />
          </button>
        )}
      </div>
      
      {/* Input Section */}
      <div className="space-y-[8px] mb-[12px]">
        <div>
          <label className="text-brutal-sm font-bold uppercase block mb-[4px]">
            Describe the Feature or Work
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Add user authentication with social login support for Google and GitHub..."
            className="w-full p-[8px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] text-brutal-sm placeholder-[var(--theme-foreground-tertiary)] focus:border-[var(--theme-primary)] transition-colors resize-none"
            rows={4}
            disabled={loading}
          />
        </div>
        
        {/* Advanced Options */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-[4px] text-brutal-sm hover:text-[var(--theme-primary)] transition-colors"
          >
            <HiOutlineAdjustments className="w-16px h-16px" />
            <span>Advanced Options</span>
          </button>
          
          {showAdvanced && (
            <div className="mt-[6px]">
              <label className="text-brutal-xs font-bold uppercase block mb-[4px]">
                Epic Title (Optional)
              </label>
              <input
                type="text"
                value={epicTitle}
                onChange={(e) => setEpicTitle(e.target.value)}
                placeholder="e.g., User Authentication System"
                className="w-full p-[4px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] text-brutal-sm placeholder-[var(--theme-foreground-tertiary)] focus:border-[var(--theme-primary)] transition-colors"
                disabled={loading}
              />
            </div>
          )}
        </div>
        
        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
          className="px-[10px] py-[4px] bg-[var(--theme-primary)] text-[var(--theme-background)] font-bold uppercase hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? 'Generating...' : 'Generate Tasks'}
        </button>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-[8px] p-[8px] bg-[var(--theme-error)]/10 border border-[var(--theme-error)] text-brutal-sm text-[var(--theme-error)]">
          {error}
        </div>
      )}
      
      {/* Generated Tasks */}
      {generatedTasks.length > 0 && (
        <div className="space-y-[8px]">
          <div className="flex items-center justify-between">
            <h4 className="text-brutal-sm font-bold uppercase">Generated Tasks</h4>
            <span className="text-brutal-xs text-[var(--theme-foreground-secondary)]">
              {generatedTasks.filter(t => t.selected).length} of {generatedTasks.length} selected
            </span>
          </div>
          
          <div className="space-y-[4px] max-h-400px overflow-y-auto">
            {generatedTasks.map((task, index) => (
              <div 
                key={index}
                className={`border-2 p-[8px] cursor-pointer transition-all ${
                  task.selected 
                    ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/5' 
                    : 'border-[var(--theme-border)] opacity-60'
                }`}
                onClick={() => toggleTaskSelection(index)}
              >
                <div className="flex items-start gap-[6px]">
                  <div className="mt-4px">
                    {task.selected ? (
                      <HiOutlineCheck className="w-20px h-20px text-[var(--theme-primary)]" />
                    ) : (
                      <div className="w-20px h-20px border-2 border-[var(--theme-border)]" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-[4px] mb-[2px]">
                      <span className="text-[14px] font-semibold">{getTypeIcon(task.type)}</span>
                      <h5 className="text-brutal-sm font-bold">{task.title}</h5>
                    </div>
                    
                    <p className="text-brutal-xs text-[var(--theme-foreground-secondary)] mb-[4px]">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center gap-[8px] text-brutal-xs">
                      <span 
                        className="px-6px py-2px border"
                        style={{ 
                          borderColor: getPriorityColor(task.priority),
                          color: getPriorityColor(task.priority),
                          backgroundColor: getPriorityColor(task.priority) + '20'
                        }}
                      >
                        {task.priority.toUpperCase()}
                      </span>
                      <span className="font-mono">{task.estimatedPoints} pts</span>
                      <span className="text-[var(--theme-foreground-tertiary)]">
                        {task.suggestedAssigneeRole}
                      </span>
                    </div>
                    
                    {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
                      <div className="mt-[4px]">
                        <span className="text-brutal-xs font-bold">Acceptance Criteria:</span>
                        <ul className="mt-4px space-y-2px">
                          {task.acceptanceCriteria.map((criteria, i) => (
                            <li key={i} className="text-brutal-xs text-[var(--theme-foreground-secondary)] ml-[8px]">
                              • {criteria}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-[6px] pt-[8px] border-t border-[var(--theme-border)]">
            <button
              onClick={handleCreateTasks}
              disabled={loading || generatedTasks.filter(t => t.selected).length === 0}
              className="px-[10px] py-[4px] bg-[var(--theme-success)] text-[var(--theme-background)] font-bold uppercase hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              Create {generatedTasks.filter(t => t.selected).length} Tasks
            </button>
            
            <button
              onClick={() => {
                setGeneratedTasks([])
                setDescription('')
                setEpicTitle('')
              }}
              className="px-[10px] py-[4px] border-2 border-[var(--theme-border)] hover:border-[var(--theme-error)] hover:text-[var(--theme-error)] transition-colors font-bold uppercase"
            >
              Clear
            </button>
          </div>
        </div>
      )}
      
      {/* Feature Badge */}
      <div className="mt-[8px] pt-[8px] border-t border-[var(--theme-border)] flex items-center justify-between">
        <span className="text-brutal-xs text-[var(--theme-foreground-tertiary)]">
          Powered by Gemini 2.5 Flash
        </span>
        <span className="text-brutal-xs text-[var(--theme-foreground-tertiary)]">
          AI-Generated • Review Before Creating
        </span>
      </div>
    </div>
  )
}