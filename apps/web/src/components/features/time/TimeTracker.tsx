import React, { useState, useEffect, useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalCard from '@/components/ui/BrutalCard'
import { Play, Pause, Square, Clock, Calendar, DollarSign } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

interface TimeTrackerProps {
  taskId: Id<"tasks">
  onClose?: () => void
}

const TimeTracker: React.FC<TimeTrackerProps> = ({ taskId, onClose }) => {
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [description, setDescription] = useState('')
  const [activeEntryId, setActiveEntryId] = useState<Id<"timeEntries"> | null>(null)

  // Get current user from Clerk
  const user = useUser()
  const userId = user?.user?.id

  // Check for active timer
  const activeEntry = useQuery(api.timeEntries.getActiveTimeEntry, 
    userId ? { userId } : 'skip'
  )

  // Get task details
  const task = useQuery(api.tasks.getTask, { taskId })

  // Mutations
  const startTimer = useMutation(api.timeEntries.startTimer)
  const stopTimer = useMutation(api.timeEntries.stopTimer)

  // Initialize state from active entry
  useEffect(() => {
    if (activeEntry && activeEntry.taskId === taskId) {
      setIsRunning(true)
      setStartTime(activeEntry.startTime)
      setActiveEntryId(activeEntry._id)
      setDescription(activeEntry.description || '')
    }
  }, [activeEntry, taskId])

  // Update elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning, startTime])

  // Handle start timer
  const handleStart = useCallback(async () => {
    try {
      const entryId = await startTimer({
        taskId,
        description: description || undefined
      })
      
      setIsRunning(true)
      setStartTime(Date.now())
      setActiveEntryId(entryId)
      setElapsedTime(0)
    } catch (error) {
      console.error('Failed to start timer:', error)
      alert(error instanceof Error ? error.message : 'Failed to start timer')
    }
  }, [taskId, description, startTimer])

  // Handle stop timer
  const handleStop = useCallback(async () => {
    if (!activeEntryId) {
      console.error('No active timer to stop')
      return
    }

    try {
      const result = await stopTimer({
        timeEntryId: activeEntryId,
        description: description || undefined
      })
      
      setIsRunning(false)
      setStartTime(null)
      setActiveEntryId(null)
      setElapsedTime(0)
      setDescription('')
      
      // Show duration
      if (result.duration) {
        const hours = (result.duration / 3600000).toFixed(2)
        alert(`Timer stopped. Duration: ${hours} hours`)
      }
    } catch (error) {
      console.error('Failed to stop timer:', error)
      alert(error instanceof Error ? error.message : 'Failed to stop timer')
    }
  }, [activeEntryId, description, stopTimer])

  // Format elapsed time
  const formatElapsedTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    const displaySeconds = seconds % 60
    const displayMinutes = minutes % 60
    
    return `${hours.toString().padStart(2, '0')}:${displayMinutes
      .toString()
      .padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`
  }

  if (!task) {
    return <div>Loading task...</div>
  }

  return (
    <BrutalCard className="p-6 max-w-md mx-auto">
      <div className="space-y-4">
        {/* Task Info */}
        <div className="border-b border-gray-300 pb-4">
          <h3 className="text-lg font-bold">{task.title}</h3>
          <p className="text-sm text-gray-600">#{task.number}</p>
        </div>

        {/* Timer Display */}
        <div className="text-center py-8">
          <div className="text-5xl font-mono font-bold mb-2">
            {formatElapsedTime(elapsedTime)}
          </div>
          {isRunning && (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Timer Running</span>
            </div>
          )}
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
            className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
            rows={3}
            disabled={isRunning}
          />
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isRunning ? (
            <BrutalButton
              onClick={handleStart}
              variant="primary"
              className="flex-1"
              icon={<Play className="w-4 h-4" />}
            >
              Start Timer
            </BrutalButton>
          ) : (
            <>
              <BrutalButton
                onClick={handleStop}
                variant="danger"
                className="flex-1"
                icon={<Square className="w-4 h-4" />}
              >
                Stop Timer
              </BrutalButton>
            </>
          )}
        </div>

        {/* Task Time Info */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-300">
          <div>
            <div className="text-sm text-gray-600">Estimated</div>
            <div className="font-bold">
              {task.timeEstimate ? `${task.timeEstimate}h` : 'Not set'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Logged</div>
            <div className="font-bold">
              {task.timeSpent ? `${task.timeSpent.toFixed(2)}h` : '0h'}
            </div>
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <BrutalButton
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            Close
          </BrutalButton>
        )}
      </div>
    </BrutalCard>
  )
}

// Timer Widget Component (for embedding in task views)
export const TimerWidget: React.FC<{ taskId: Id<"tasks"> }> = ({ taskId }) => {
  const [showTracker, setShowTracker] = useState(false)
  
  // Get current user
  const user = useUser()
  const userId = user?.user?.id

  // Check for active timer
  const activeEntry = useQuery(api.timeEntries.getActiveTimeEntry,
    userId ? { userId } : 'skip'
  )

  const isActive = activeEntry?.taskId === taskId

  return (
    <>
      <BrutalButton
        onClick={() => setShowTracker(true)}
        variant={isActive ? 'primary' : 'secondary'}
        size="sm"
        icon={<Clock className="w-4 h-4" />}
      >
        {isActive ? 'Timer Active' : 'Track Time'}
      </BrutalButton>

      {showTracker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <TimeTracker
            taskId={taskId}
            onClose={() => setShowTracker(false)}
          />
        </div>
      )}
    </>
  )
}

// Import useUser from Clerk
import { useUser } from '@clerk/clerk-react'

export default TimeTracker