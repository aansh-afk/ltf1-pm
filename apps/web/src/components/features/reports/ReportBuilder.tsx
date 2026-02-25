import React, { useState, useCallback, useMemo } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalInput from '@/components/ui/BrutalInput'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalSelect from '@/components/ui/BrutalSelect'
import { PDFGenerator } from '@/lib/export/pdfGenerator'
import { ExcelExporter } from '@/lib/export/excel'
import { CSVExporter, downloadCSV } from '@/lib/export/csv'
import { Download, FileText, FileSpreadsheet, FileCsv, Plus, Trash2, Save, Send, Calendar } from 'lucide-react'

interface ReportWidget {
  id: string
  type: 'chart' | 'table' | 'metric' | 'list' | 'timeline'
  dataSource: 'tasks' | 'sprints' | 'projects' | 'timeEntries' | 'users'
  filters?: Record<string, any>
  columns?: string[]
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max'
  groupBy?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  position: { x: number; y: number }
  size: { width: number; height: number }
  title?: string
}

interface ReportTemplate {
  id: string
  name: string
  description?: string
  widgets: ReportWidget[]
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string
    recipients: string[]
  }
  createdAt: number
  updatedAt: number
}

interface ReportBuilderProps {
  workspaceId: Id<"workspaces">
  projectId?: Id<"projects">
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({ workspaceId, projectId }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [widgets, setWidgets] = useState<ReportWidget[]>([])
  const [draggedWidget, setDraggedWidget] = useState<ReportWidget | null>(null)
  const [reportName, setReportName] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [scheduleRecipients, setScheduleRecipients] = useState<string[]>([])
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')

  // Fetch data based on selected data sources
  const tasks = useQuery(api.tasks.getTasksByProject, projectId ? { projectId } : 'skip')
  const sprints = useQuery(api.sprints.getSprintsByProject, projectId ? { projectId } : 'skip')
  const projects = useQuery(api.projects.getProjects, { workspaceId })
  const users = useQuery(api.users.getWorkspaceUsers, { workspaceId })

  // Widget library
  const widgetLibrary = [
    { type: 'chart', label: 'Chart', icon: '📊', dataSources: ['tasks', 'sprints', 'timeEntries'] },
    { type: 'table', label: 'Table', icon: '📋', dataSources: ['tasks', 'sprints', 'projects', 'users'] },
    { type: 'metric', label: 'Metric', icon: '🔢', dataSources: ['tasks', 'sprints', 'projects'] },
    { type: 'list', label: 'List', icon: '📝', dataSources: ['tasks', 'sprints', 'projects'] },
    { type: 'timeline', label: 'Timeline', icon: '📅', dataSources: ['tasks', 'sprints', 'projects'] }
  ]

  // Predefined report templates
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'sprint-report',
      name: 'Sprint Report',
      description: 'Sprint progress and velocity metrics',
      widgets: [
        {
          id: '1',
          type: 'metric',
          dataSource: 'tasks',
          filters: { status: 'done' },
          aggregation: 'count',
          position: { x: 0, y: 0 },
          size: { width: 200, height: 100 },
          title: 'Completed Tasks'
        },
        {
          id: '2',
          type: 'chart',
          dataSource: 'tasks',
          groupBy: 'status',
          position: { x: 220, y: 0 },
          size: { width: 400, height: 300 },
          title: 'Task Status Distribution'
        },
        {
          id: '3',
          type: 'table',
          dataSource: 'tasks',
          columns: ['title', 'status', 'assignee', 'storyPoints'],
          sortBy: 'priority',
          sortOrder: 'desc',
          position: { x: 0, y: 120 },
          size: { width: 620, height: 400 },
          title: 'Sprint Backlog'
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'project-status',
      name: 'Project Status Report',
      description: 'Overall project health and progress',
      widgets: [
        {
          id: '1',
          type: 'metric',
          dataSource: 'projects',
          aggregation: 'count',
          position: { x: 0, y: 0 },
          size: { width: 150, height: 100 },
          title: 'Total Projects'
        },
        {
          id: '2',
          type: 'timeline',
          dataSource: 'projects',
          position: { x: 0, y: 120 },
          size: { width: 800, height: 300 },
          title: 'Project Timeline'
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'team-performance',
      name: 'Team Performance Report',
      description: 'Team productivity and workload analysis',
      widgets: [
        {
          id: '1',
          type: 'chart',
          dataSource: 'tasks',
          groupBy: 'assignee',
          aggregation: 'count',
          position: { x: 0, y: 0 },
          size: { width: 400, height: 300 },
          title: 'Tasks by Team Member'
        },
        {
          id: '2',
          type: 'table',
          dataSource: 'users',
          columns: ['name', 'role', 'department'],
          position: { x: 420, y: 0 },
          size: { width: 400, height: 300 },
          title: 'Team Members'
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ]

  // Add widget to report
  const addWidget = useCallback((type: string, dataSource: string) => {
    const newWidget: ReportWidget = {
      id: `widget-${Date.now()}`,
      type: type as any,
      dataSource: dataSource as any,
      position: { x: Math.random() * 500, y: Math.random() * 300 },
      size: { width: 300, height: 200 },
      title: `New ${type}`
    }
    setWidgets([...widgets, newWidget])
  }, [widgets])

  // Remove widget
  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId))
  }, [widgets])

  // Update widget
  const updateWidget = useCallback((widgetId: string, updates: Partial<ReportWidget>) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    ))
  }, [widgets])

  // Load template
  const loadTemplate = useCallback((template: ReportTemplate) => {
    setSelectedTemplate(template)
    setWidgets(template.widgets)
    setReportName(template.name)
    setReportDescription(template.description || '')
    if (template.schedule) {
      setScheduleEnabled(true)
      setScheduleFrequency(template.schedule.frequency)
      setScheduleTime(template.schedule.time)
      setScheduleRecipients(template.schedule.recipients)
    }
  }, [])

  // Export report
  const exportReport = useCallback(async () => {
    if (!tasks || !sprints || !projects || !users) {
      alert('Data is still loading...')
      return
    }

    switch (exportFormat) {
      case 'pdf': {
        const pdfGenerator = new PDFGenerator()
        const doc = pdfGenerator.generateProjectReport(
          projects[0], // Use first project for now
          tasks,
          sprints
        )
        // The PDFGenerator would handle the download internally
        alert('PDF report generated!')
        break
      }
      
      case 'excel': {
        const excelExporter = new ExcelExporter()
        const buffer = await excelExporter.exportTasks(tasks, users, projects, sprints)
        // Convert buffer to blob and download
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${reportName || 'report'}.xlsx`
        link.click()
        break
      }
      
      case 'csv': {
        const csvExporter = new CSVExporter()
        const csv = csvExporter.exportTasks(tasks, users, projects, sprints)
        downloadCSV(csv, `${reportName || 'report'}.csv`)
        break
      }
    }
  }, [exportFormat, tasks, sprints, projects, users, reportName])

  // Save report as template
  const saveAsTemplate = useCallback(() => {
    const template: ReportTemplate = {
      id: `template-${Date.now()}`,
      name: reportName || 'Untitled Report',
      description: reportDescription,
      widgets,
      schedule: scheduleEnabled ? {
        frequency: scheduleFrequency,
        time: scheduleTime,
        recipients: scheduleRecipients
      } : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    // In a real app, this would save to the backend
    console.log('Saving template:', template)
    alert('Report template saved!')
  }, [reportName, reportDescription, widgets, scheduleEnabled, scheduleFrequency, scheduleTime, scheduleRecipients])

  // Schedule report
  const scheduleReport = useCallback(() => {
    if (!scheduleEnabled) {
      alert('Please enable scheduling first')
      return
    }
    
    // In a real app, this would set up the schedule on the backend
    console.log('Scheduling report:', {
      frequency: scheduleFrequency,
      time: scheduleTime,
      recipients: scheduleRecipients
    })
    alert('Report scheduled!')
  }, [scheduleEnabled, scheduleFrequency, scheduleTime, scheduleRecipients])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Report Builder</h1>
          <p className="text-gray-600 mt-2">
            Design custom reports with drag-and-drop widgets
          </p>
        </div>
        <div className="flex gap-2">
          <BrutalButton
            onClick={saveAsTemplate}
            variant="secondary"
            icon={<Save className="w-4 h-4" />}
          >
            Save Template
          </BrutalButton>
          <BrutalButton
            onClick={exportReport}
            variant="primary"
            icon={<Download className="w-4 h-4" />}
          >
            Export Report
          </BrutalButton>
        </div>
      </div>

      {/* Report Configuration */}
      <BrutalCard className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Report Name</label>
            <BrutalInput
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter report name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <BrutalInput
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Enter report description"
            />
          </div>
        </div>

        {/* Export Format */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Export Format</label>
          <div className="flex gap-2">
            <BrutalButton
              variant={exportFormat === 'pdf' ? 'primary' : 'secondary'}
              onClick={() => setExportFormat('pdf')}
              icon={<FileText className="w-4 h-4" />}
              size="sm"
            >
              PDF
            </BrutalButton>
            <BrutalButton
              variant={exportFormat === 'excel' ? 'primary' : 'secondary'}
              onClick={() => setExportFormat('excel')}
              icon={<FileSpreadsheet className="w-4 h-4" />}
              size="sm"
            >
              Excel
            </BrutalButton>
            <BrutalButton
              variant={exportFormat === 'csv' ? 'primary' : 'secondary'}
              onClick={() => setExportFormat('csv')}
              icon={<FileCsv className="w-4 h-4" />}
              size="sm"
            >
              CSV
            </BrutalButton>
          </div>
        </div>

        {/* Schedule Configuration */}
        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(e) => setScheduleEnabled(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">Enable Scheduled Delivery</span>
          </label>
          
          {scheduleEnabled && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <BrutalSelect
                  label="Frequency"
                  value={scheduleFrequency}
                  onChange={(v) => setScheduleFrequency(v as any)}
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                  fullWidth
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time</label>
                <BrutalInput
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Recipients</label>
                <BrutalInput
                  placeholder="email1@example.com, email2@example.com"
                  onChange={(e) => setScheduleRecipients(e.target.value.split(',').map(e => e.trim()))}
                />
              </div>
              <div className="col-span-3">
                <BrutalButton
                  onClick={scheduleReport}
                  variant="secondary"
                  icon={<Calendar className="w-4 h-4" />}
                  size="sm"
                >
                  Schedule Report
                </BrutalButton>
              </div>
            </div>
          )}
        </div>
      </BrutalCard>

      {/* Template Library */}
      <BrutalCard className="p-4">
        <h2 className="text-xl font-bold mb-4">Report Templates</h2>
        <div className="grid grid-cols-3 gap-4">
          {reportTemplates.map(template => (
            <div
              key={template.id}
              className="p-4 border-2 border-black hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => loadTemplate(template)}
            >
              <h3 className="font-bold">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              <p className="text-xs text-gray-500 mt-2">
                {template.widgets.length} widgets
              </p>
            </div>
          ))}
        </div>
      </BrutalCard>

      {/* Widget Library */}
      <BrutalCard className="p-4">
        <h2 className="text-xl font-bold mb-4">Widget Library</h2>
        <div className="flex gap-4 flex-wrap">
          {widgetLibrary.map(widget => (
            <div
              key={widget.type}
              className="p-4 border-2 border-black bg-white hover:bg-gray-100 cursor-move"
              draggable
              onDragStart={(e) => {
                const newWidget: ReportWidget = {
                  id: `widget-${Date.now()}`,
                  type: widget.type as any,
                  dataSource: widget.dataSources[0] as any,
                  position: { x: 0, y: 0 },
                  size: { width: 300, height: 200 },
                  title: widget.label
                }
                setDraggedWidget(newWidget)
              }}
            >
              <div className="text-2xl mb-2">{widget.icon}</div>
              <div className="font-bold">{widget.label}</div>
            </div>
          ))}
        </div>
      </BrutalCard>

      {/* Report Canvas */}
      <BrutalCard className="p-4">
        <h2 className="text-xl font-bold mb-4">Report Canvas</h2>
        <div
          className="relative w-full h-[600px] border-2 border-dashed border-gray-300 bg-gray-50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (draggedWidget) {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const y = e.clientY - rect.top
              setWidgets([...widgets, { ...draggedWidget, position: { x, y } }])
              setDraggedWidget(null)
            }
          }}
        >
          {widgets.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Plus className="w-12 h-12 mx-auto mb-2" />
                <p>Drag widgets here to build your report</p>
              </div>
            </div>
          )}
          
          {widgets.map(widget => (
            <div
              key={widget.id}
              className="absolute bg-white border-2 border-black p-4 shadow-brutal cursor-move"
              style={{
                left: widget.position.x,
                top: widget.position.y,
                width: widget.size.width,
                height: widget.size.height
              }}
              draggable
              onDragEnd={(e) => {
                const rect = e.currentTarget.parentElement!.getBoundingClientRect()
                const x = e.clientX - rect.left
                const y = e.clientY - rect.top
                updateWidget(widget.id, { position: { x, y } })
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold">{widget.title}</h3>
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Type: {widget.type}<br />
                Source: {widget.dataSource}
              </div>
              
              {/* Widget content preview */}
              <div className="mt-2 p-2 bg-gray-100 rounded">
                {widget.type === 'metric' && (
                  <div className="text-2xl font-bold">42</div>
                )}
                {widget.type === 'chart' && (
                  <div className="text-gray-400">📊 Chart Preview</div>
                )}
                {widget.type === 'table' && (
                  <div className="text-gray-400">📋 Table Preview</div>
                )}
                {widget.type === 'list' && (
                  <div className="text-gray-400">📝 List Preview</div>
                )}
                {widget.type === 'timeline' && (
                  <div className="text-gray-400">📅 Timeline Preview</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </BrutalCard>
    </div>
  )
}

export default ReportBuilder