import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineUsers, HiOutlineFolder } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'

interface WorkspaceCardProps {
  workspace: any
  index: number
}

export default function WorkspaceCard({ workspace, index }: WorkspaceCardProps) {
  const roleColors = {
    owner: 'badge-primary',
    admin: 'badge-secondary',
    member: 'badge-accent',
    viewer: 'badge-ghost',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Link 
        to={`/workspace/${workspace._id}/projects`}
        className="card bg-base-200 shadow-xl hover-lift gradient-border block"
      >
        <div className="card-body">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="card-title text-xl mb-2">{workspace.name}</h3>
              {workspace.description && (
                <p className="text-sm text-base-content/70 mb-4">
                  {workspace.description}
                </p>
              )}
            </div>
            <div className={`badge ${roleColors[workspace.role as keyof typeof roleColors]}`}>
              {workspace.role}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-base-content/60">
            <div className="flex items-center gap-1">
              <HiOutlineUsers className="w-4 h-4" />
              <span>{workspace.memberCount} members</span>
            </div>
            <div className="flex items-center gap-1">
              <HiOutlineFolder className="w-4 h-4" />
              <span>{workspace.projectCount || 0} projects</span>
            </div>
          </div>

          <div className="mt-4 text-xs text-base-content/50">
            Created {formatDistanceToNow(new Date(workspace.createdAt))} ago
          </div>
        </div>
      </Link>
    </motion.div>
  )
}