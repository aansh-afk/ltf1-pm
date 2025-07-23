import { SelectHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface BrutalSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  options: Array<{ value: string; label: string }>
}

const BrutalSelect = forwardRef<HTMLSelectElement, BrutalSelectProps>(
  ({ 
    label,
    error,
    helperText,
    fullWidth = false,
    options,
    className,
    id,
    ...props 
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={clsx('space-y-8px', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={selectId} className="block text-brutal-sm text-cathode-white">
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              'bg-event-horizon text-cathode-white border-2 px-16px py-8px pr-40px',
              'transition-all duration-200 ease-brutal-out appearance-none',
              'cursor-pointer',
              error
                ? 'border-[#FF0000] focus:border-[#FF0000] focus:shadow-[3px_3px_0px_#FF0000]'
                : 'border-basalt-border focus:border-[#00FFFF] focus:shadow-brutal',
              'outline-none',
              fullWidth && 'w-full',
              className
            )}
            {...props}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* BRUTAL DROPDOWN ARROW */}
          <div className="absolute right-16px top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-16px h-16px text-cathode-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {(error || helperText) && (
          <p className={clsx(
            'text-brutal-xs',
            error ? 'text-[#FF0000]' : 'text-cathode-white/70'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

BrutalSelect.displayName = 'BrutalSelect'

export default BrutalSelect