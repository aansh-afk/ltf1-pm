import { ReactNode } from 'react'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import { HiOutlineRefresh } from 'react-icons/hi'

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
    <div className="mb-8">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold uppercase tracking-wide">{title}</h3>
          {description && (
            <p className="text-sm text-[var(--theme-foreground)]/60 max-w-2xl mt-1 font-mono">
              {description}
            </p>
          )}
        </div>
        {onReset && (
          <BrutalButton
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs flex items-center gap-1"
          >
            <HiOutlineRefresh className="w-3 h-3" />
            RESET
          </BrutalButton>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}