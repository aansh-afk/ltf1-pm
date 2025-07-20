import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@ltf1/backend'
import { motion } from 'framer-motion'
import { HiOutlinePlus } from 'react-icons/hi'
import TaskCard from './TaskCard'
import CreateTaskModal from './CreateTaskModal'
import toast from 'react-hot-toast'

interface TaskBoardProps {
  tasks: any[]
  projectId: string
  onTaskUpdate?: () => void
}

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'border-base-300' },
  { id: 'todo', title: 'To Do', color: 'border-info' },
  { id: 'in_progress', title: 'In Progress', color: 'border-warning' },
  { id: 'in_review', title: 'In Review', color: 'border-secondary' },
  { id: 'done', title: 'Done', color: 'border-success' },
]

export default function TaskBoard({ tasks, projectId, onTaskUpdate }: TaskBoardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createStatus, setCreateStatus] = useState<string>('backlog')
  const [draggedTask, setDraggedTask] = useState<any>(null)
  
  const moveTask = useMutation(api.tasks.mutations.moveTask)

  const handleDragStart = (e: React.DragEvent, task: any) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    const columnTasks = tasks.filter(t => t.status === newStatus)
    const newPosition = columnTasks.length

    try {
      await moveTask({
        taskId: draggedTask._id,
        status: newStatus as any,
        position: newPosition,
      })
      
      onTaskUpdate?.()
      toast.success('Task moved successfully')
    } catch (error) {
      toast.error('Failed to move task')
    }
    
    setDraggedTask(null)
  }

  const getTasksByStatus = (status: string) => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.position - b.position)
  }

  const openCreateModal = (status: string) => {
    setCreateStatus(status)
    setShowCreateModal(true)
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`flex flex-col bg-base-200 rounded-lg border-t-4 ${column.color} overflow-hidden`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="p-4 border-b border-base-300">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{column.title}</h3>
                <span className="badge badge-sm">{getTasksByStatus(column.id).length}</span>
              </div>
            </div>

            <div className="flex-1 p-2 space-y-2 min-h-[200px]">
              {getTasksByStatus(column.id).map((task, index) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  className="cursor-move"
                >
                  <TaskCard task={task} />
                </motion.div>
              ))}
              
              <button
                onClick={() => openCreateModal(column.id)}
                className="w-full p-2 border-2 border-dashed border-base-300 rounded-lg text-base-content/50 hover:text-base-content hover:border-base-content/50 transition-colors flex items-center justify-center gap-2"
              >
                <HiOutlinePlus className="w-4 h-4" />
                <span className="text-sm">Add Task</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        defaultStatus={createStatus}
        onSuccess={onTaskUpdate}
      />
    </>
  )
}