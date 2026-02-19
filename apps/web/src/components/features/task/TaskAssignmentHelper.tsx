import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { 
  HiOutlineUser,
  HiOutlineUserAdd,
  HiOutlineLightBulb,
  HiOutlineCode,
  HiOutlineSearch
} from 'react-icons/hi'
import clsx from 'clsx'
import { ReviewerSuggestions } from '../profile/ReviewerSuggestions'
import { ExpertiseSearchModal } from '../profile/ExpertiseSearchModal'

interface TaskAssignmentHelperProps {
  workspaceId: Id<"workspaces">
  currentAssignees?: Id<"users">[]
  onAssigneeChange: (assigneeIds: Id<"users">[]) => void
  taskTitle?: string
  taskDescription?: string
  taskLabels?: string[]
  mode?: 'compact' | 'full'
}

const EMPTY_ASSIGNEES: Id<"users">[] = []
const EMPTY_LABELS: string[] = []

export function TaskAssignmentHelper({
  workspaceId,
  currentAssignees = EMPTY_ASSIGNEES,
  onAssigneeChange,
  taskTitle = '',
  taskDescription = '',
  taskLabels = EMPTY_LABELS,
  mode = 'full'
}: TaskAssignmentHelperProps) {
  const [showExpertiseSearch, setShowExpertiseSearch] = useState(false)
  const [extractedTechnologies, setExtractedTechnologies] = useState<string[]>([])
  const [manualTechnologies, setManualTechnologies] = useState<string[]>([])
  const [newTech, setNewTech] = useState('')

  // Get workspace members for assignment dropdown
  const workspaceMembers = useQuery(
    api.workspaces.queries.getWorkspaceMembers,
    { workspaceId }
  )

  // Extract technologies from task title, description, and labels
  useEffect(() => {
    const commonTechnologies = [
      'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Python', 'Java', 
      'Go', 'Rust', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 
      'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 
      'DevOps', 'CI/CD', 'GraphQL', 'REST API', 'Machine Learning', 
      'AI', 'Frontend', 'Backend', 'Full Stack', 'Mobile', 'iOS', 'Android',
      'Swift', 'Kotlin', 'React Native', 'Flutter', 'Convex', 'Next.js',
      'Testing', 'Security', 'Performance', 'Database', 'UI/UX', 'Design'
    ]

    const combinedText = `${taskTitle} ${taskDescription} ${taskLabels.join(' ')}`.toLowerCase()
    
    const found = commonTechnologies.filter(tech => 
      combinedText.includes(tech.toLowerCase())
    )

    setExtractedTechnologies(found)
  }, [taskTitle, taskDescription, taskLabels])

  const allTechnologies = [...new Set([...extractedTechnologies, ...manualTechnologies])]

  const handleAddTechnology = () => {
    if (newTech.trim() && !allTechnologies.includes(newTech.trim())) {
      setManualTechnologies(prev => [...prev, newTech.trim()])
      setNewTech('')
    }
  }

  const handleRemoveTechnology = (tech: string) => {
    setManualTechnologies(prev => prev.filter(t => t !== tech))
  }

  const handleSelectReviewer = (userId: string) => {
    if (currentAssignees.includes(userId as Id<"users">)) {
      onAssigneeChange(currentAssignees.filter(id => id !== userId))
    } else {
      onAssigneeChange([...currentAssignees, userId as Id<"users">])
    }
  }

  if (mode === 'compact') {
    return (
      <div className="space-y-[6px]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-brutal-xs font-bold">ASSIGNEES</span>
          <button
            onClick={() => setShowExpertiseSearch(true)}
            className="text-brutal-xs font-mono text-brutal-info hover:underline"
          >
            FIND EXPERT
          </button>
        </div>

        {allTechnologies.length > 0 && (
          <ReviewerSuggestions
            technologies={allTechnologies}
            workspaceId={workspaceId}
            excludeUserId={undefined}
            maxSuggestions={3}
            onSelectReviewer={handleSelectReviewer}
            mode="compact"
          />
        )}

        {showExpertiseSearch && (
          <ExpertiseSearchModal
            onClose={() => setShowExpertiseSearch(false)}
            workspaceId={workspaceId}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-[8px]">
      {/* Current Assignees */}
      <div>
        <span className="block font-mono text-brutal-sm font-bold mb-[4px]">
          TASK ASSIGNEES
        </span>
        <div className="flex flex-wrap gap-[4px] mb-[6px]">
          {currentAssignees.length === 0 ? (
            <span className="font-mono text-brutal-xs text-primary-brutalist/60">
              No assignees selected
            </span>
          ) : (
            currentAssignees.map((assigneeId) => {
              const member = workspaceMembers?.find(m => m.userId === assigneeId)
              return member ? (
                <div
                  key={assigneeId}
                  className="flex items-center gap-6px px-[8px] py-6px bg-primary-brutalist/20 border border-primary-brutalist"
                >
                  <HiOutlineUser className="w-14px h-14px" />
                  <span className="font-mono text-brutal-xs font-bold">
                    {member.user?.name || 'Unknown'}
                  </span>
                  <button
                    onClick={() => handleSelectReviewer(assigneeId)}
                    className="text-brutal-error hover:bg-brutal-error hover:text-event-horizon rounded-full w-14px h-14px flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ) : null
            })
          )}
        </div>
      </div>

      {/* Technology Detection */}
      <div className="brutal-card p-[10px] bg-[var(--theme-background-secondary)]">
        <h4 className="font-mono text-brutal-sm font-bold mb-[4px] flex items-center gap-[4px]">
          <HiOutlineCode className="w-16px h-16px" />
          DETECTED TECHNOLOGIES
        </h4>
        
        <div className="flex flex-wrap gap-6px mb-[6px]">
          {extractedTechnologies.length === 0 && manualTechnologies.length === 0 ? (
            <span className="font-mono text-brutal-xs text-primary-brutalist/60">
              No technologies detected. Add some manually for better suggestions.
            </span>
          ) : (
            <>
              {extractedTechnologies.map((tech) => (
                <span
                  key={tech}
                  className="px-[4px] py-4px font-mono text-brutal-xs bg-primary-brutalist/20 border border-primary-brutalist text-primary-brutalist font-bold"
                >
                  {tech} <span className="text-brutal-xs opacity-60">(auto)</span>
                </span>
              ))}
              {manualTechnologies.map((tech) => (
                <span
                  key={tech}
                  className="flex items-center gap-4px px-[4px] py-4px font-mono text-brutal-xs bg-brutal-info/20 border border-brutal-info text-brutal-info font-bold"
                >
                  {tech}
                  <button
                    onClick={() => handleRemoveTechnology(tech)}
                    className="hover:bg-brutal-error hover:text-event-horizon rounded-full w-14px h-14px flex items-center justify-center"
                  >
                    ×
                  </button>
                </span>
              ))}
            </>
          )}
        </div>

        <div className="flex gap-[4px]">
          <input
            type="text"
            value={newTech}
            onChange={(e) => setNewTech(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTechnology()
              }
            }}
            className="brutal-input flex-1 text-sm"
            placeholder="Add technology (e.g., React, Python, DevOps)"
            aria-label="Add technology"
          />
          <button
            onClick={handleAddTechnology}
            className="brutal-btn-secondary px-[10px]"
          >
            ADD
          </button>
        </div>
      </div>

      {/* Assignment Suggestions */}
      {allTechnologies.length > 0 && (
        <ReviewerSuggestions
          technologies={allTechnologies}
          workspaceId={workspaceId}
          excludeUserId={undefined}
          maxSuggestions={5}
          onSelectReviewer={handleSelectReviewer}
          mode="detailed"
        />
      )}

      {/* Find Expert Button */}
      <div className="flex justify-center pt-8px">
        <button
          onClick={() => setShowExpertiseSearch(true)}
          className="brutal-btn-secondary flex items-center gap-[4px]"
        >
          <HiOutlineSearch className="w-16px h-16px" />
          SEARCH FOR SPECIFIC EXPERTISE
        </button>
      </div>

      {/* Expertise Search Modal */}
      {showExpertiseSearch && (
        <ExpertiseSearchModal
          onClose={() => setShowExpertiseSearch(false)}
          workspaceId={workspaceId}
        />
      )}
    </div>
  )
}