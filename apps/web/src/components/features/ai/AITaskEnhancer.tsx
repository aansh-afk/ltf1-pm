import React, { useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { 
  HiOutlineSparkles,
  HiOutlineLightningBolt,
  HiOutlineUser,
  HiOutlineFlag,
  HiOutlineClipboardCheck,
  HiOutlineRefresh,
  HiOutlineCheck
} from 'react-icons/hi'
import toast from 'react-hot-toast'

interface AITaskEnhancerProps {
  task: {
    _id?: Id<'tasks'>
    title: string
    description?: string
    type?: string
    priority?: string
    assigneeId?: Id<'users'>
    labels?: string[]
    estimate?: { points?: number; hours?: number }
  }
  team?: {
    _id: Id<'users'>
    name: string
    role?: string
  }[]
  onUpdate: (updates: any) => void
}

interface AIEnhancements {
  improvedTitle?: string
  improvedDescription?: string
  suggestedPriority?: 'low' | 'medium' | 'high' | 'urgent'
  priorityReasoning?: string
  suggestedAssignee?: {
    userId: Id<'users'>
    reasoning: string
  }
  estimatedPoints?: number
  estimatedHours?: number
  acceptanceCriteria?: string[]
  potentialRisks?: string[]
  dependencies?: string[]
  labels?: string[]
}

// --- Helper functions (module scope) ---

function improveTitle(title: string): string {
  if (!title.toLowerCase().startsWith('implement') &&
      !title.toLowerCase().startsWith('fix') &&
      !title.toLowerCase().startsWith('add') &&
      !title.toLowerCase().startsWith('update')) {
    return `Implement ${title}`
  }
  return title.charAt(0).toUpperCase() + title.slice(1)
}

function generateDescription(title: string, currentDesc?: string): string {
  if (currentDesc && currentDesc.length > 50) return currentDesc

  return `## Overview
${title}

## Technical Details
- Implementation approach to be determined
- Consider existing patterns in the codebase
- Ensure compatibility with current architecture

## Testing Requirements
- Unit tests for new functionality
- Integration tests if applicable
- Manual testing checklist`
}

function suggestPriority(title: string, description?: string): 'low' | 'medium' | 'high' | 'urgent' {
  const text = `${title} ${description || ''}`.toLowerCase()

  if (text.includes('critical') || text.includes('urgent') || text.includes('bug') || text.includes('security')) {
    return 'urgent'
  }
  if (text.includes('important') || text.includes('core') || text.includes('auth') || text.includes('payment')) {
    return 'high'
  }
  if (text.includes('enhancement') || text.includes('improve') || text.includes('optimize')) {
    return 'medium'
  }
  return 'low'
}

function generatePriorityReasoning(title: string): string {
  const priority = suggestPriority(title)

  switch (priority) {
    case 'urgent':
      return 'Critical functionality or bug fix that blocks other work'
    case 'high':
      return 'Core feature that impacts user experience significantly'
    case 'medium':
      return 'Important enhancement that improves the product'
    default:
      return 'Nice-to-have feature that can be scheduled flexibly'
  }
}

function suggestAssignee(title: string, team: any[]): { userId: Id<'users'>; reasoning: string } | undefined {
  if (team.length === 0) return undefined

  const titleLower = title.toLowerCase()

  for (const member of team) {
    if (titleLower.includes('frontend') || titleLower.includes('ui') || titleLower.includes('design')) {
      if (member.role?.toLowerCase().includes('frontend')) {
        return {
          userId: member._id,
          reasoning: 'Frontend specialist for UI-related tasks'
        }
      }
    }
    if (titleLower.includes('backend') || titleLower.includes('api') || titleLower.includes('database')) {
      if (member.role?.toLowerCase().includes('backend')) {
        return {
          userId: member._id,
          reasoning: 'Backend specialist for server-side tasks'
        }
      }
    }
  }

  return {
    userId: team[0]._id,
    reasoning: 'Available team member with capacity'
  }
}

function estimatePoints(title: string, description?: string): number {
  const text = `${title} ${description || ''}`.toLowerCase()

  if (text.includes('simple') || text.includes('minor') || text.includes('quick')) return 1
  if (text.includes('complex') || text.includes('major') || text.includes('system')) return 8
  if (text.includes('epic') || text.includes('redesign') || text.includes('migration')) return 13

  return 3
}

function estimateHours(title: string, description?: string): number {
  const points = estimatePoints(title, description)
  return points * 4
}

function generateAcceptanceCriteria(_title: string): string[] {
  return [
    'Feature works as described in requirements',
    'All edge cases are handled properly',
    'Code follows project conventions and standards',
    'Tests are written and passing',
    'Documentation is updated if needed'
  ]
}

function identifyRisks(title: string): string[] {
  const risks: string[] = []
  const titleLower = title.toLowerCase()

  if (titleLower.includes('migration') || titleLower.includes('database')) {
    risks.push('Data loss or corruption during migration')
  }
  if (titleLower.includes('auth') || titleLower.includes('security')) {
    risks.push('Security vulnerabilities if not implemented correctly')
  }
  if (titleLower.includes('payment') || titleLower.includes('billing')) {
    risks.push('Financial implications if errors occur')
  }
  if (titleLower.includes('performance') || titleLower.includes('optimize')) {
    risks.push('Potential performance regression in other areas')
  }

  if (risks.length === 0) {
    risks.push('Timeline may extend if requirements change')
  }

  return risks
}

function identifyDependencies(title: string): string[] {
  const deps: string[] = []
  const titleLower = title.toLowerCase()

  if (titleLower.includes('api')) {
    deps.push('Backend API endpoints must be ready')
  }
  if (titleLower.includes('design') || titleLower.includes('ui')) {
    deps.push('Design mockups and specifications')
  }
  if (titleLower.includes('integration')) {
    deps.push('Third-party service credentials and documentation')
  }

  return deps
}

function generateLabels(title: string, description?: string): string[] {
  const labels: string[] = []
  const text = `${title} ${description || ''}`.toLowerCase()

  if (text.includes('frontend') || text.includes('ui')) labels.push('frontend')
  if (text.includes('backend') || text.includes('api')) labels.push('backend')
  if (text.includes('bug') || text.includes('fix')) labels.push('bug')
  if (text.includes('feature')) labels.push('feature')
  if (text.includes('performance')) labels.push('performance')
  if (text.includes('security')) labels.push('security')
  if (text.includes('documentation')) labels.push('docs')

  return labels
}

// --- Sub-components ---

interface AIEnhancementsSuggestionsProps {
  enhancements: AIEnhancements
  task: AITaskEnhancerProps['task']
  team: NonNullable<AITaskEnhancerProps['team']>
  selectedEnhancements: Set<string>
  onToggleEnhancement: (key: string) => void
  onApply: () => void
}

function AIEnhancementsSuggestions({
  enhancements,
  task,
  team,
  selectedEnhancements,
  onToggleEnhancement,
  onApply
}: AIEnhancementsSuggestionsProps) {
  return (
    <div className="space-y-[6px]">
      <h4 className="text-brutal-sm font-bold uppercase mb-8px">AI Suggestions</h4>

      {/* Title Enhancement */}
      {enhancements.improvedTitle && enhancements.improvedTitle !== task.title && (
        <div className="p-12px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
          <label htmlFor="ai-enhance-improved-title" aria-label="Improved Title" className="flex items-start gap-8px cursor-pointer">
            <input
              id="ai-enhance-improved-title"
              type="checkbox"
              checked={selectedEnhancements.has('improvedTitle')}
              onChange={() => onToggleEnhancement('improvedTitle')}
              className="mt-2px"
            />
            <div className="flex-1">
              <p className="text-brutal-xs font-bold uppercase mb-4px">Improved Title</p>
              <p className="text-brutal-sm">{enhancements.improvedTitle}</p>
            </div>
          </label>
        </div>
      )}

      {/* Priority Suggestion */}
      {enhancements.suggestedPriority && (
        <div className="p-12px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
          <label htmlFor="ai-enhance-suggested-priority" aria-label="Suggested Priority" className="flex items-start gap-8px cursor-pointer">
            <input
              id="ai-enhance-suggested-priority"
              type="checkbox"
              checked={selectedEnhancements.has('suggestedPriority')}
              onChange={() => onToggleEnhancement('suggestedPriority')}
              className="mt-2px"
            />
            <div className="flex-1">
              <p className="text-brutal-xs font-bold uppercase mb-4px flex items-center gap-4px">
                <HiOutlineFlag />
                Suggested Priority
              </p>
              <p className="text-brutal-sm">
                <span className={`font-bold ${
                  enhancements.suggestedPriority === 'urgent' ? 'text-[var(--theme-error)]' :
                  enhancements.suggestedPriority === 'high' ? 'text-[var(--theme-warning)]' :
                  enhancements.suggestedPriority === 'medium' ? 'text-[var(--theme-info)]' :
                  'text-[var(--theme-foreground-secondary)]'
                }`}>
                  {enhancements.suggestedPriority.toUpperCase()}
                </span>
                {enhancements.priorityReasoning && (
                  <span className="text-[var(--theme-foreground-secondary)] ml-8px">
                    - {enhancements.priorityReasoning}
                  </span>
                )}
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Assignee Suggestion */}
      {enhancements.suggestedAssignee && team.length > 0 && (
        <div className="p-12px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
          <label htmlFor="ai-enhance-suggested-assignee" aria-label="Suggested Assignee" className="flex items-start gap-8px cursor-pointer">
            <input
              id="ai-enhance-suggested-assignee"
              type="checkbox"
              checked={selectedEnhancements.has('suggestedAssignee')}
              onChange={() => onToggleEnhancement('suggestedAssignee')}
              className="mt-2px"
            />
            <div className="flex-1">
              <p className="text-brutal-xs font-bold uppercase mb-4px flex items-center gap-4px">
                <HiOutlineUser />
                Suggested Assignee
              </p>
              <p className="text-brutal-sm">
                {team.find(m => m._id === enhancements.suggestedAssignee?.userId)?.name || 'Unknown'}
                <span className="text-[var(--theme-foreground-secondary)] ml-8px">
                  - {enhancements.suggestedAssignee.reasoning}
                </span>
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Estimates */}
      <div className="grid grid-cols-2 gap-8px">
        {enhancements.estimatedPoints && (
          <div className="p-12px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
            <label htmlFor="ai-enhance-estimated-points" aria-label="Story Points" className="flex items-start gap-8px cursor-pointer">
              <input
                id="ai-enhance-estimated-points"
                type="checkbox"
                checked={selectedEnhancements.has('estimatedPoints')}
                onChange={() => onToggleEnhancement('estimatedPoints')}
                className="mt-2px"
              />
              <div className="flex-1">
                <p className="text-brutal-xs font-bold uppercase mb-4px">Story Points</p>
                <p className="text-brutal-sm font-bold">{enhancements.estimatedPoints}</p>
              </div>
            </label>
          </div>
        )}

        {enhancements.estimatedHours && (
          <div className="p-12px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
            <label htmlFor="ai-enhance-estimated-hours" aria-label="Estimated Hours" className="flex items-start gap-8px cursor-pointer">
              <input
                id="ai-enhance-estimated-hours"
                type="checkbox"
                checked={selectedEnhancements.has('estimatedHours')}
                onChange={() => onToggleEnhancement('estimatedHours')}
                className="mt-2px"
              />
              <div className="flex-1">
                <p className="text-brutal-xs font-bold uppercase mb-4px">Hours</p>
                <p className="text-brutal-sm font-bold">{enhancements.estimatedHours}h</p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Labels */}
      {enhancements.labels && enhancements.labels.length > 0 && (
        <div className="p-12px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
          <label htmlFor="ai-enhance-labels" aria-label="Suggested Labels" className="flex items-start gap-8px cursor-pointer">
            <input
              id="ai-enhance-labels"
              type="checkbox"
              checked={selectedEnhancements.has('labels')}
              onChange={() => onToggleEnhancement('labels')}
              className="mt-2px"
            />
            <div className="flex-1">
              <p className="text-brutal-xs font-bold uppercase mb-4px">Suggested Labels</p>
              <div className="flex flex-wrap gap-4px">
                {enhancements.labels.map(label => (
                  <span key={label} className="px-8px py-2px bg-[var(--theme-primary)] text-[var(--theme-background)] text-brutal-xs">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Acceptance Criteria */}
      {enhancements.acceptanceCriteria && enhancements.acceptanceCriteria.length > 0 && (
        <div className="p-12px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
          <label htmlFor="ai-enhance-acceptance-criteria" aria-label="Acceptance Criteria" className="flex items-start gap-8px cursor-pointer">
            <input
              id="ai-enhance-acceptance-criteria"
              type="checkbox"
              checked={selectedEnhancements.has('acceptanceCriteria')}
              onChange={() => onToggleEnhancement('acceptanceCriteria')}
              className="mt-2px"
            />
            <div className="flex-1">
              <p className="text-brutal-xs font-bold uppercase mb-4px flex items-center gap-4px">
                <HiOutlineClipboardCheck />
                Acceptance Criteria
              </p>
              <ul className="list-disc list-inside text-brutal-xs text-[var(--theme-foreground-secondary)]">
                {enhancements.acceptanceCriteria.map((criteria) => (
                  <li key={criteria}>{criteria}</li>
                ))}
              </ul>
            </div>
          </label>
        </div>
      )}

      {/* Apply Button */}
      <button
        onClick={onApply}
        disabled={selectedEnhancements.size === 0}
        className="px-[10px] py-12px bg-[var(--theme-success)] text-[var(--theme-background)]
                 font-bold text-brutal-sm uppercase w-full
                 hover:bg-[var(--theme-success-hover)] disabled:opacity-50 disabled:cursor-not-allowed
                 flex items-center gap-8px justify-center"
      >
        <HiOutlineCheck />
        Apply Selected Enhancements ({selectedEnhancements.size})
      </button>
    </div>
  )
}

// --- Main component ---

const EMPTY_TEAM: NonNullable<AITaskEnhancerProps['team']> = []

export default function AITaskEnhancer({
  task,
  team = EMPTY_TEAM,
  onUpdate
}: AITaskEnhancerProps) {
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancements, setEnhancements] = useState<AIEnhancements | null>(null)
  const [selectedEnhancements, setSelectedEnhancements] = useState<Set<string>>(new Set())
  
  const enhanceWithAI = async () => {
    setIsEnhancing(true)
    
    try {
      // Simulate AI enhancement (in production, this would call your AI endpoint)
      // For now, let's create smart suggestions based on the task
      const mockEnhancements: AIEnhancements = {
        improvedTitle: improveTitle(task.title),
        improvedDescription: generateDescription(task.title, task.description),
        suggestedPriority: suggestPriority(task.title, task.description),
        priorityReasoning: generatePriorityReasoning(task.title),
        suggestedAssignee: suggestAssignee(task.title, team),
        estimatedPoints: estimatePoints(task.title, task.description),
        estimatedHours: estimateHours(task.title, task.description),
        acceptanceCriteria: generateAcceptanceCriteria(task.title),
        potentialRisks: identifyRisks(task.title),
        dependencies: identifyDependencies(task.title),
        labels: generateLabels(task.title, task.description)
      }
      
      setEnhancements(mockEnhancements)
      
      // Auto-select all enhancements by default
      const allKeys = Object.keys(mockEnhancements)
      setSelectedEnhancements(new Set(allKeys))
      
      toast.success('AI enhancements generated successfully')
    } catch (error) {
      console.error('Error enhancing task:', error)
      toast.error('Failed to generate AI enhancements')
    } finally {
      setIsEnhancing(false)
    }
  }
  
  const applyEnhancements = () => {
    if (!enhancements) return
    
    const updates: any = {}
    
    if (selectedEnhancements.has('improvedTitle') && enhancements.improvedTitle) {
      updates.title = enhancements.improvedTitle
    }
    if (selectedEnhancements.has('improvedDescription') && enhancements.improvedDescription) {
      updates.description = enhancements.improvedDescription
    }
    if (selectedEnhancements.has('suggestedPriority') && enhancements.suggestedPriority) {
      updates.priority = enhancements.suggestedPriority
    }
    if (selectedEnhancements.has('suggestedAssignee') && enhancements.suggestedAssignee) {
      updates.assigneeId = enhancements.suggestedAssignee.userId
    }
    if (selectedEnhancements.has('estimatedPoints') && enhancements.estimatedPoints) {
      updates.estimate = { ...updates.estimate, points: enhancements.estimatedPoints }
    }
    if (selectedEnhancements.has('estimatedHours') && enhancements.estimatedHours) {
      updates.estimate = { ...updates.estimate, hours: enhancements.estimatedHours }
    }
    if (selectedEnhancements.has('labels') && enhancements.labels) {
      updates.labels = enhancements.labels
    }
    
    // For fields that need to be added to description
    let enhancedDescription = updates.description || task.description || ''
    
    if (selectedEnhancements.has('acceptanceCriteria') && enhancements.acceptanceCriteria) {
      enhancedDescription += '\n\n## Acceptance Criteria\n'
      enhancedDescription += enhancements.acceptanceCriteria.map(c => `- ${c}`).join('\n')
    }
    if (selectedEnhancements.has('potentialRisks') && enhancements.potentialRisks) {
      enhancedDescription += '\n\n## Potential Risks\n'
      enhancedDescription += enhancements.potentialRisks.map(r => `- ${r}`).join('\n')
    }
    if (selectedEnhancements.has('dependencies') && enhancements.dependencies) {
      enhancedDescription += '\n\n## Dependencies\n'
      enhancedDescription += enhancements.dependencies.map(d => `- ${d}`).join('\n')
    }
    
    if (enhancedDescription !== (task.description || '')) {
      updates.description = enhancedDescription
    }
    
    onUpdate(updates)
    toast.success('Applied AI enhancements to task')
    setEnhancements(null)
  }
  
  const toggleEnhancement = (key: string) => {
    const newSet = new Set(selectedEnhancements)
    if (newSet.has(key)) {
      newSet.delete(key)
    } else {
      newSet.add(key)
    }
    setSelectedEnhancements(newSet)
  }
  
  return (
    <div className="w-full">
      <div className="mb-[8px]">
        <button
          onClick={enhanceWithAI}
          disabled={isEnhancing}
          className="px-[10px] py-12px bg-[var(--theme-primary)] text-[var(--theme-background)]
                   font-bold text-brutal-sm uppercase
                   hover:bg-[var(--theme-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center gap-8px w-full justify-center"
        >
          {isEnhancing ? (
            <>
              <HiOutlineRefresh className="animate-spin" />
              Enhancing with AI...
            </>
          ) : (
            <>
              <HiOutlineSparkles />
              Enhance Task with AI
            </>
          )}
        </button>
      </div>
      
      {enhancements && (
        <AIEnhancementsSuggestions
          enhancements={enhancements}
          task={task}
          team={team}
          selectedEnhancements={selectedEnhancements}
          onToggleEnhancement={toggleEnhancement}
          onApply={applyEnhancements}
        />
      )}
    </div>
  )
}