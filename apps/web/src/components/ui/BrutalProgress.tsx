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
    default: 'bg-[var(--theme-info)]',
    glitch: 'bg-[var(--theme-gradient)]'
  }

  return (
    <div className="relative">
      {showLabel && (
        <div className="flex justify-between mb-8px">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground)]">
            PROGRESS
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground)]">
            {Math.floor(percentage)}%
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={props['aria-label'] || 'Progress'}
        className={clsx(
          'relative h-24px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] overflow-hidden',
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
          {['n1','n2','n3','n4','n5','n6','n7','n8','n9'].map((id) => (
            <div
              key={id}
              className="flex-1 border-r-2 border-[var(--theme-border)] opacity-50"
              style={{ borderRadius: '0 !important' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}