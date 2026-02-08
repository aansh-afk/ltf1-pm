import { useState, useRef, useEffect } from 'react'
import { HiOutlineX, HiOutlineChevronDown, HiOutlineCheck } from 'react-icons/hi'
import clsx from 'clsx'

interface Option {
  value: string
  label: string
  avatar?: string
  avatarUrl?: string
}

interface MultiSelectProps {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function MultiSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "SELECT OPTIONS", 
  disabled = false,
  className 
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedOptions = options.filter(option => value.includes(option.value))

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter(v => v !== optionValue))
  }

  return (
    <div ref={dropdownRef} className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={clsx(
          "w-full px-[10px] py-[8px] bg-carbon-plate border-2 border-basalt-border",
          "font-mono text-brutal-md uppercase",
          "flex items-center justify-between gap-[8px]",
          "focus:border-primary-brutalist focus:outline-none transition-colors",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        disabled={disabled}
      >
        <div className="flex items-center gap-[8px] flex-wrap">
          {selectedOptions.length === 0 ? (
            <span className="text-neutral-600">{placeholder}</span>
          ) : (
            selectedOptions.map(option => (
              <span 
                key={option.value}
                className="inline-flex items-center gap-4px px-8px py-2px bg-primary-brutalist text-event-horizon text-brutal-xs"
              >
                {option.label}
                <button
                  onClick={(e) => removeOption(option.value, e)}
                  className="hover:bg-event-horizon/20 rounded"
                >
                  <HiOutlineX className="w-[12px] h-[12px]" />
                </button>
              </span>
            ))
          )}
        </div>
        <HiOutlineChevronDown className={clsx(
          "w-4 h-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-[8px] w-full bg-carbon-plate border-2 border-basalt-border shadow-brutal-md">
          <div className="p-[8px] border-b-2 border-basalt-border">
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-[10px] py-8px bg-event-horizon/10 border-2 border-basalt-border 
                       font-mono text-brutal-sm uppercase placeholder:text-neutral-600
                       focus:border-primary-brutalist focus:outline-none"
            />
          </div>
          
          <div className="max-h-200px overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-[10px] py-[8px] text-neutral-500 text-brutal-sm">
                NO OPTIONS FOUND
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = value.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className={clsx(
                      "w-full px-[10px] py-[8px] text-left",
                      "flex items-center justify-between gap-[8px]",
                      "font-mono text-brutal-sm uppercase",
                      "hover:bg-primary-brutalist hover:text-event-horizon transition-colors",
                      isSelected && "bg-event-horizon/10"
                    )}
                  >
                    <div className="flex items-center gap-[8px]">
                      {(option.avatarUrl || option.avatar) ? (
                        <img 
                          src={option.avatarUrl || option.avatar} 
                          alt={option.label}
                          className="w-4 h-4 border-2 border-basalt-border"
                        />
                      ) : (
                        <div className="w-4 h-4 bg-primary-brutalist border-2 border-basalt-border flex items-center justify-center">
                          <span className="text-event-horizon text-brutal-xs">
                            {option.label.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span>{option.label}</span>
                    </div>
                    {isSelected && <HiOutlineCheck className="w-4 h-4 text-primary-brutalist" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}