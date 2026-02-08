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
      <div className={clsx('space-y-[8px]', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={selectId} className="block text-brutal-sm text-[var(--theme-foreground)]">
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              'bg-[var(--theme-background)] text-[var(--theme-foreground)] border-2 px-[10px] py-8px pr-40px',
              'transition-all duration-200 ease-brutal-out appearance-none',
              'cursor-pointer',
              error
                ? 'border-[var(--theme-error)] focus:border-[var(--theme-error)] focus:shadow-[3px_3px_0px_var(--theme-error)]'
                : 'border-[var(--theme-border)] focus:border-[var(--theme-border-focus)] focus:shadow-[var(--theme-box-shadow)]',
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
          <div className="absolute right-[10px] top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-[var(--theme-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {(error || helperText) && (
          <p className={clsx(
            'text-brutal-xs',
            error ? 'text-[var(--theme-error)]' : 'text-[var(--theme-foreground)]/70'
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