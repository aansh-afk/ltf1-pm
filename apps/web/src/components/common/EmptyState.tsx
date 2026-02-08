import type { ReactNode } from 'react'
import BrutalButton from '../ui/BrutalButton'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-[32px] text-center">
      {icon && (
        <div className="mb-[12px] text-cathode-white/30 border-2 border-basalt-border p-[12px]">
          {icon}
        </div>
      )}
      <h3 className="text-[14px] font-bold mb-[8px] uppercase">{title}</h3>
      {description && (
        <p className="text-[12px] text-cathode-white/60 mb-[16px] max-w-md uppercase">{description}</p>
      )}
      {action && (
        <BrutalButton 
          onClick={action.onClick}
          variant="glitch"
          size="md"
        >
          {action.label}
        </BrutalButton>
      )}
    </div>
  )
}