import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../lib/convex'
import { HiOutlineViewBoards, HiOutlineViewList, HiOutlineFilter } from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import TaskBoard from '@/components/features/task/TaskBoard'

export default function TasksPage() {
  const { workspaceId } = useParams()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  
  const projects = useQuery(
    api.projects.queries.getWorkspaceProjects,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
  )

  const tasks = useQuery(
    api.tasks.queries.getProjectTasks,
    selectedProjectId ? { projectId: selectedProjectId as any } : 'skip'
  )

  if (!workspaceId) {
    return (
      <div className="p-6">
        <EmptyState
          title="No workspace selected"
          description="Please select a workspace to view tasks"
        />
      </div>
    )
  }

  if (projects === undefined) {
    return <LoadingSpinner size="lg" />
  }

  if (projects.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No projects yet"
          description="Create a project first to start managing tasks"
        />
      </div>
    )
  }

  if (!selectedProjectId && projects.length > 0) {
    setSelectedProjectId(projects[0]._id)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tasks</h1>
          <div className="flex items-center gap-4">
            <select
              className="select select-bordered select-sm"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((project: any) => (
                <option key={project._id} value={project._id}>
                  {project.name} ({project.key})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="btn-group">
            <button
              className={`btn btn-sm ${viewMode === 'board' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('board')}
            >
              <HiOutlineViewBoards className="w-4 h-4" />
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('list')}
              disabled
            >
              <HiOutlineViewList className="w-4 h-4" />
            </button>
          </div>
          <button className="btn btn-sm btn-ghost">
            <HiOutlineFilter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
      </div>

      {tasks === undefined ? (
        <LoadingSpinner size="lg" />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Create your first task to get started"
        />
      ) : (
        <TaskBoard
          tasks={tasks}
          projectId={selectedProjectId}
          onTaskUpdate={() => {}}
        />
      )}
    </div>
  )
}