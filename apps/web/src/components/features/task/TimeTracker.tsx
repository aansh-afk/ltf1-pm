import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineStop,
  HiOutlineClock,
  HiOutlineCheckCircle
} from 'react-icons/hi'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface TimeTrackerProps {
  taskId: string
  isRunning?: boolean
  currentDuration?: number
  onStart?: () => void
  onPause?: () => void
  onStop?: () => void
}

interface TimeEntry {
  startTime: number
  endTime?: number
  duration: number
}

export default function TimeTracker({
  taskId,
  isRunning = false,
  currentDuration = 0,
  onStart,
  onPause,
  onStop
}: TimeTrackerProps) {
  const [localIsRunning, setLocalIsRunning] = useState(isRunning)
  const [elapsedTime, setElapsedTime] = useState(currentDuration)
  const [startTime, setStartTime] = useState<number | null>(null)

  // Mutations
  const startTimeTracking = useMutation(api.tasks.mutations.startTimeTracking)
  const pauseTimeTracking = useMutation(api.tasks.mutations.pauseTimeTracking)
  const stopTimeTracking = useMutation(api.tasks.mutations.stopTimeTracking)

  // Timer effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (localIsRunning && startTime) {
      intervalId = setInterval(() => {
        const now = Date.now()
        const sessionDuration = now - startTime
        setElapsedTime(currentDuration + sessionDuration)
      }, 1000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [localIsRunning, startTime, currentDuration])

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleStart = async () => {
    try {
      await startTimeTracking({ taskId: taskId as any })
      setLocalIsRunning(true)
      setStartTime(Date.now())
      onStart?.()
      toast.success('Timer started')
    } catch (error: any) {
      toast.error(error.message || 'Failed to start timer')
    }
  }

  const handlePause = async () => {
    try {
      await pauseTimeTracking({ 
        taskId: taskId as any,
        duration: elapsedTime
      })
      setLocalIsRunning(false)
      setStartTime(null)
      onPause?.()
      toast.success('Timer paused')
    } catch (error: any) {
      toast.error(error.message || 'Failed to pause timer')
    }
  }

  const handleStop = async () => {
    try {
      await stopTimeTracking({ 
        taskId: taskId as any,
        duration: elapsedTime
      })
      setLocalIsRunning(false)
      setStartTime(null)
      setElapsedTime(0)
      onStop?.()
      toast.success('Timer stopped and time logged')
    } catch (error: any) {
      toast.error(error.message || 'Failed to stop timer')
    }
  }

  return (
    <div className="flex items-center gap-[6px] p-[10px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
      {/* Time Display */}
      <div className="flex items-center gap-[4px]">
        <HiOutlineClock className="w-16px h-16px text-neutral-400" />
        <span className="font-mono text-[14px] font-semibold font-bold min-w-80px">
          {formatTime(elapsedTime)}
        </span>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-[4px]">
        {!localIsRunning ? (
          <button
            onClick={handleStart}
            className={clsx(
              "p-[4px] border-2 border-[var(--theme-border)] transition-colors",
              "hover:bg-primary-brutalist hover:text-event-horizon",
              "flex items-center justify-center"
            )}
            title="Start Timer"
          >
            <HiOutlinePlay className="w-16px h-16px" />
          </button>
        ) : (
          <button
            onClick={handlePause}
            className={clsx(
              "p-[4px] border-2 border-[var(--theme-border)] transition-colors",
              "bg-warning-brutalist text-event-horizon",
              "hover:bg-warning-brutalist/80",
              "flex items-center justify-center"
            )}
            title="Pause Timer"
          >
            <HiOutlinePause className="w-16px h-16px" />
          </button>
        )}

        {(localIsRunning || elapsedTime > 0) && (
          <button
            onClick={handleStop}
            className={clsx(
              "p-[4px] border-2 border-[var(--theme-border)] transition-colors",
              "hover:bg-danger-brutalist hover:text-[var(--theme-foreground)]",
              "flex items-center justify-center"
            )}
            title="Stop Timer & Log Time"
          >
            <HiOutlineStop className="w-16px h-16px" />
          </button>
        )}
      </div>

      {/* Status Indicator */}
      {localIsRunning && (
        <div className="flex items-center gap-4px text-brutal-xs text-primary-brutalist">
          <div className="w-6px h-6px bg-primary-brutalist rounded-full animate-pulse" />
          TRACKING
        </div>
      )}
    </div>
  )
}