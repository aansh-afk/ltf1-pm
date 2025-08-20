import { ReactNode } from 'react'

interface SettingsSectionProps {
  title: string
  description?: string
  children: ReactNode
  onReset?: () => void
}

export default function SettingsSection({
  title,
  description,
  children,
  onReset
}: SettingsSectionProps) {
  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px mb-24px">
      <div className="flex items-start justify-between mb-24px">
        <div className="flex-1">
          <h3 className="text-brutal-lg mb-8px">{title.toUpperCase()}</h3>
          {description && (
            <p className="text-brutal-sm text-neutral-400 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="px-16px py-8px border-2 border-[var(--theme-border)] bg-transparent
                     font-mono text-brutal-sm uppercase tracking-wider
                     hover:bg-basalt-border transition-colors"
          >
            RESET
          </button>
        )}
      </div>
      <div className="space-y-16px">
        {children}
      </div>
    </div>
  )
}