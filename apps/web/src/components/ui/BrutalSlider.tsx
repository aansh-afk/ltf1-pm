import clsx from 'clsx'

interface BrutalSliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  label?: string
  unit?: string
  disabled?: boolean
  showValue?: boolean
  id?: string
}

export default function BrutalSlider({
  value,
  onChange,
  min,
  max,
  step = 0.1,
  label,
  unit = '',
  disabled = false,
  showValue = true,
  id
}: BrutalSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100
  const inputId = id || (label ? `slider-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  return (
    <div className="space-y-2">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <label htmlFor={inputId} className="text-sm font-bold uppercase tracking-wider text-[var(--theme-foreground)] font-mono">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-base font-bold font-mono text-[var(--theme-foreground)]">
              {value}{unit}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <input
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => !disabled && onChange(parseFloat(e.target.value))}
          disabled={disabled}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-orientation="horizontal"
          aria-label={label || 'Slider'}
          className={clsx(
            'w-full h-2 appearance-none cursor-pointer',
            'border-2 focus:outline-none',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          style={{
            backgroundColor: 'var(--theme-background-secondary)',
            borderColor: 'var(--theme-border)',
            background: `linear-gradient(to right, var(--theme-primary) 0%, var(--theme-primary) ${percentage}%, var(--theme-background-secondary) ${percentage}%, var(--theme-background-secondary) 100%)`
          }}
        />

        {/* Min/Max labels */}
        <div className="flex justify-between mt-1">
          <span className="text-xs font-mono text-[var(--theme-foreground)]/60">
            {min}{unit}
          </span>
          <span className="text-xs font-mono text-[var(--theme-foreground)]/60">
            {max}{unit}
          </span>
        </div>
      </div>
    </div>
  )
}