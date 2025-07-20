import { ReactNode } from 'react'

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
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {icon && (
        <div className="mb-4 text-base-content/30">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-base-content/60 mb-4 max-w-md">{description}</p>
      )}
      {action && (
        <button 
          onClick={action.onClick}
          className="btn btn-primary btn-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}