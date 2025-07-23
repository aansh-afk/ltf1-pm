import { ReactNode } from 'react'
import { BrutalButton } from '../ui'

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
    <div className="flex flex-col items-center justify-center p-64px text-center">
      {icon && (
        <div className="mb-24px text-cathode-white/30 border-2 border-basalt-border p-24px">
          {icon}
        </div>
      )}
      <h3 className="text-brutal-xl mb-16px uppercase">{title}</h3>
      {description && (
        <p className="text-brutal-sm text-cathode-white/60 mb-32px max-w-md uppercase">{description}</p>
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