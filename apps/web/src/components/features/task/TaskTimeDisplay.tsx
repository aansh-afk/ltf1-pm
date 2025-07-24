import { HiOutlineClock, HiOutlinePlay } from 'react-icons/hi'
import clsx from 'clsx'

interface TaskTimeDisplayProps {
  timeTracked?: number // milliseconds
  isActive?: boolean
  className?: string
  size?: 'sm' | 'md'
}

export default function TaskTimeDisplay({ 
  timeTracked = 0, 
  isActive = false, 
  className = '',
  size = 'sm'
}: TaskTimeDisplayProps) {
  const formatTime = (milliseconds: number): string => {
    if (milliseconds === 0) return '0m'
    
    const totalMinutes = Math.floor(milliseconds / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const sizeStyles = {
    sm: 'text-brutal-xs',
    md: 'text-brutal-sm'
  }

  if (timeTracked === 0 && !isActive) {
    return null
  }

  return (
    <div className={clsx(
      'flex items-center gap-4px text-neutral-400',
      sizeStyles[size],
      className
    )}>
      {isActive ? (
        <>
          <HiOutlinePlay className="w-12px h-12px text-primary-brutalist animate-pulse" />
          <span className="text-primary-brutalist font-mono">
            TRACKING
          </span>
        </>
      ) : (
        <>
          <HiOutlineClock className="w-12px h-12px" />
          <span className="font-mono">
            {formatTime(timeTracked)}
          </span>
        </>
      )}
    </div>
  )
}