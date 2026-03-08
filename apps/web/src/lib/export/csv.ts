import type { Id } from '../../../../convex/_generated/dataModel'

interface Task {
  _id: Id<"tasks">
  number: number
  title: string
  description?: string
  status: string
  priority: string
  type: string
  projectId: Id<"projects">
  sprintId?: Id<"sprints">
  assigneeIds?: Id<"users">[]
  reporterId: Id<"users">
  labels?: string[]
  storyPoints?: number
  timeEstimate?: number
  timeSpent?: number
  dueDate?: number
  startDate?: number
  completedAt?: number
  createdAt: number
  updatedAt: number
  position: number
  parentTaskId?: Id<"tasks">
  subtaskIds?: Id<"tasks">[]
  dependsOn?: Id<"tasks">[]
  blocks?: Id<"tasks">[]
  customFields?: Record<string, string | number | boolean | string[]>
}

interface Sprint {
  _id: Id<"sprints">
  name: string
  projectId: Id<"projects">
  startDate: number
  endDate: number
  status: 'planned' | 'active' | 'completed'
  velocity?: number
  goals?: string[]
  createdAt: number
  updatedAt: number
}

interface Project {
  _id: Id<"projects">
  name: string
  key: string
  description?: string
  workspaceId: Id<"workspaces">
  leadId?: Id<"users">
  status: 'active' | 'completed' | 'archived'
  startDate?: number
  endDate?: number
  createdAt: number
  updatedAt: number
}

interface TimeEntry {
  _id: Id<"timeEntries">
  taskId: Id<"tasks">
  userId: Id<"users">
  startTime: number
  endTime?: number
  duration?: number
  description?: string
  billable?: boolean
  approved?: boolean
  createdAt: number
}

interface User {
  _id: Id<"users">
  clerkUserId: string
  email: string
  name?: string
  avatar?: string
  role?: string
  skills?: string[]
  department?: string
  timezone?: string
}

export class CSVExporter {
  /**
   * Escape CSV value
   */
  private escapeCSV(value: unknown): string {
    if (value === null || value === undefined) {
      return ''
    }
    
    const stringValue = String(value)
    
    // Check if value needs quoting
    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
    ) {
      // Escape quotes by doubling them
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    
    return stringValue
  }

  /**
   * Convert array of objects to CSV string
   */
  private arrayToCSV(data: Array<Record<string, unknown>>, headers?: string[]): string {
    if (data.length === 0) {
      return ''
    }
    
    // Get headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0])
    
    // Create header row
    const headerRow = csvHeaders.map(h => this.escapeCSV(h)).join(',')
    
    // Create data rows
    const dataRows = data.map(row => {
      return csvHeaders.map(header => {
        return this.escapeCSV(row[header])
      }).join(',')
    })
    
    // Combine header and data rows
    return [headerRow, ...dataRows].join('\n')
  }

  /**
   * Export tasks to CSV
   */
  exportTasks(
    tasks: Task[],
    users: User[],
    projects: Project[],
    sprints: Sprint[]
  ): string {
    const data = tasks.map(task => {
      const project = projects.find(p => p._id === task.projectId)
      const sprint = task.sprintId ? sprints.find(s => s._id === task.sprintId) : null
      const assignees = task.assigneeIds?.map(id => 
        users.find(u => u._id === id)?.name || id
      ).join('; ')
      const reporter = users.find(u => u._id === task.reporterId)?.name || task.reporterId
      
      return {
        'ID': task._id,
        'Number': task.number,
        'Title': task.title,
        'Description': task.description || '',
        'Status': task.status,
        'Priority': task.priority,
        'Type': task.type,
        'Project': project?.name || task.projectId,
        'Sprint': sprint?.name || '',
        'Assignees': assignees || '',
        'Reporter': reporter,
        'Story Points': task.storyPoints || '',
        'Time Estimate (hrs)': task.timeEstimate || '',
        'Time Spent (hrs)': task.timeSpent || '',
        'Due Date': task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        'Start Date': task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
        'Completed Date': task.completedAt ? new Date(task.completedAt).toISOString().split('T')[0] : '',
        'Created Date': new Date(task.createdAt).toISOString().split('T')[0],
        'Updated Date': new Date(task.updatedAt).toISOString().split('T')[0],
        'Labels': task.labels?.join('; ') || '',
        'Dependencies': task.dependsOn?.join('; ') || '',
        'Blocks': task.blocks?.join('; ') || '',
        'Parent Task': task.parentTaskId || '',
        'Subtasks': task.subtaskIds?.join('; ') || ''
      }
    })
    
    return this.arrayToCSV(data)
  }

  /**
   * Export time tracking to CSV
   */
  exportTimeTracking(
    timeEntries: TimeEntry[],
    tasks: Task[],
    users: User[],
    projects: Project[]
  ): string {
    const data = timeEntries.map(entry => {
      const task = tasks.find(t => t._id === entry.taskId)
      const user = users.find(u => u._id === entry.userId)
      const project = task ? projects.find(p => p._id === task.projectId) : null
      const startDate = new Date(entry.startTime)
      const duration = entry.duration || 
        (entry.endTime ? (entry.endTime - entry.startTime) / 3600000 : 0)
      
      return {
        'Entry ID': entry._id,
        'Date': startDate.toISOString().split('T')[0],
        'User': user?.name || entry.userId,
        'Task': task?.title || entry.taskId,
        'Project': project?.name || '',
        'Start Time': startDate.toTimeString().split(' ')[0],
        'End Time': entry.endTime ? new Date(entry.endTime).toTimeString().split(' ')[0] : '',
        'Duration (hrs)': duration.toFixed(2),
        'Description': entry.description || '',
        'Billable': entry.billable ? 'Yes' : 'No',
        'Approved': entry.approved ? 'Yes' : 'No',
        'Week': `W${this.getWeekNumber(startDate)}`,
        'Month': startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }
    })
    
    return this.arrayToCSV(data)
  }

  /**
   * Export sprints to CSV
   */
  exportSprints(
    sprints: Sprint[],
    projects: Project[],
    tasks: Task[]
  ): string {
    const data = sprints.map(sprint => {
      const project = projects.find(p => p._id === sprint.projectId)
      const sprintTasks = tasks.filter(t => t.sprintId === sprint._id)
      const completedTasks = sprintTasks.filter(t => t.status === 'done')
      const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
      const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
      const completion = sprintTasks.length > 0 
        ? (completedTasks.length / sprintTasks.length) * 100 
        : 0
      
      return {
        'Sprint ID': sprint._id,
        'Sprint Name': sprint.name,
        'Project': project?.name || sprint.projectId,
        'Status': sprint.status,
        'Start Date': new Date(sprint.startDate).toISOString().split('T')[0],
        'End Date': new Date(sprint.endDate).toISOString().split('T')[0],
        'Total Tasks': sprintTasks.length,
        'Completed Tasks': completedTasks.length,
        'Total Story Points': totalPoints,
        'Completed Story Points': completedPoints,
        'Velocity': sprint.velocity || '',
        'Completion %': completion.toFixed(1),
        'Goals': sprint.goals?.join('; ') || '',
        'Created Date': new Date(sprint.createdAt).toISOString().split('T')[0],
        'Updated Date': new Date(sprint.updatedAt).toISOString().split('T')[0]
      }
    })
    
    return this.arrayToCSV(data)
  }

  /**
   * Export projects to CSV
   */
  exportProjects(
    projects: Project[],
    tasks: Task[],
    users: User[]
  ): string {
    const data = projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project._id)
      const completedTasks = projectTasks.filter(t => t.status === 'done')
      const lead = project.leadId ? users.find(u => u._id === project.leadId) : null
      const completion = projectTasks.length > 0 
        ? (completedTasks.length / projectTasks.length) * 100 
        : 0
      
      // Calculate unique contributors
      const contributors = new Set<Id<"users">>()
      projectTasks.forEach(task => {
        contributors.add(task.reporterId)
        task.assigneeIds?.forEach(id => contributors.add(id))
      })
      
      return {
        'Project ID': project._id,
        'Project Key': project.key,
        'Project Name': project.name,
        'Description': project.description || '',
        'Status': project.status,
        'Lead': lead?.name || '',
        'Start Date': project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        'End Date': project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
        'Total Tasks': projectTasks.length,
        'Completed Tasks': completedTasks.length,
        'Completion %': completion.toFixed(1),
        'Contributors': contributors.size,
        'Created Date': new Date(project.createdAt).toISOString().split('T')[0],
        'Updated Date': new Date(project.updatedAt).toISOString().split('T')[0]
      }
    })
    
    return this.arrayToCSV(data)
  }

  /**
   * Export team members to CSV
   */
  exportTeamMembers(
    users: User[],
    tasks: Task[],
    timeEntries: TimeEntry[]
  ): string {
    const data = users.map(user => {
      const assignedTasks = tasks.filter(t => 
        t.assigneeIds?.includes(user._id)
      )
      const completedTasks = assignedTasks.filter(t => t.status === 'done')
      const userTimeEntries = timeEntries.filter(e => e.userId === user._id)
      const totalHours = userTimeEntries.reduce((sum, e) => 
        sum + (e.duration || 0), 0
      )
      
      return {
        'User ID': user._id,
        'Name': user.name || '',
        'Email': user.email,
        'Role': user.role || '',
        'Department': user.department || '',
        'Skills': user.skills?.join('; ') || '',
        'Timezone': user.timezone || '',
        'Assigned Tasks': assignedTasks.length,
        'Completed Tasks': completedTasks.length,
        'Total Hours Logged': totalHours.toFixed(2),
        'Avg Hours per Task': assignedTasks.length > 0 
          ? (totalHours / assignedTasks.length).toFixed(2) 
          : '0'
      }
    })
    
    return this.arrayToCSV(data)
  }

  /**
   * Export custom report with selected columns
   */
  exportCustomReport(
    data: Array<Record<string, unknown>>,
    columns: Array<{ key: string; label: string }>
  ): string {
    const headers = columns.map(c => c.label)
    const mappedData = data.map(row => {
      const mappedRow: Record<string, unknown> = {}
      columns.forEach(col => {
        mappedRow[col.label] = row[col.key]
      })
      return mappedRow
    })
    
    return this.arrayToCSV(mappedData, headers)
  }

  /**
   * Get week number of year
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  /**
   * Download CSV file
   */
  downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }
}

// Export convenience functions
export function exportTasksToCSV(
  tasks: Task[],
  users: User[],
  projects: Project[],
  sprints: Sprint[]
): string {
  const exporter = new CSVExporter()
  return exporter.exportTasks(tasks, users, projects, sprints)
}

export function exportTimeTrackingToCSV(
  timeEntries: TimeEntry[],
  tasks: Task[],
  users: User[],
  projects: Project[]
): string {
  const exporter = new CSVExporter()
  return exporter.exportTimeTracking(timeEntries, tasks, users, projects)
}

export function exportSprintsToCSV(
  sprints: Sprint[],
  projects: Project[],
  tasks: Task[]
): string {
  const exporter = new CSVExporter()
  return exporter.exportSprints(sprints, projects, tasks)
}

export function exportProjectsToCSV(
  projects: Project[],
  tasks: Task[],
  users: User[]
): string {
  const exporter = new CSVExporter()
  return exporter.exportProjects(projects, tasks, users)
}

export function exportTeamMembersToCSV(
  users: User[],
  tasks: Task[],
  timeEntries: TimeEntry[]
): string {
  const exporter = new CSVExporter()
  return exporter.exportTeamMembers(users, tasks, timeEntries)
}

export function downloadCSV(csvContent: string, filename: string): void {
  const exporter = new CSVExporter()
  exporter.downloadCSV(csvContent, filename)
}