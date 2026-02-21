import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'

interface TimeTrackerProps {
  taskId: Id<'tasks'>
}

export default function TimeTracker({ taskId }: TimeTrackerProps) {
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  const startTracking = useMutation(api.tasks.mutations.startTimeTracking)
  const pauseTracking = useMutation(api.tasks.mutations.pauseTimeTracking)
  const stopTracking = useMutation(api.tasks.mutations.stopTimeTracking)

  // Query active time entry to restore state on mount / reconnect
  const activeEntry = useQuery(api.tasks.queries.getActiveTimeEntry, { taskId })

  // Sync local state with backend active entry
  useEffect(() => {
    if (activeEntry) {
      setIsRunning(true)
      const elapsedMs = Date.now() - activeEntry.startTime
      setElapsed(Math.floor(elapsedMs / 1000))
    } else {
      // No active entry -- only reset if we were running
      // (don't reset paused elapsed)
      if (isRunning) {
        setIsRunning(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntry])

  // Live timer -- tick every second while running
  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }, [])

  const handleStart = async () => {
    try {
      await startTracking({ taskId })
      setIsRunning(true)
      // If resuming from paused state keep elapsed; fresh start resets
      if (elapsed === 0) {
        setElapsed(0)
      }
    } catch (error: any) {
      console.error('Failed to start tracking:', error)
    }
  }

  const handlePause = async () => {
    try {
      const durationMs = elapsed * 1000
      await pauseTracking({ taskId, duration: durationMs })
      setIsRunning(false)
    } catch (error: any) {
      console.error('Failed to pause tracking:', error)
    }
  }

  const handleStop = async () => {
    try {
      const durationMs = elapsed * 1000
      await stopTracking({ taskId, duration: durationMs })
      setIsRunning(false)
      setElapsed(0)
    } catch (error: any) {
      console.error('Failed to stop tracking:', error)
    }
  }

  return (
    <div className="border-2 border-[var(--theme-border)] bg-[var(--theme-background)] p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/40">
          TIME TRACKER
        </span>
        {isRunning && (
          <span className="w-2 h-2 bg-[#22C55E] animate-pulse" />
        )}
      </div>

      {/* Timer display */}
      <div className="text-center mb-3">
        <span className="font-mono text-2xl font-bold tracking-wider text-[var(--theme-foreground)]">
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex-1 px-3 py-2 bg-[#6366F1] text-white font-mono text-xs font-bold uppercase border-2 border-[#6366F1] hover:bg-[#4F46E5] transition-colors"
          >
            {elapsed > 0 ? 'RESUME' : 'START'}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex-1 px-3 py-2 bg-[var(--theme-background)] text-[#F59E0B] font-mono text-xs font-bold uppercase border-2 border-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
          >
            PAUSE
          </button>
        )}
        {(isRunning || elapsed > 0) && (
          <button
            onClick={handleStop}
            className="flex-1 px-3 py-2 bg-[var(--theme-background)] text-[#EF4444] font-mono text-xs font-bold uppercase border-2 border-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
          >
            STOP
          </button>
        )}
      </div>
    </div>
  )
}
