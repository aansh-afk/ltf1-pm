import { forwardRef, useState, useRef, useEffect, useCallback, useId } from 'react'
import clsx from 'clsx'

interface BrutalSelectOption {
  value: string
  label: string
}

interface BrutalSelectProps {
  value?: string
  onChange?: (value: string) => void
  options: BrutalSelectOption[]
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  id?: string
  compact?: boolean
}

const BrutalSelect = forwardRef<HTMLDivElement, BrutalSelectProps>(
  (
    {
      value,
      onChange,
      options,
      label,
      error,
      helperText,
      fullWidth = false,
      disabled = false,
      placeholder = 'Select…',
      className,
      id,
      compact = false,
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false)
    const [focusIdx, setFocusIdx] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    const autoId = useId()
    const selectId = id || autoId
    const listboxId = `${selectId}-listbox`

    const selected = options.find((o) => o.value === value)

    // Close on outside click
    useEffect(() => {
      if (!open) return
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [open])

    // Scroll focused option into view
    useEffect(() => {
      if (open && focusIdx >= 0 && listRef.current) {
        const el = listRef.current.children[focusIdx] as HTMLElement | undefined
        el?.scrollIntoView({ block: 'nearest' })
      }
    }, [focusIdx, open])

    const selectOption = useCallback(
      (opt: BrutalSelectOption) => {
        onChange?.(opt.value)
        setOpen(false)
      },
      [onChange],
    )

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return

        switch (e.key) {
          case 'Enter':
          case ' ':
            e.preventDefault()
            if (!open) {
              setOpen(true)
              setFocusIdx(options.findIndex((o) => o.value === value))
            } else if (focusIdx >= 0 && focusIdx < options.length) {
              selectOption(options[focusIdx])
            }
            break
          case 'ArrowDown':
            e.preventDefault()
            if (!open) {
              setOpen(true)
              setFocusIdx(options.findIndex((o) => o.value === value))
            } else {
              setFocusIdx((i) => Math.min(i + 1, options.length - 1))
            }
            break
          case 'ArrowUp':
            e.preventDefault()
            if (open) {
              setFocusIdx((i) => Math.max(i - 1, 0))
            }
            break
          case 'Escape':
            e.preventDefault()
            setOpen(false)
            break
          case 'Home':
            if (open) {
              e.preventDefault()
              setFocusIdx(0)
            }
            break
          case 'End':
            if (open) {
              e.preventDefault()
              setFocusIdx(options.length - 1)
            }
            break
        }
      },
      [disabled, open, focusIdx, options, value, selectOption],
    )

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }}
        className={clsx('relative', fullWidth && 'w-full', compact ? 'inline-block' : 'space-y-[8px]')}
      >
        {label && !compact && (
          <label
            htmlFor={selectId}
            className="block text-brutal-sm text-[var(--theme-foreground)]"
          >
            {label}
          </label>
        )}

        {/* Trigger */}
        <button
          type="button"
          id={selectId}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-label={label || placeholder}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setOpen((v) => !v)
              if (!open) setFocusIdx(options.findIndex((o) => o.value === value))
            }
          }}
          onKeyDown={handleKeyDown}
          className={clsx(
            'flex items-center justify-between gap-2 text-left',
            'bg-[var(--theme-background)] text-[var(--theme-foreground)] border-2',
            'transition-all duration-250 ease-in-out cursor-pointer',
            'outline-none',
            compact
              ? 'px-2 py-1 text-xs'
              : 'px-[10px] py-[8px]',
            error
              ? 'border-[var(--theme-error)] focus:border-[var(--theme-error)] focus:shadow-[3px_3px_0px_var(--theme-error)]'
              : open
                ? 'border-[var(--theme-primary)] shadow-[var(--theme-box-shadow)]'
                : 'border-[var(--theme-border)] hover:border-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:shadow-[var(--theme-box-shadow)]',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && !open && 'hover:-translate-y-[2px]',
            fullWidth && 'w-full',
            className,
          )}
        >
          <span
            className={clsx(
              'truncate font-mono',
              compact ? 'text-xs' : 'text-sm',
              !selected && 'text-[var(--theme-foreground)]/50',
            )}
          >
            {selected ? selected.label : placeholder}
          </span>

          <svg
            className={clsx(
              'w-4 h-4 shrink-0 text-[var(--theme-foreground)]/60 transition-transform duration-200',
              open && 'rotate-180',
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={label || placeholder}
            className={clsx(
              'absolute z-50 mt-1 w-full max-h-60 overflow-auto',
              'bg-[var(--theme-background)] border-2 border-[var(--theme-border)]',
              'shadow-[4px_4px_0px_rgba(0,0,0,0.3)]',
              'py-1',
            )}
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value
              const isFocused = i === focusIdx
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setFocusIdx(i)}
                  onClick={() => selectOption(opt)}
                  className={clsx(
                    'px-3 py-2 font-mono cursor-pointer transition-colors duration-150',
                    compact ? 'text-xs' : 'text-sm',
                    isFocused
                      ? 'bg-[var(--theme-primary)]/15 text-[var(--theme-primary)]'
                      : 'text-[var(--theme-foreground)]',
                    isSelected && 'font-bold',
                    'hover:bg-[var(--theme-primary)]/15 hover:text-[var(--theme-primary)]',
                  )}
                >
                  <span className="flex items-center justify-between">
                    {opt.label}
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-[var(--theme-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        {/* Error / helper */}
        {!compact && (error || helperText) && (
          <p
            className={clsx(
              'text-brutal-xs',
              error ? 'text-[var(--theme-error)]' : 'text-[var(--theme-foreground)]/70',
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  },
)

BrutalSelect.displayName = 'BrutalSelect'

export default BrutalSelect
