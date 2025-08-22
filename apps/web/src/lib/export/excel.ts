import ExcelJS from 'exceljs'
import type { Id } from '@/convex/_generated/dataModel'

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
  attachments?: Array<{
    name: string
    url: string
    size: number
    type: string
  }>
  comments?: Array<{
    userId: Id<"users">
    text: string
    createdAt: number
  }>
  customFields?: Record<string, any>
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
  repository?: {
    provider: 'github' | 'gitlab' | 'bitbucket'
    url: string
    defaultBranch: string
  }
  settings?: Record<string, any>
  customFields?: Record<string, any>
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

interface Resource {
  userId: Id<"users">
  projectId: Id<"projects">
  allocation: number // percentage
  startDate: number
  endDate: number
  role: string
  skills: string[]
}

export class ExcelExporter {
  private workbook: ExcelJS.Workbook

  constructor() {
    this.workbook = new ExcelJS.Workbook()
    this.workbook.creator = 'LTF1 Project Management'
    this.workbook.lastModifiedBy = 'LTF1'
    this.workbook.created = new Date()
    this.workbook.modified = new Date()
  }

  /**
   * Export task data to Excel
   */
  async exportTasks(
    tasks: Task[],
    users: User[],
    projects: Project[],
    sprints: Sprint[]
  ): Promise<Buffer> {
    const worksheet = this.workbook.addWorksheet('Tasks', {
      properties: { tabColor: { argb: 'FF00FF00' } },
      views: [{ state: 'frozen', ySplit: 1 }]
    })

    // Define columns with brutalist styling
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Number', key: 'number', width: 10 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Project', key: 'project', width: 20 },
      { header: 'Sprint', key: 'sprint', width: 20 },
      { header: 'Assignees', key: 'assignees', width: 30 },
      { header: 'Reporter', key: 'reporter', width: 20 },
      { header: 'Story Points', key: 'storyPoints', width: 12 },
      { header: 'Time Estimate', key: 'timeEstimate', width: 12 },
      { header: 'Time Spent', key: 'timeSpent', width: 12 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Start Date', key: 'startDate', width: 15 },
      { header: 'Completed', key: 'completedAt', width: 15 },
      { header: 'Created', key: 'createdAt', width: 15 },
      { header: 'Updated', key: 'updatedAt', width: 15 },
      { header: 'Labels', key: 'labels', width: 30 },
      { header: 'Dependencies', key: 'dependencies', width: 20 },
      { header: 'Blocks', key: 'blocks', width: 20 }
    ]

    // Apply brutalist header styling
    const headerRow = worksheet.getRow(1)
    headerRow.font = {
      name: 'IBM Plex Mono',
      bold: true,
      size: 12,
      color: { argb: 'FFFFFFFF' }
    }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF000000' }
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' }
    headerRow.height = 25

    // Add data rows
    tasks.forEach((task, index) => {
      const project = projects.find(p => p._id === task.projectId)
      const sprint = task.sprintId ? sprints.find(s => s._id === task.sprintId) : null
      const assignees = task.assigneeIds?.map(id => 
        users.find(u => u._id === id)?.name || id
      ).join(', ')
      const reporter = users.find(u => u._id === task.reporterId)?.name || task.reporterId

      const row = worksheet.addRow({
        id: task._id,
        number: task.number,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        type: task.type,
        project: project?.name || task.projectId,
        sprint: sprint?.name || '',
        assignees: assignees || '',
        reporter: reporter,
        storyPoints: task.storyPoints || 0,
        timeEstimate: task.timeEstimate ? `${task.timeEstimate}h` : '',
        timeSpent: task.timeSpent ? `${task.timeSpent}h` : '',
        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
        startDate: task.startDate ? new Date(task.startDate).toLocaleDateString() : '',
        completedAt: task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '',
        createdAt: new Date(task.createdAt).toLocaleDateString(),
        updatedAt: new Date(task.updatedAt).toLocaleDateString(),
        labels: task.labels?.join(', ') || '',
        dependencies: task.dependsOn?.join(', ') || '',
        blocks: task.blocks?.join(', ') || ''
      })

      // Apply brutalist row styling with alternating colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }
        }
      }

      // Apply status-based coloring
      const statusCell = row.getCell('status')
      switch (task.status) {
        case 'done':
          statusCell.font = { color: { argb: 'FF00FF00' }, bold: true }
          break
        case 'in_progress':
          statusCell.font = { color: { argb: 'FFFFFF00' }, bold: true }
          break
        case 'todo':
          statusCell.font = { color: { argb: 'FF808080' } }
          break
        case 'blocked':
          statusCell.font = { color: { argb: 'FFFF0000' }, bold: true }
          break
      }

      // Apply priority-based coloring
      const priorityCell = row.getCell('priority')
      switch (task.priority) {
        case 'critical':
          priorityCell.font = { color: { argb: 'FFFF0000' }, bold: true }
          break
        case 'high':
          priorityCell.font = { color: { argb: 'FFFF8800' }, bold: true }
          break
        case 'medium':
          priorityCell.font = { color: { argb: 'FF0088FF' } }
          break
        case 'low':
          priorityCell.font = { color: { argb: 'FF808080' } }
          break
      }
    })

    // Add borders with brutalist style
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        }
      })
    })

    // Add autofilter
    worksheet.autoFilter = {
      from: 'A1',
      to: `V${tasks.length + 1}`
    }

    return this.generateBuffer()
  }

  /**
   * Export time tracking data to Excel
   */
  async exportTimeTracking(
    timeEntries: TimeEntry[],
    tasks: Task[],
    users: User[],
    projects: Project[]
  ): Promise<Buffer> {
    const worksheet = this.workbook.addWorksheet('Time Tracking', {
      properties: { tabColor: { argb: 'FF0088FF' } },
      views: [{ state: 'frozen', ySplit: 1 }]
    })

    // Define columns
    worksheet.columns = [
      { header: 'Entry ID', key: 'id', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'User', key: 'user', width: 20 },
      { header: 'Task', key: 'task', width: 40 },
      { header: 'Project', key: 'project', width: 20 },
      { header: 'Start Time', key: 'startTime', width: 15 },
      { header: 'End Time', key: 'endTime', width: 15 },
      { header: 'Duration (hrs)', key: 'duration', width: 15 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Billable', key: 'billable', width: 10 },
      { header: 'Approved', key: 'approved', width: 10 },
      { header: 'Week', key: 'week', width: 10 },
      { header: 'Month', key: 'month', width: 15 }
    ]

    // Apply header styling
    const headerRow = worksheet.getRow(1)
    headerRow.font = {
      name: 'IBM Plex Mono',
      bold: true,
      size: 12,
      color: { argb: 'FFFFFFFF' }
    }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0088FF' }
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' }
    headerRow.height = 25

    // Add data rows
    timeEntries.forEach((entry, index) => {
      const task = tasks.find(t => t._id === entry.taskId)
      const user = users.find(u => u._id === entry.userId)
      const project = task ? projects.find(p => p._id === task.projectId) : null
      const startDate = new Date(entry.startTime)
      const duration = entry.duration || 
        (entry.endTime ? (entry.endTime - entry.startTime) / 3600000 : 0)

      const row = worksheet.addRow({
        id: entry._id,
        date: startDate.toLocaleDateString(),
        user: user?.name || entry.userId,
        task: task?.title || entry.taskId,
        project: project?.name || '',
        startTime: startDate.toLocaleTimeString(),
        endTime: entry.endTime ? new Date(entry.endTime).toLocaleTimeString() : '',
        duration: duration.toFixed(2),
        description: entry.description || '',
        billable: entry.billable ? 'Yes' : 'No',
        approved: entry.approved ? 'Yes' : 'No',
        week: `W${this.getWeekNumber(startDate)}`,
        month: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      })

      // Apply alternating row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F8FF' }
        }
      }

      // Highlight unapproved entries
      if (!entry.approved) {
        row.getCell('approved').font = { color: { argb: 'FFFF0000' }, bold: true }
      }
    })

    // Add summary row
    const summaryRow = worksheet.addRow({
      id: 'TOTAL',
      date: '',
      user: '',
      task: '',
      project: '',
      startTime: '',
      endTime: '',
      duration: `=SUM(H2:H${timeEntries.length + 1})`,
      description: 'Total Hours',
      billable: '',
      approved: '',
      week: '',
      month: ''
    })
    
    summaryRow.font = { bold: true }
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFCC00' }
    }

    // Add borders
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        }
      })
    })

    // Add autofilter
    worksheet.autoFilter = {
      from: 'A1',
      to: `M${timeEntries.length + 1}`
    }

    // Add a pivot table sheet for time analysis
    await this.addTimePivotSheet(timeEntries, users, projects, tasks)

    return this.generateBuffer()
  }

  /**
   * Export resource allocation data to Excel
   */
  async exportResourceAllocation(
    resources: Resource[],
    users: User[],
    projects: Project[]
  ): Promise<Buffer> {
    const worksheet = this.workbook.addWorksheet('Resource Allocation', {
      properties: { tabColor: { argb: 'FFFF00FF' } },
      views: [{ state: 'frozen', ySplit: 1, xSplit: 1 }]
    })

    // Create a matrix view
    const uniqueUsers = [...new Set(resources.map(r => r.userId))]
    const uniqueProjects = [...new Set(resources.map(r => r.projectId))]
    
    // Set up columns
    const columns: any[] = [
      { header: 'Resource', key: 'resource', width: 25 }
    ]
    
    uniqueProjects.forEach(projectId => {
      const project = projects.find(p => p._id === projectId)
      columns.push({
        header: project?.name || projectId,
        key: projectId,
        width: 20
      })
    })
    
    columns.push({ header: 'Total Allocation', key: 'total', width: 15 })
    worksheet.columns = columns

    // Apply header styling
    const headerRow = worksheet.getRow(1)
    headerRow.font = {
      name: 'IBM Plex Mono',
      bold: true,
      size: 12,
      color: { argb: 'FFFFFFFF' }
    }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF00FF' }
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 25

    // Add data rows
    uniqueUsers.forEach((userId, index) => {
      const user = users.find(u => u._id === userId)
      const rowData: any = {
        resource: user?.name || userId
      }
      
      let totalAllocation = 0
      uniqueProjects.forEach(projectId => {
        const resource = resources.find(r => 
          r.userId === userId && r.projectId === projectId
        )
        const allocation = resource?.allocation || 0
        rowData[projectId] = allocation ? `${allocation}%` : ''
        totalAllocation += allocation
      })
      
      rowData.total = `${totalAllocation}%`
      
      const row = worksheet.addRow(rowData)
      
      // Apply styling based on allocation
      if (totalAllocation > 100) {
        row.getCell('total').font = { color: { argb: 'FFFF0000' }, bold: true }
        row.getCell('total').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCC' }
        }
      } else if (totalAllocation === 100) {
        row.getCell('total').font = { color: { argb: 'FF00FF00' }, bold: true }
      } else if (totalAllocation < 50) {
        row.getCell('total').font = { color: { argb: 'FF0088FF' } }
      }
      
      // Apply alternating row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }
        }
      }
    })

    // Add borders
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        }
      })
    })

    // Add a capacity chart sheet
    await this.addCapacityChartSheet(resources, users, projects)

    return this.generateBuffer()
  }

  /**
   * Export budget report to Excel
   */
  async exportBudgetReport(
    projects: Project[],
    tasks: Task[],
    timeEntries: TimeEntry[],
    hourlyRates: Map<Id<"users">, number>
  ): Promise<Buffer> {
    const worksheet = this.workbook.addWorksheet('Budget Report', {
      properties: { tabColor: { argb: 'FF00FF00' } },
      views: [{ state: 'frozen', ySplit: 1 }]
    })

    // Define columns
    worksheet.columns = [
      { header: 'Project', key: 'project', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Start Date', key: 'startDate', width: 15 },
      { header: 'End Date', key: 'endDate', width: 15 },
      { header: 'Total Tasks', key: 'totalTasks', width: 12 },
      { header: 'Completed Tasks', key: 'completedTasks', width: 15 },
      { header: 'Estimated Hours', key: 'estimatedHours', width: 15 },
      { header: 'Actual Hours', key: 'actualHours', width: 15 },
      { header: 'Estimated Cost', key: 'estimatedCost', width: 15 },
      { header: 'Actual Cost', key: 'actualCost', width: 15 },
      { header: 'Cost Variance', key: 'variance', width: 15 },
      { header: 'Progress %', key: 'progress', width: 12 }
    ]

    // Apply header styling
    const headerRow = worksheet.getRow(1)
    headerRow.font = {
      name: 'IBM Plex Mono',
      bold: true,
      size: 12,
      color: { argb: 'FFFFFFFF' }
    }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF008800' }
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' }
    headerRow.height = 25

    // Add data rows
    projects.forEach((project, index) => {
      const projectTasks = tasks.filter(t => t.projectId === project._id)
      const completedTasks = projectTasks.filter(t => t.status === 'done')
      const projectTimeEntries = timeEntries.filter(e => {
        const task = tasks.find(t => t._id === e.taskId)
        return task?.projectId === project._id
      })
      
      const estimatedHours = projectTasks.reduce((sum, t) => 
        sum + (t.timeEstimate || 0), 0
      )
      
      const actualHours = projectTimeEntries.reduce((sum, e) => 
        sum + (e.duration || 0), 0
      )
      
      // Calculate costs (using average rate if specific rates not available)
      const avgRate = Array.from(hourlyRates.values()).reduce((sum, rate) => 
        sum + rate, 0
      ) / hourlyRates.size || 100
      
      const estimatedCost = estimatedHours * avgRate
      const actualCost = actualHours * avgRate
      const variance = estimatedCost - actualCost
      const progress = projectTasks.length > 0 
        ? (completedTasks.length / projectTasks.length) * 100 
        : 0

      const row = worksheet.addRow({
        project: project.name,
        status: project.status,
        startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : '',
        endDate: project.endDate ? new Date(project.endDate).toLocaleDateString() : '',
        totalTasks: projectTasks.length,
        completedTasks: completedTasks.length,
        estimatedHours: estimatedHours.toFixed(1),
        actualHours: actualHours.toFixed(1),
        estimatedCost: `$${estimatedCost.toFixed(2)}`,
        actualCost: `$${actualCost.toFixed(2)}`,
        variance: `$${variance.toFixed(2)}`,
        progress: `${progress.toFixed(1)}%`
      })

      // Apply conditional formatting
      if (variance < 0) {
        row.getCell('variance').font = { color: { argb: 'FFFF0000' }, bold: true }
      } else {
        row.getCell('variance').font = { color: { argb: 'FF00FF00' }, bold: true }
      }

      // Apply progress coloring
      const progressCell = row.getCell('progress')
      if (progress === 100) {
        progressCell.font = { color: { argb: 'FF00FF00' }, bold: true }
      } else if (progress >= 75) {
        progressCell.font = { color: { argb: 'FF0088FF' } }
      } else if (progress >= 50) {
        progressCell.font = { color: { argb: 'FFFFFF00' } }
      } else {
        progressCell.font = { color: { argb: 'FFFF8800' } }
      }

      // Apply alternating row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0FFF0' }
        }
      }
    })

    // Add summary row
    const summaryRow = worksheet.addRow({
      project: 'TOTAL',
      status: '',
      startDate: '',
      endDate: '',
      totalTasks: `=SUM(E2:E${projects.length + 1})`,
      completedTasks: `=SUM(F2:F${projects.length + 1})`,
      estimatedHours: `=SUM(G2:G${projects.length + 1})`,
      actualHours: `=SUM(H2:H${projects.length + 1})`,
      estimatedCost: `=SUM(I2:I${projects.length + 1})`,
      actualCost: `=SUM(J2:J${projects.length + 1})`,
      variance: `=SUM(K2:K${projects.length + 1})`,
      progress: `=AVERAGE(L2:L${projects.length + 1})`
    })
    
    summaryRow.font = { bold: true }
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFCC00' }
    }

    // Add borders
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        }
      })
    })

    return this.generateBuffer()
  }

  /**
   * Export custom fields data to Excel
   */
  async exportCustomFields(
    items: Array<Task | Project>,
    customFieldDefinitions: Array<{
      key: string
      label: string
      type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean'
      options?: string[]
    }>
  ): Promise<Buffer> {
    const worksheet = this.workbook.addWorksheet('Custom Fields', {
      properties: { tabColor: { argb: 'FFFF8800' } },
      views: [{ state: 'frozen', ySplit: 1 }]
    })

    // Define columns dynamically based on custom field definitions
    const columns: any[] = [
      { header: 'Item ID', key: 'id', width: 20 },
      { header: 'Item Type', key: 'type', width: 15 },
      { header: 'Name/Title', key: 'name', width: 40 }
    ]

    customFieldDefinitions.forEach(field => {
      columns.push({
        header: field.label,
        key: field.key,
        width: 20
      })
    })

    worksheet.columns = columns

    // Apply header styling
    const headerRow = worksheet.getRow(1)
    headerRow.font = {
      name: 'IBM Plex Mono',
      bold: true,
      size: 12,
      color: { argb: 'FFFFFFFF' }
    }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF8800' }
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' }
    headerRow.height = 25

    // Add data rows
    items.forEach((item, index) => {
      const rowData: any = {
        id: item._id,
        type: 'title' in item ? 'Task' : 'Project',
        name: 'title' in item ? item.title : item.name
      }

      // Add custom field values
      customFieldDefinitions.forEach(field => {
        const value = item.customFields?.[field.key]
        
        if (value !== undefined) {
          switch (field.type) {
            case 'date':
              rowData[field.key] = value ? new Date(value).toLocaleDateString() : ''
              break
            case 'boolean':
              rowData[field.key] = value ? 'Yes' : 'No'
              break
            case 'multiselect':
              rowData[field.key] = Array.isArray(value) ? value.join(', ') : ''
              break
            default:
              rowData[field.key] = value?.toString() || ''
          }
        } else {
          rowData[field.key] = ''
        }
      })

      const row = worksheet.addRow(rowData)

      // Apply alternating row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF0E0' }
        }
      }
    })

    // Add borders
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        }
      })
    })

    // Add autofilter
    worksheet.autoFilter = {
      from: 'A1',
      to: `${String.fromCharCode(65 + columns.length - 1)}${items.length + 1}`
    }

    return this.generateBuffer()
  }

  /**
   * Add time pivot sheet for analysis
   */
  private async addTimePivotSheet(
    timeEntries: TimeEntry[],
    users: User[],
    projects: Project[],
    tasks: Task[]
  ): Promise<void> {
    const worksheet = this.workbook.addWorksheet('Time Analysis', {
      properties: { tabColor: { argb: 'FF888888' } }
    })

    // Create weekly summary
    const weeklySummary = new Map<string, Map<Id<"users">, number>>()
    
    timeEntries.forEach(entry => {
      const week = `W${this.getWeekNumber(new Date(entry.startTime))}`
      if (!weeklySummary.has(week)) {
        weeklySummary.set(week, new Map())
      }
      const weekData = weeklySummary.get(week)!
      const duration = entry.duration || 0
      weekData.set(entry.userId, (weekData.get(entry.userId) || 0) + duration)
    })

    // Set up columns
    const columns: any[] = [{ header: 'Week', key: 'week', width: 10 }]
    const uniqueUsers = [...new Set(timeEntries.map(e => e.userId))]
    
    uniqueUsers.forEach(userId => {
      const user = users.find(u => u._id === userId)
      columns.push({
        header: user?.name || userId,
        key: userId,
        width: 20
      })
    })
    
    columns.push({ header: 'Total', key: 'total', width: 15 })
    worksheet.columns = columns

    // Apply header styling
    const headerRow = worksheet.getRow(1)
    headerRow.font = {
      name: 'IBM Plex Mono',
      bold: true,
      size: 12,
      color: { argb: 'FFFFFFFF' }
    }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF666666' }
    }

    // Add data rows
    Array.from(weeklySummary.entries()).forEach(([week, userData]) => {
      const rowData: any = { week }
      let weekTotal = 0
      
      uniqueUsers.forEach(userId => {
        const hours = userData.get(userId) || 0
        rowData[userId] = hours.toFixed(2)
        weekTotal += hours
      })
      
      rowData.total = weekTotal.toFixed(2)
      worksheet.addRow(rowData)
    })

    // Add borders
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        }
      })
    })
  }

  /**
   * Add capacity chart sheet
   */
  private async addCapacityChartSheet(
    resources: Resource[],
    users: User[],
    projects: Project[]
  ): Promise<void> {
    const worksheet = this.workbook.addWorksheet('Capacity Chart', {
      properties: { tabColor: { argb: 'FF00FFFF' } }
    })

    // Group resources by month
    const monthlyCapacity = new Map<string, Map<Id<"users">, number>>()
    
    resources.forEach(resource => {
      const startDate = new Date(resource.startDate)
      const endDate = new Date(resource.endDate)
      
      let currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const monthKey = currentDate.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        })
        
        if (!monthlyCapacity.has(monthKey)) {
          monthlyCapacity.set(monthKey, new Map())
        }
        
        const monthData = monthlyCapacity.get(monthKey)!
        monthData.set(
          resource.userId, 
          (monthData.get(resource.userId) || 0) + resource.allocation
        )
        
        currentDate.setMonth(currentDate.getMonth() + 1)
      }
    })

    // Set up columns
    const columns: any[] = [{ header: 'Month', key: 'month', width: 15 }]
    const uniqueUsers = [...new Set(resources.map(r => r.userId))]
    
    uniqueUsers.forEach(userId => {
      const user = users.find(u => u._id === userId)
      columns.push({
        header: user?.name || userId,
        key: userId,
        width: 20
      })
    })
    
    worksheet.columns = columns

    // Apply header styling
    const headerRow = worksheet.getRow(1)
    headerRow.font = {
      name: 'IBM Plex Mono',
      bold: true,
      size: 12,
      color: { argb: 'FFFFFFFF' }
    }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00CCCC' }
    }

    // Add data rows
    Array.from(monthlyCapacity.entries()).forEach(([month, userData]) => {
      const rowData: any = { month }
      
      uniqueUsers.forEach(userId => {
        const allocation = userData.get(userId) || 0
        rowData[userId] = allocation ? `${allocation}%` : ''
      })
      
      const row = worksheet.addRow(rowData)
      
      // Highlight overallocations
      uniqueUsers.forEach(userId => {
        const allocation = userData.get(userId) || 0
        if (allocation > 100) {
          row.getCell(userId).font = { color: { argb: 'FFFF0000' }, bold: true }
          row.getCell(userId).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFCCCC' }
          }
        }
      })
    })

    // Add borders
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        }
      })
    })
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
   * Generate Excel buffer
   */
  private async generateBuffer(): Promise<Buffer> {
    return await this.workbook.xlsx.writeBuffer() as Buffer
  }
}

// Export convenience functions
export async function exportTasksToExcel(
  tasks: Task[],
  users: User[],
  projects: Project[],
  sprints: Sprint[]
): Promise<Buffer> {
  const exporter = new ExcelExporter()
  return exporter.exportTasks(tasks, users, projects, sprints)
}

export async function exportTimeTrackingToExcel(
  timeEntries: TimeEntry[],
  tasks: Task[],
  users: User[],
  projects: Project[]
): Promise<Buffer> {
  const exporter = new ExcelExporter()
  return exporter.exportTimeTracking(timeEntries, tasks, users, projects)
}

export async function exportResourceAllocationToExcel(
  resources: Resource[],
  users: User[],
  projects: Project[]
): Promise<Buffer> {
  const exporter = new ExcelExporter()
  return exporter.exportResourceAllocation(resources, users, projects)
}

export async function exportBudgetReportToExcel(
  projects: Project[],
  tasks: Task[],
  timeEntries: TimeEntry[],
  hourlyRates: Map<Id<"users">, number>
): Promise<Buffer> {
  const exporter = new ExcelExporter()
  return exporter.exportBudgetReport(projects, tasks, timeEntries, hourlyRates)
}

export async function exportCustomFieldsToExcel(
  items: Array<Task | Project>,
  customFieldDefinitions: Array<{
    key: string
    label: string
    type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean'
    options?: string[]
  }>
): Promise<Buffer> {
  const exporter = new ExcelExporter()
  return exporter.exportCustomFields(items, customFieldDefinitions)
}