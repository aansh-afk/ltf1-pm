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
            <p className="text-brutal-sm max-w-2xl" style={{ color: 'var(--theme-foreground-secondary)' }}>
              {description}
            </p>
          )}
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="px-16px py-8px border-2 font-mono text-brutal-sm uppercase tracking-wider transition-colors hover:translate-x-[-2px] hover:translate-y-[-2px]"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'transparent',
              color: 'var(--theme-foreground)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--theme-background-secondary)';
              e.currentTarget.style.boxShadow = '4px 4px 0 var(--theme-shadow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
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