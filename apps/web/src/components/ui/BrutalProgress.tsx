import { HTMLAttributes } from 'react'
import clsx from 'clsx'

interface BrutalProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  showLabel?: boolean
  variant?: 'default' | 'glitch'
}

export default function BrutalProgress({ 
  value, 
  max = 100,
  showLabel = false,
  variant = 'default',
  className,
  ...props
}: BrutalProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const barClasses = {
    default: 'bg-brutal-info',
    glitch: 'bg-glitch-flare'
  }

  return (
    <div className="relative">
      {showLabel && (
        <div className="flex justify-between mb-8px">
          <span className="text-xs font-bold uppercase tracking-wider text-cathode-white">
            PROGRESS
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-cathode-white">
            {Math.floor(percentage)}%
          </span>
        </div>
      )}
      <div
        className={clsx(
          'relative h-24px bg-carbon-plate border-2 border-basalt-border overflow-hidden',
          className
        )}
        style={{ borderRadius: '0 !important' }}
        {...props}
      >
        <div
          className={clsx(
            'h-full transition-all duration-200 ease-brutal',
            barClasses[variant]
          )}
          style={{ 
            width: `${percentage}%`,
            borderRadius: '0 !important'
          }}
        />
        {/* Progress notches every 10% */}
        <div className="absolute inset-0 flex">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r-2 border-basalt-border opacity-50"
              style={{ borderRadius: '0 !important' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}