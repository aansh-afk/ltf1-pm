import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'

// Extend jsPDF with autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface Task {
  _id: string
  number: number
  title: string
  description?: string
  status: string
  priority: string
  type: string
  assigneeIds?: string[]
  labels: string[]
  dueDate?: number
  startDate?: number
  completedAt?: number
  estimate?: {
    points?: number
    hours?: number
  }
}

interface Sprint {
  _id: string
  name: string
  goal?: string
  startDate: number
  endDate: number
  status: string
}

interface Meeting {
  _id: string
  title: string
  description?: string
  startTime: number
  endTime?: number
  attendees: string[]
  agenda?: string[]
  notes?: string
}

interface Project {
  _id: string
  name: string
  description?: string
  status: string
  leadId?: string
}

export class PDFGenerator {
  private doc: jsPDF
  private pageHeight: number
  private pageWidth: number
  private margin: number
  private currentY: number
  private primaryColor: string
  private secondaryColor: string
  private textColor: string

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.margin = 20
    this.currentY = this.margin
    
    // Brutalist color scheme
    this.primaryColor = '#FFFF00' // Yellow
    this.secondaryColor = '#00FFFF' // Cyan
    this.textColor = '#000000' // Black
  }

  private addHeader(title: string, subtitle?: string) {
    // Title background
    this.doc.setFillColor(0, 0, 0)
    this.doc.rect(0, 0, this.pageWidth, 30, 'F')
    
    // Title text
    this.doc.setTextColor(255, 255, 0)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title.toUpperCase(), this.margin, 20)
    
    if (subtitle) {
      this.doc.setTextColor(0, 255, 255)
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(subtitle, this.margin, 27)
    }
    
    this.currentY = 40
  }

  private addFooter(pageNumber: number) {
    const footerY = this.pageHeight - 10
    
    // Footer line
    this.doc.setDrawColor(0, 0, 0)
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5)
    
    // Page number
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFontSize(10)
    this.doc.text(
      `Page ${pageNumber}`,
      this.pageWidth / 2,
      footerY,
      { align: 'center' }
    )
    
    // Timestamp
    this.doc.setFontSize(8)
    this.doc.text(
      `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
      this.margin,
      footerY
    )
  }

  private addSection(title: string) {
    if (this.currentY > this.pageHeight - 40) {
      this.doc.addPage()
      this.currentY = this.margin
    }
    
    // Section header
    this.doc.setFillColor(255, 255, 0)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 8, 'F')
    
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title.toUpperCase(), this.margin + 2, this.currentY + 6)
    
    this.currentY += 12
  }

  private checkPageBreak(requiredSpace: number = 30) {
    if (this.currentY + requiredSpace > this.pageHeight - 20) {
      this.doc.addPage()
      this.currentY = this.margin
      return true
    }
    return false
  }

  // Generate Sprint Report PDF
  generateSprintReport(sprint: Sprint, tasks: Task[], teamMembers: any[]) {
    this.addHeader('Sprint Report', sprint.name)
    
    // Sprint Overview
    this.addSection('Sprint Overview')
    
    const overviewData = [
      ['Sprint Name', sprint.name],
      ['Goal', sprint.goal || 'Not specified'],
      ['Start Date', format(new Date(sprint.startDate), 'MMM dd, yyyy')],
      ['End Date', format(new Date(sprint.endDate), 'MMM dd, yyyy')],
      ['Status', sprint.status.toUpperCase()],
      ['Total Tasks', tasks.length.toString()],
    ]
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [],
      body: overviewData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [255, 255, 0],
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
      },
      margin: { left: this.margin, right: this.margin },
    })
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
    
    // Task Summary
    this.addSection('Task Summary')
    
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const priorityCounts = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const summaryData = [
      ['By Status', ''],
      ...Object.entries(statusCounts).map(([status, count]) => [
        `  ${status.replace('_', ' ').toUpperCase()}`,
        count.toString()
      ]),
      ['', ''],
      ['By Priority', ''],
      ...Object.entries(priorityCounts).map(([priority, count]) => [
        `  ${priority.toUpperCase()}`,
        count.toString()
      ]),
    ]
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [],
      body: summaryData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'center' },
      },
      margin: { left: this.margin, right: this.margin },
    })
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
    
    // Task List
    this.checkPageBreak()
    this.addSection('Task List')
    
    const taskTableData = tasks.map(task => [
      `#${task.number}`,
      task.title,
      task.status.replace('_', ' ').toUpperCase(),
      task.priority.toUpperCase(),
      task.type.toUpperCase(),
      task.dueDate ? format(new Date(task.dueDate), 'MMM dd') : '-',
    ])
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [['ID', 'Title', 'Status', 'Priority', 'Type', 'Due Date']],
      body: taskTableData,
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 0],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 70 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
      },
      margin: { left: this.margin, right: this.margin },
    })
    
    // Add footer to all pages
    const pageCount = this.doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.addFooter(i)
    }
    
    return this.doc
  }

  // Generate Project Status Report PDF
  generateProjectReport(project: Project, tasks: Task[], sprints: Sprint[], teamMembers: any[]) {
    this.addHeader('Project Status Report', project.name)
    
    // Project Overview
    this.addSection('Project Overview')
    
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
    const todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'backlog').length
    
    const overviewData = [
      ['Project Name', project.name],
      ['Description', project.description || 'Not specified'],
      ['Status', project.status.toUpperCase()],
      ['Total Tasks', tasks.length.toString()],
      ['Completed', completedTasks.toString()],
      ['In Progress', inProgressTasks.toString()],
      ['To Do', todoTasks.toString()],
      ['Completion Rate', `${Math.round((completedTasks / tasks.length) * 100)}%`],
    ]
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [],
      body: overviewData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
      },
      margin: { left: this.margin, right: this.margin },
    })
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
    
    // Sprint Summary
    if (sprints.length > 0) {
      this.addSection('Sprint Summary')
      
      const sprintTableData = sprints.map(sprint => [
        sprint.name,
        format(new Date(sprint.startDate), 'MMM dd, yyyy'),
        format(new Date(sprint.endDate), 'MMM dd, yyyy'),
        sprint.status.toUpperCase(),
      ])
      
      this.doc.autoTable({
        startY: this.currentY,
        head: [['Sprint Name', 'Start Date', 'End Date', 'Status']],
        body: sprintTableData,
        theme: 'striped',
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [0, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        margin: { left: this.margin, right: this.margin },
      })
      
      this.currentY = (this.doc as any).lastAutoTable.finalY + 10
    }
    
    // High Priority Tasks
    const highPriorityTasks = tasks.filter(t => 
      t.priority === 'urgent' || t.priority === 'high'
    ).slice(0, 10)
    
    if (highPriorityTasks.length > 0) {
      this.checkPageBreak()
      this.addSection('High Priority Tasks')
      
      const highPriorityData = highPriorityTasks.map(task => [
        `#${task.number}`,
        task.title,
        task.status.replace('_', ' ').toUpperCase(),
        task.priority.toUpperCase(),
        task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : '-',
      ])
      
      this.doc.autoTable({
        startY: this.currentY,
        head: [['ID', 'Title', 'Status', 'Priority', 'Due Date']],
        body: highPriorityData,
        theme: 'striped',
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [255, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        margin: { left: this.margin, right: this.margin },
      })
    }
    
    // Add footer to all pages
    const pageCount = this.doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.addFooter(i)
    }
    
    return this.doc
  }

  // Generate Meeting Minutes PDF
  generateMeetingMinutes(meeting: Meeting, actionItems: Task[]) {
    this.addHeader('Meeting Minutes', meeting.title)
    
    // Meeting Details
    this.addSection('Meeting Details')
    
    const meetingData = [
      ['Title', meeting.title],
      ['Date', format(new Date(meeting.startTime), 'MMMM dd, yyyy')],
      ['Time', `${format(new Date(meeting.startTime), 'HH:mm')} - ${meeting.endTime ? format(new Date(meeting.endTime), 'HH:mm') : 'TBD'}`],
      ['Attendees', meeting.attendees.join(', ')],
    ]
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [],
      body: meetingData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
      },
      margin: { left: this.margin, right: this.margin },
    })
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
    
    // Agenda
    if (meeting.agenda && meeting.agenda.length > 0) {
      this.addSection('Agenda')
      
      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      
      meeting.agenda.forEach((item, index) => {
        this.doc.text(`${index + 1}. ${item}`, this.margin + 5, this.currentY)
        this.currentY += 6
      })
      
      this.currentY += 5
    }
    
    // Meeting Notes
    if (meeting.notes) {
      this.checkPageBreak()
      this.addSection('Meeting Notes')
      
      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      
      const lines = this.doc.splitTextToSize(meeting.notes, this.pageWidth - 2 * this.margin - 10)
      lines.forEach((line: string) => {
        if (this.currentY > this.pageHeight - 20) {
          this.doc.addPage()
          this.currentY = this.margin
        }
        this.doc.text(line, this.margin + 5, this.currentY)
        this.currentY += 5
      })
      
      this.currentY += 5
    }
    
    // Action Items
    if (actionItems.length > 0) {
      this.checkPageBreak()
      this.addSection('Action Items')
      
      const actionData = actionItems.map(task => [
        task.title,
        task.assigneeIds?.join(', ') || 'Unassigned',
        task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No due date',
        task.status.replace('_', ' ').toUpperCase(),
      ])
      
      this.doc.autoTable({
        startY: this.currentY,
        head: [['Action Item', 'Assigned To', 'Due Date', 'Status']],
        body: actionData,
        theme: 'striped',
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [255, 255, 0],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        margin: { left: this.margin, right: this.margin },
      })
    }
    
    // Add footer
    this.addFooter(1)
    
    return this.doc
  }

  // Generate Task List PDF
  generateTaskList(tasks: Task[], title: string = 'Task List') {
    this.addHeader(title, `Total Tasks: ${tasks.length}`)
    
    // Group tasks by status
    const tasksByStatus: Record<string, Task[]> = {}
    tasks.forEach(task => {
      if (!tasksByStatus[task.status]) {
        tasksByStatus[task.status] = []
      }
      tasksByStatus[task.status].push(task)
    })
    
    // Add tasks by status
    Object.entries(tasksByStatus).forEach(([status, statusTasks]) => {
      this.checkPageBreak()
      this.addSection(`${status.replace('_', ' ').toUpperCase()} (${statusTasks.length})`)
      
      const taskData = statusTasks.map(task => [
        `#${task.number}`,
        task.title.substring(0, 50) + (task.title.length > 50 ? '...' : ''),
        task.priority.toUpperCase(),
        task.type.toUpperCase(),
        task.assigneeIds?.join(', ') || '-',
        task.dueDate ? format(new Date(task.dueDate), 'MMM dd') : '-',
      ])
      
      this.doc.autoTable({
        startY: this.currentY,
        head: [['ID', 'Title', 'Priority', 'Type', 'Assignees', 'Due']],
        body: taskData,
        theme: 'striped',
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 65 },
          2: { cellWidth: 18 },
          3: { cellWidth: 18 },
          4: { cellWidth: 35 },
          5: { cellWidth: 18 },
        },
        margin: { left: this.margin, right: this.margin },
      })
      
      this.currentY = (this.doc as any).lastAutoTable.finalY + 10
    })
    
    // Add footer to all pages
    const pageCount = this.doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.addFooter(i)
    }
    
    return this.doc
  }

  // Save or download the PDF
  save(filename: string) {
    this.doc.save(filename)
  }

  // Get PDF as blob
  getBlob(): Blob {
    return this.doc.output('blob')
  }

  // Get PDF as base64
  getBase64(): string {
    return this.doc.output('datauristring')
  }
}