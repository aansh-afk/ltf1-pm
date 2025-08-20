import { Link } from 'react-router-dom'
import { HiOutlineUsers, HiOutlineFolder } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import BrutalBadge from '../../ui/BrutalBadge'

interface WorkspaceCardProps {
  workspace: any
  index: number
}

export default function WorkspaceCard({ workspace, index }: WorkspaceCardProps) {
  const roleVariants = {
    owner: 'error' as const,
    admin: 'warning' as const,
    member: 'info' as const,
    viewer: 'default' as const,
  }

  const roleBorders = {
    owner: 'border-brutal-error',
    admin: 'border-brutal-warning',
    member: 'border-brutal-info',
    viewer: 'border-[var(--theme-border)]',
  }

  return (
    <Link 
      to={`/workspace/${workspace._id}`}
      className={clsx(
        'block bg-[var(--theme-background)] border-2 shadow-brutal',
        'hover:shadow-brutal-hover hover:translate-x-[-2px] hover:translate-y-[-2px]',
        'transition-all duration-200 ease-brutal-out',
        'relative overflow-hidden',
        roleBorders[workspace.role as keyof typeof roleBorders]
      )}
      style={{ 
        borderRadius: '0 !important',
        animationDelay: `${index * 100}ms`
      }}
    >
      {/* Role indicator bar */}
      <div 
        className={clsx(
          'absolute top-0 left-0 h-full w-2px',
          workspace.role === 'owner' && 'bg-brutal-error',
          workspace.role === 'admin' && 'bg-brutal-warning',
          workspace.role === 'member' && 'bg-brutal-info',
          workspace.role === 'viewer' && 'bg-basalt-border'
        )}
      />
      
      <div className="p-32px">
        <div className="flex items-start justify-between gap-16px mb-24px">
          <div className="flex-1">
            <h3 className="text-xl font-bold uppercase tracking-wider text-[var(--theme-foreground)] mb-16px">
              {workspace.name}
            </h3>
            {workspace.description && (
              <p className="text-sm font-mono text-[var(--theme-foreground)]/70 line-clamp-2">
                {workspace.description}
              </p>
            )}
          </div>
          <BrutalBadge variant={roleVariants[workspace.role as keyof typeof roleVariants]}>
            {workspace.role}
          </BrutalBadge>
        </div>

        <div className="flex items-center gap-24px text-xs font-mono uppercase tracking-wider text-[var(--theme-foreground)]/60 pb-16px border-b-2 border-[var(--theme-border)]">
          <div className="flex items-center gap-8px">
            <HiOutlineUsers className="w-16px h-16px" />
            <span>{workspace.memberCount} MEMBERS</span>
          </div>
          <div className="flex items-center gap-8px">
            <HiOutlineFolder className="w-16px h-16px" />
            <span>{workspace.projectCount || 0} PROJECTS</span>
          </div>
        </div>

        <div className="mt-16px text-xs font-mono uppercase tracking-wider text-[var(--theme-foreground)]/50">
          CREATED {formatDistanceToNow(new Date(workspace.createdAt)).toUpperCase()} AGO
        </div>

        {/* Active indicator */}
        {workspace.isActive && (
          <div className="absolute top-16px right-16px w-8px h-8px bg-brutal-success animate-brutal-pulse" />
        )}
      </div>
    </Link>
  )
}