import { useEffect, useMemo, useRef, useReducer } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { 
  HiOutlineZoomIn, 
  HiOutlineZoomOut,
  HiOutlineCalendar,
  HiOutlineFilter,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineChevronRight,
  HiOutlineChevronDown
} from 'react-icons/hi'
import clsx from 'clsx'
import { format, startOfDay, endOfDay, differenceInDays, addDays, startOfWeek, startOfMonth, isWeekend } from 'date-fns'
import toast from 'react-hot-toast'

interface GanttViewProps {
  projectId: Id<"projects">
  workspaceId: Id<"workspaces">
}

interface GanttTask {
  id: Id<"tasks">
  title: string
  startDate: Date
  endDate: Date
  progress: number
  dependencies: Id<"tasks">[]
  assigneeIds: Id<"users">[]
  status: string
  priority: string
  type: string
  milestone: boolean
  criticalPath: boolean
  children?: GanttTask[]
  expanded?: boolean
}

type ZoomLevel = 'day' | 'week' | 'month' | 'quarter'

const HEADER_HEIGHT = 60
const ROW_HEIGHT = 40
const SIDEBAR_WIDTH = 300
const MIN_COLUMN_WIDTH = 30

// Extracted from component to avoid re-creation on every render
function TimelineHeader({
  startDate,
  endDate,
  zoomLevel,
  columnWidth,
}: {
  startDate: Date
  endDate: Date
  zoomLevel: ZoomLevel
  columnWidth: number
}) {
  const headers = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    let label = ''
    let width = columnWidth
    let nextDate = new Date(currentDate)

    switch (zoomLevel) {
      case 'day':
        label = format(currentDate, 'MMM dd')
        nextDate = addDays(currentDate, 1)
        width = columnWidth
        break
      case 'week':
        label = `Week ${format(currentDate, 'w')}`
        nextDate = addDays(currentDate, 7)
        width = columnWidth
        break
      case 'month':
        label = format(currentDate, 'MMM yyyy')
        nextDate = addDays(currentDate, 30)
        width = columnWidth
        break
      case 'quarter':
        label = `Q${Math.ceil((currentDate.getMonth() + 1) / 3)} ${format(currentDate, 'yyyy')}`
        nextDate = addDays(currentDate, 90)
        width = columnWidth
        break
    }

    headers.push(
      <div
        key={`header-${label}`}
        className="border-r border-[var(--theme-border)] text-center py-[4px] text-xs font-bold"
        style={{
          width: `${width}px`,
          minWidth: `${width}px`
        }}
      >
        {label}
      </div>
    )

    currentDate = nextDate
  }

  return <>{headers}</>
}

function DependencyLines({
  showDependencies,
  ganttTasks,
  tasks,
  startDate,
  columnWidth,
  zoomLevel,
}: {
  showDependencies: boolean
  ganttTasks: GanttTask[]
  tasks: any[]
  startDate: Date
  columnWidth: number
  zoomLevel: ZoomLevel
}) {
  if (!showDependencies) return null

  const lines: JSX.Element[] = []
  const taskPositions = new Map<Id<"tasks">, { x: number; y: number }>()

  let yPos = 0
  const calculatePositions = (taskList: GanttTask[]) => {
    taskList.forEach(task => {
      const taskStart = differenceInDays(task.startDate, startDate)
      const x = (taskStart * columnWidth) / (zoomLevel === 'day' ? 1 : 7)
      taskPositions.set(task.id, { x, y: yPos + ROW_HEIGHT / 2 })
      yPos += ROW_HEIGHT

      if (task.expanded && task.children) {
        calculatePositions(task.children)
      }
    })
  }
  calculatePositions(ganttTasks)

  taskPositions.forEach((pos, taskId) => {
    const task = tasks.find(t => t._id === taskId)
    if (task?.dependencies) {
      task.dependencies.forEach((depId: Id<"tasks">) => {
        const depPos = taskPositions.get(depId)
        if (depPos) {
          lines.push(
            <line
              key={`${taskId}-${depId}`}
              x1={depPos.x}
              y1={depPos.y}
              x2={pos.x}
              y2={pos.y}
              stroke="var(--theme-info)"
              strokeWidth={1}
              strokeDasharray="4,4"
              markerEnd="url(#arrowhead)"
              opacity={0.5}
            />
          )
        }
      })
    }
  })

  return (
    <g>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="var(--theme-info)"
          />
        </marker>
      </defs>
      {lines}
    </g>
  )
}

type GanttAction =
  | { type: 'SET_ZOOM'; level: ZoomLevel }
  | { type: 'SELECT_TASK'; taskId: Id<"tasks"> | null }
  | { type: 'TOGGLE_EXPAND'; taskId: Id<"tasks"> }
  | { type: 'START_DRAG'; taskId: Id<"tasks"> }
  | { type: 'END_DRAG' }
  | { type: 'TOGGLE_CRITICAL_PATH' }
  | { type: 'TOGGLE_MILESTONES' }
  | { type: 'TOGGLE_DEPENDENCIES' }

interface GanttState {
  zoomLevel: ZoomLevel
  selectedTask: Id<"tasks"> | null
  expandedTasks: Set<Id<"tasks">>
  isDragging: boolean
  draggedTask: Id<"tasks"> | null
  showCriticalPath: boolean
  showMilestones: boolean
  showDependencies: boolean
}

const ganttInitialState: GanttState = {
  zoomLevel: 'week',
  selectedTask: null,
  expandedTasks: new Set(),
  isDragging: false,
  draggedTask: null,
  showCriticalPath: true,
  showMilestones: true,
  showDependencies: true,
}

function ganttReducer(state: GanttState, action: GanttAction): GanttState {
  switch (action.type) {
    case 'SET_ZOOM':
      return { ...state, zoomLevel: action.level }
    case 'SELECT_TASK':
      return { ...state, selectedTask: action.taskId }
    case 'TOGGLE_EXPAND': {
      const next = new Set(state.expandedTasks)
      if (next.has(action.taskId)) next.delete(action.taskId)
      else next.add(action.taskId)
      return { ...state, expandedTasks: next }
    }
    case 'START_DRAG':
      return { ...state, isDragging: true, draggedTask: action.taskId }
    case 'END_DRAG':
      return { ...state, isDragging: false, draggedTask: null }
    case 'TOGGLE_CRITICAL_PATH':
      return { ...state, showCriticalPath: !state.showCriticalPath }
    case 'TOGGLE_MILESTONES':
      return { ...state, showMilestones: !state.showMilestones }
    case 'TOGGLE_DEPENDENCIES':
      return { ...state, showDependencies: !state.showDependencies }
    default:
      return state
  }
}

// --- Sub-components ---

interface GanttToolbarProps {
  zoomLevel: ZoomLevel
  showCriticalPath: boolean
  showMilestones: boolean
  showDependencies: boolean
  onSetZoom: (level: ZoomLevel) => void
  onToggleCriticalPath: () => void
  onToggleMilestones: () => void
  onToggleDependencies: () => void
  onExport: () => void
}

function GanttToolbar({
  zoomLevel,
  showCriticalPath,
  showMilestones,
  showDependencies,
  onSetZoom,
  onToggleCriticalPath,
  onToggleMilestones,
  onToggleDependencies,
  onExport,
}: GanttToolbarProps) {
  return (
    <div className="flex items-center justify-between p-[10px] border-b-2 border-[var(--theme-border)]">
      <div className="flex items-center gap-[8px]">
        <h2 className="text-[14px] font-semibold font-bold">GANTT CHART</h2>

        {/* Zoom controls */}
        <div className="flex items-center gap-[4px]">
          <button
            onClick={() => onSetZoom('day')}
            className={clsx(
              'px-[8px] py-6px text-xs font-bold border-2',
              zoomLevel === 'day'
                ? 'bg-[var(--theme-primary)] text-[var(--theme-background)] border-[var(--theme-primary)]'
                : 'bg-transparent border-[var(--theme-border)]'
            )}
          >
            DAY
          </button>
          <button
            onClick={() => onSetZoom('week')}
            className={clsx(
              'px-[8px] py-6px text-xs font-bold border-2',
              zoomLevel === 'week'
                ? 'bg-[var(--theme-primary)] text-[var(--theme-background)] border-[var(--theme-primary)]'
                : 'bg-transparent border-[var(--theme-border)]'
            )}
          >
            WEEK
          </button>
          <button
            onClick={() => onSetZoom('month')}
            className={clsx(
              'px-[8px] py-6px text-xs font-bold border-2',
              zoomLevel === 'month'
                ? 'bg-[var(--theme-primary)] text-[var(--theme-background)] border-[var(--theme-primary)]'
                : 'bg-transparent border-[var(--theme-border)]'
            )}
          >
            MONTH
          </button>
        </div>

        {/* View options */}
        <div className="flex items-center gap-[4px]">
          <button
            onClick={onToggleCriticalPath}
            className={clsx(
              'px-[8px] py-6px text-xs font-bold border-2',
              showCriticalPath
                ? 'bg-[var(--theme-error)] text-[var(--theme-background)] border-[var(--theme-error)]'
                : 'bg-transparent border-[var(--theme-border)]'
            )}
          >
            CRITICAL PATH
          </button>
          <button
            onClick={onToggleMilestones}
            className={clsx(
              'px-[8px] py-6px text-xs font-bold border-2',
              showMilestones
                ? 'bg-[var(--theme-warning)] text-[var(--theme-background)] border-[var(--theme-warning)]'
                : 'bg-transparent border-[var(--theme-border)]'
            )}
          >
            MILESTONES
          </button>
          <button
            onClick={onToggleDependencies}
            className={clsx(
              'px-[8px] py-6px text-xs font-bold border-2',
              showDependencies
                ? 'bg-[var(--theme-info)] text-[var(--theme-background)] border-[var(--theme-info)]'
                : 'bg-transparent border-[var(--theme-border)]'
            )}
          >
            DEPENDENCIES
          </button>
        </div>
      </div>

      <div className="flex items-center gap-[4px]">
        <button
          onClick={onExport}
          className="flex items-center gap-[4px] px-[10px] py-[4px] bg-transparent border-2 border-[var(--theme-border)] hover:bg-[var(--theme-hover)]"
        >
          <HiOutlineDownload className="w-16px h-16px" />
          <span className="text-xs font-bold">EXPORT</span>
        </button>
      </div>
    </div>
  )
}

interface GanttTaskSidebarProps {
  flatTasks: Array<{ task: GanttTask; level: number }>
  selectedTask: Id<"tasks"> | null
  showCriticalPath: boolean
  showMilestones: boolean
  onToggleExpansion: (taskId: Id<"tasks">) => void
}

function GanttTaskSidebar({ flatTasks, selectedTask, showCriticalPath, showMilestones, onToggleExpansion }: GanttTaskSidebarProps) {
  return (
    <div
      className="border-r-2 border-[var(--theme-border)] overflow-y-auto"
      style={{ width: `${SIDEBAR_WIDTH}px`, minWidth: `${SIDEBAR_WIDTH}px` }}
    >
      {/* Header */}
      <div className="h-[60px] border-b-2 border-[var(--theme-border)] flex items-center px-[10px] font-bold text-xs">
        TASK NAME
      </div>

      {/* Task rows */}
      {flatTasks.map(({ task, level }) => (
        <div
          key={task.id}
          className={clsx(
            'h-[40px] border-b border-[var(--theme-border)] flex items-center px-[10px] text-sm',
            selectedTask === task.id && 'bg-[var(--theme-hover)]'
          )}
          style={{ paddingLeft: `${16 + level * 24}px` }}
        >
          {task.children && task.children.length > 0 && (
            <button
              onClick={() => onToggleExpansion(task.id)}
              className="mr-[4px]"
            >
              {task.expanded ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
            </button>
          )}
          <span className={clsx(
            task.criticalPath && showCriticalPath && 'text-[var(--theme-error)] font-bold',
            task.milestone && showMilestones && 'text-[var(--theme-warning)]'
          )}>
            {task.title}
          </span>
        </div>
      ))}
    </div>
  )
}

// --- Main component ---

export default function GanttView({ projectId, workspaceId }: GanttViewProps) {
  const [state, dispatch] = useReducer(ganttReducer, ganttInitialState)
  const { zoomLevel, selectedTask, expandedTasks, isDragging, draggedTask, showCriticalPath, showMilestones, showDependencies } = state
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<SVGSVGElement>(null)
  
  // Fetch tasks
  const tasks = useQuery(api.tasks.queries.getProjectTasks, { projectId }) || []
  const updateTask = useMutation(api.tasks.mutations.updateTask)
  
  // Process tasks into Gantt format
  const ganttTasks = useMemo(() => {
    const taskMap = new Map<Id<"tasks">, GanttTask>()
    
    // First pass: create all tasks
    tasks.forEach(task => {
      const startDate = task.startDate ? new Date(task.startDate) : new Date()
      const endDate = task.dueDate ? new Date(task.dueDate) : addDays(startDate, 7)
      
      taskMap.set(task._id, {
        id: task._id,
        title: task.title,
        startDate,
        endDate,
        progress: task.progress || 0,
        dependencies: task.dependencies || [],
        assigneeIds: task.assigneeIds || [],
        status: task.status,
        priority: task.priority,
        type: task.type,
        milestone: task.milestone || false,
        criticalPath: task.criticalPath || false,
        children: [],
        expanded: expandedTasks.has(task._id)
      })
    })
    
    // Second pass: build hierarchy
    const rootTasks: GanttTask[] = []
    tasks.forEach(task => {
      const ganttTask = taskMap.get(task._id)!
      if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
        const parent = taskMap.get(task.parentTaskId)!
        parent.children?.push(ganttTask)
      } else {
        rootTasks.push(ganttTask)
      }
    })
    
    return rootTasks
  }, [tasks, expandedTasks])
  
  // Calculate date range
  const { startDate, endDate, totalDays } = useMemo(() => {
    if (ganttTasks.length === 0) {
      const start = startOfMonth(new Date())
      const end = addDays(start, 90)
      return { startDate: start, endDate: end, totalDays: 90 }
    }
    
    let minDate = new Date()
    let maxDate = new Date()
    
    const processTask = (task: GanttTask) => {
      if (task.startDate < minDate) minDate = task.startDate
      if (task.endDate > maxDate) maxDate = task.endDate
      task.children?.forEach(processTask)
    }
    
    ganttTasks.forEach(processTask)
    
    // Add padding based on zoom level to optimize performance
    const paddingDays = zoomLevel === 'day' ? 3 : 7
    const start = addDays(minDate, -paddingDays)
    
    // Limit the visible range in day view for performance
    const maxDaysInView = zoomLevel === 'day' ? 30 : 180
    const calculatedEnd = addDays(maxDate, paddingDays)
    const limitedEnd = differenceInDays(calculatedEnd, start) > maxDaysInView 
      ? addDays(start, maxDaysInView)
      : calculatedEnd
    
    const days = differenceInDays(limitedEnd, start)
    
    return { startDate: start, endDate: limitedEnd, totalDays: days }
  }, [ganttTasks, zoomLevel])
  
  // Calculate column width based on zoom
  const columnWidth = useMemo(() => {
    switch (zoomLevel) {
      case 'day': return 60  // Increased for better visibility and performance
      case 'week': return 100
      case 'month': return 200
      case 'quarter': return 300
      default: return 100
    }
  }, [zoomLevel])
  
  // Render task bar
  const renderTaskBar = (task: GanttTask, yPosition: number) => {
    const taskStart = differenceInDays(task.startDate, startDate)
    const taskDuration = differenceInDays(task.endDate, task.startDate) || 1
    const x = (taskStart * columnWidth) / (zoomLevel === 'day' ? 1 : 7)
    const width = (taskDuration * columnWidth) / (zoomLevel === 'day' ? 1 : 7)
    const progressWidth = width * (task.progress / 100)
    
    // Task bar colors based on priority
    const barColor = task.criticalPath && showCriticalPath ? 'var(--theme-error)' :
                    task.priority === 'urgent' ? 'var(--theme-error)' :
                    task.priority === 'high' ? 'var(--theme-warning)' :
                    task.priority === 'medium' ? 'var(--theme-info)' :
                    'var(--theme-success)'
    
    if (task.milestone && showMilestones) {
      // Render milestone as diamond
      return (
        <g key={task.id}>
          <rect
            x={x - 10}
            y={yPosition + ROW_HEIGHT / 2 - 10}
            width={20}
            height={20}
            fill={barColor}
            transform={`rotate(45 ${x} ${yPosition + ROW_HEIGHT / 2})`}
            className="cursor-pointer hover:opacity-80"
            onClick={() => dispatch({ type: 'SELECT_TASK', taskId: task.id })}
          />
          <text
            x={x + 25}
            y={yPosition + ROW_HEIGHT / 2 + 5}
            fill="var(--theme-foreground)"
            fontSize="12"
            className="select-none"
          >
            {task.title}
          </text>
        </g>
      )
    }
    
    return (
      <g key={task.id}>
        {/* Task bar background */}
        <rect
          x={x}
          y={yPosition + 10}
          width={width}
          height={20}
          rx={2}
          fill={`${barColor}20`}
          stroke={barColor}
          strokeWidth={2}
          className="cursor-pointer"
          onClick={() => dispatch({ type: 'SELECT_TASK', taskId: task.id })}
        />
        
        {/* Progress bar */}
        <rect
          x={x}
          y={yPosition + 10}
          width={progressWidth}
          height={20}
          rx={2}
          fill={barColor}
          className="pointer-events-none"
        />
        
        {/* Task title */}
        {width > 50 && (
          <text
            x={x + 5}
            y={yPosition + 24}
            fill="var(--theme-foreground)"
            fontSize="11"
            className="select-none pointer-events-none"
          >
            {task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
          </text>
        )}
        
        {/* Progress percentage */}
        {width > 30 && (
          <text
            x={x + width - 25}
            y={yPosition + 24}
            fill="var(--theme-foreground)"
            fontSize="10"
            className="select-none pointer-events-none"
          >
            {task.progress}%
          </text>
        )}
      </g>
    )
  }
  
  // Flatten tasks for rendering
  const flattenTasks = (tasks: GanttTask[], level = 0): Array<{ task: GanttTask, level: number }> => {
    const result: Array<{ task: GanttTask, level: number }> = []
    
    tasks.forEach(task => {
      result.push({ task, level })
      if (task.expanded && task.children) {
        result.push(...flattenTasks(task.children, level + 1))
      }
    })
    
    return result
  }
  
  const flatTasks = flattenTasks(ganttTasks)
  
  // Handle task expansion
  const toggleTaskExpansion = (taskId: Id<"tasks">) => {
    dispatch({ type: 'TOGGLE_EXPAND', taskId })
  }
  
  // Handle task update
  const handleTaskUpdate = async (taskId: Id<"tasks">, updates: any) => {
    try {
      await updateTask({ taskId, updates })
      toast.success('Task updated')
    } catch (error) {
      toast.error('Failed to update task')
    }
  }
  
  // Export to image
  const exportToImage = () => {
    if (!ganttRef.current) return
    
    const svg = ganttRef.current
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngUrl = canvas.toDataURL('image/png')
      
      const downloadLink = document.createElement('a')
      downloadLink.download = `gantt-chart-${Date.now()}.png`
      downloadLink.href = pngUrl
      downloadLink.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }
  
  return (
    <div className="h-full flex flex-col bg-[var(--theme-background)]">
      {/* Toolbar */}
      <GanttToolbar
        zoomLevel={zoomLevel}
        showCriticalPath={showCriticalPath}
        showMilestones={showMilestones}
        showDependencies={showDependencies}
        onSetZoom={(level) => dispatch({ type: 'SET_ZOOM', level })}
        onToggleCriticalPath={() => dispatch({ type: 'TOGGLE_CRITICAL_PATH' })}
        onToggleMilestones={() => dispatch({ type: 'TOGGLE_MILESTONES' })}
        onToggleDependencies={() => dispatch({ type: 'TOGGLE_DEPENDENCIES' })}
        onExport={exportToImage}
      />
      
      {/* Gantt Chart */}
      <div className="flex-1 flex overflow-hidden">
        {/* Task List Sidebar */}
        <GanttTaskSidebar
          flatTasks={flatTasks}
          selectedTask={selectedTask}
          showCriticalPath={showCriticalPath}
          showMilestones={showMilestones}
          onToggleExpansion={toggleTaskExpansion}
        />
        
        {/* Timeline Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto"
        >
          {/* Timeline Header */}
          <div className="h-[60px] border-b-2 border-[var(--theme-border)] flex sticky top-0 bg-[var(--theme-background-secondary)] z-10">
            <TimelineHeader startDate={startDate} endDate={endDate} zoomLevel={zoomLevel} columnWidth={columnWidth} />
          </div>
          
          {/* Gantt Bars */}
          <svg
            ref={ganttRef}
            width={totalDays * columnWidth / (zoomLevel === 'day' ? 1 : 7)}
            height={flatTasks.length * ROW_HEIGHT}
            className="relative"
          >
            {/* Grid lines - optimized to render fewer lines */}
            {Array.from({ length: Math.min(Math.ceil(totalDays / (zoomLevel === 'day' ? 1 : 7)), 100) }).map((_, i) => {
              // Skip every other line in day view for performance
              if (zoomLevel === 'day' && i % 2 !== 0) return null
              return (
                <line
                  key={`grid-${i * columnWidth}`}
                  x1={i * columnWidth}
                  y1={0}
                  x2={i * columnWidth}
                  y2={flatTasks.length * ROW_HEIGHT}
                  stroke="var(--theme-border)"
                  strokeWidth={1}
                  opacity={0.3}
                />
              )
            })}
            
            {/* Weekend highlighting - optimized to only render visible weekends */}
            {zoomLevel === 'day' && Array.from({ length: Math.min(totalDays, 30) }).map((_, i) => {
              const date = addDays(startDate, i)
              if (isWeekend(date)) {
                return (
                  <rect
                    key={`weekend-${format(date, 'yyyy-MM-dd')}`}
                    x={i * columnWidth}
                    y={0}
                    width={columnWidth}
                    height={flatTasks.length * ROW_HEIGHT}
                    fill="var(--theme-hover)"
                    opacity={0.1}
                  />
                )
              }
              return null
            })}
            
            {/* Dependencies */}
            <DependencyLines
              showDependencies={showDependencies}
              ganttTasks={ganttTasks}
              tasks={tasks}
              startDate={startDate}
              columnWidth={columnWidth}
              zoomLevel={zoomLevel}
            />
            
            {/* Task bars */}
            {flatTasks.map(({ task }, index) => 
              renderTaskBar(task, index * ROW_HEIGHT)
            )}
            
            {/* Today line */}
            {(() => {
              const todayOffset = differenceInDays(new Date(), startDate)
              const x = (todayOffset * columnWidth) / (zoomLevel === 'day' ? 1 : 7)
              return (
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={flatTasks.length * ROW_HEIGHT}
                  stroke="var(--theme-error)"
                  strokeWidth={2}
                  strokeDasharray="4,4"
                />
              )
            })()}
          </svg>
        </div>
      </div>
    </div>
  )
}