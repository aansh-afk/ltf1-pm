import { forwardRef, InputHTMLAttributes } from 'react'
import clsx from 'clsx'
import { HiOutlineCheck, HiOutlineX } from 'react-icons/hi'

interface BrutalCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'danger' | 'success' | 'warning'
  label?: string
  description?: string
  error?: string
  indeterminate?: boolean
}

const BrutalCheckbox = forwardRef<HTMLInputElement, BrutalCheckboxProps>(({
  size = 'md',
  variant = 'default',
  label,
  description,
  error,
  className,
  disabled,
  checked,
  indeterminate,
  onChange,
  ...props
}, ref) => {
  const sizeStyles = {
    sm: { width: '16px', height: '16px' },
    md: { width: '20px', height: '20px' },
    lg: { width: '24px', height: '24px' }
  }

  const iconSizeClasses = {
    sm: 'w-[12px] h-[12px]',
    md: 'w-[14px] h-[14px]',
    lg: 'w-[16px] h-[16px]'
  }

  const variantClasses = {
    default: 'border-basalt-border',
    danger: 'border-brutal-error',
    success: 'border-brutal-success',
    warning: 'border-brutal-warning'
  }

  const checkedVariantClasses = {
    default: 'bg-primary-brutalist border-primary-brutalist',
    danger: 'bg-brutal-error border-brutal-error',
    success: 'bg-brutal-success border-brutal-success',
    warning: 'bg-brutal-warning border-brutal-warning'
  }

  const labelSizeClasses = {
    sm: 'text-brutal-xs',
    md: 'text-brutal-sm',
    lg: 'text-brutal-md'
  }

  return (
    <div className={clsx('flex', className)}>
      <label className={clsx(
        'flex items-start gap-12px',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer'
      )}>
        {/* Hidden native checkbox */}
        <input
          ref={ref}
          type="checkbox"
          className="sr-only"
          disabled={disabled}
          checked={checked}
          onChange={onChange}
          {...props}
        />
        
        {/* Custom checkbox visual */}
        <div className="relative flex-shrink-0">
          <div 
            className={clsx(
              'border-2 transition-all duration-150',
              'flex items-center justify-center',
              checked ? checkedVariantClasses[variant] : `bg-carbon-plate ${variantClasses[variant]}`,
              !disabled && 'hover:border-primary-brutalist',
              checked && 'shadow-brutal-sm',
              'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-brutalist focus-within:ring-offset-2 focus-within:ring-offset-event-horizon'
            )}
            style={sizeStyles[size]}>
            {/* Check mark or indeterminate mark */}
            {checked && !indeterminate && (
              <HiOutlineCheck 
                className={clsx(
                  iconSizeClasses[size],
                  'stroke-[3]'
                )} 
                style={{ color: '#000000' }}
              />
            )}
            {indeterminate && (
              <div 
                style={{
                  width: size === 'sm' ? '8px' : size === 'md' ? '10px' : '12px',
                  height: '2px',
                  backgroundColor: '#000000'
                }}
              />
            )}
          </div>
        </div>

        {/* Label and description */}
        {(label || description) && (
          <div className="flex flex-col gap-4px">
            {label && (
              <span className={clsx(
                'font-mono uppercase',
                labelSizeClasses[size],
                error ? 'text-brutal-error' : 'text-cathode-white'
              )}>
                {label}
              </span>
            )}
            {description && (
              <span className="text-brutal-xs text-cathode-white/60">
                {description}
              </span>
            )}
            {error && (
              <span className="text-brutal-xs text-brutal-error flex items-center gap-4px">
                <HiOutlineX className="w-12px h-12px" />
                {error}
              </span>
            )}
          </div>
        )}
      </label>
    </div>
  )
})

BrutalCheckbox.displayName = 'BrutalCheckbox'

export default BrutalCheckbox