import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineClipboardList, HiOutlineUser, HiOutlineClock } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'

interface ProjectCardProps {
  project: any
  workspaceId: string
  index: number
}

export default function ProjectCard({ project, workspaceId, index }: ProjectCardProps) {
  const statusColors = {
    planning: 'badge-info',
    active: 'badge-success',
    on_hold: 'badge-warning',
    completed: 'badge-accent',
    archived: 'badge-ghost',
  }

  const completionPercentage = project.taskStats.total > 0
    ? Math.round((project.taskStats.completed / project.taskStats.total) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Link 
        to={`/workspace/${workspaceId}/project/${project._id}`}
        className="card bg-base-200 shadow-xl hover-lift block"
      >
        <div className="card-body">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: project.metadata?.color + '20', color: project.metadata?.color }}
              >
                {project.metadata?.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <p className="text-sm text-base-content/60">{project.key}</p>
              </div>
            </div>
            <div className={`badge ${statusColors[project.status as keyof typeof statusColors]}`}>
              {project.status}
            </div>
          </div>

          {project.description && (
            <p className="text-sm text-base-content/70 mb-4 line-clamp-2">
              {project.description}
            </p>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-base-content/60">Progress</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-base-300 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-base-content/60">
            <div className="flex items-center gap-1">
              <HiOutlineClipboardList className="w-4 h-4" />
              <span>{project.taskStats.total} tasks</span>
            </div>
            {project.lead && (
              <div className="flex items-center gap-1">
                <HiOutlineUser className="w-4 h-4" />
                <span>{project.lead.name}</span>
              </div>
            )}
          </div>

          <div className="mt-4 text-xs text-base-content/50">
            Updated {formatDistanceToNow(new Date(project.updatedAt))} ago
          </div>
        </div>
      </Link>
    </motion.div>
  )
}