import React, { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import { Calendar, Users, TrendingUp, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface CapacityViewProps {
  workspaceId: Id<"workspaces">
  projectId?: Id<"projects">
}

const CapacityView: React.FC<CapacityViewProps> = ({ workspaceId, projectId }) => {
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'quarter'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    switch (viewMode) {
      case 'week':
        start.setDate(start.getDate() - start.getDay())
        end.setDate(start.getDate() + 6)
        break
      case 'month':
        start.setDate(1)
        end.setMonth(end.getMonth() + 1, 0)
        break
      case 'quarter':
        const quarter = Math.floor(start.getMonth() / 3)
        start.setMonth(quarter * 3, 1)
        end.setMonth(quarter * 3 + 3, 0)
        break
    }

    return { start, end }
  }, [currentDate, viewMode])

  // Fetch data
  const users = useQuery(api.users.getWorkspaceUsers, { workspaceId })
  const teamCapacity = useQuery(api.resources.getTeamCapacity, {
    startDate: dateRange.start.getTime(),
    endDate: dateRange.end.getTime()
  })
  const allocations = useQuery(api.resources.getResourceAllocations, {
    projectId,
    startDate: dateRange.start.getTime(),
    endDate: dateRange.end.getTime()
  })
  const utilizationReport = useQuery(api.resources.getUtilizationReport, {
    workspaceId,
    startDate: dateRange.start.getTime(),
    endDate: dateRange.end.getTime(),
    groupBy: 'user'
  })

  // Navigate date range
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    const amount = direction === 'prev' ? -1 : 1

    switch (viewMode) {
      case 'week':
        newDate.setDate(newDate.getDate() + (7 * amount))
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + amount)
        break
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + (3 * amount))
        break
    }

    setCurrentDate(newDate)
  }

  // Generate calendar grid for month view
  const generateCalendarGrid = useMemo(() => {
    if (viewMode !== 'month') return []

    const grid = []
    const firstDay = new Date(dateRange.start)
    const lastDay = new Date(dateRange.end)
    const startPadding = firstDay.getDay()

    // Add padding days from previous month
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(firstDay)
      date.setDate(date.getDate() - (i + 1))
      grid.push({ date, isCurrentMonth: false })
    }

    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), day)
      grid.push({ date, isCurrentMonth: true })
    }

    // Add padding days from next month
    const endPadding = 42 - grid.length // 6 weeks * 7 days
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(lastDay)
      date.setDate(date.getDate() + i)
      grid.push({ date, isCurrentMonth: false })
    }

    return grid
  }, [dateRange, viewMode])

  // Calculate capacity for a specific date
  const getDateCapacity = (date: Date) => {
    if (!teamCapacity || !allocations) return null

    const dateTime = date.getTime()
    const dayAllocations = allocations.filter(a => 
      a.startDate <= dateTime && a.endDate >= dateTime
    )

    const totalCapacity = teamCapacity.reduce((sum, member) => 
      sum + member.availableHours, 0
    ) / 30 // Daily capacity

    const totalAllocated = dayAllocations.reduce((sum, a) => 
      sum + (a.allocation / 100 * 8), 0 // 8 hours per day
    )

    return {
      capacity: totalCapacity,
      allocated: totalAllocated,
      utilization: totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0
    }
  }

  // Format date range display
  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      year: 'numeric' 
    }

    switch (viewMode) {
      case 'week':
        return `${dateRange.start.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })} - ${dateRange.end.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })}`
      case 'month':
        return dateRange.start.toLocaleDateString('en-US', options)
      case 'quarter':
        const quarter = Math.floor(dateRange.start.getMonth() / 3) + 1
        return `Q${quarter} ${dateRange.start.getFullYear()}`
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Capacity Planning</h2>
          <p className="text-gray-600">Team availability and resource allocation</p>
        </div>
        <div className="flex gap-2">
          <BrutalButton
            variant={viewMode === 'week' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('week')}
            size="sm"
          >
            Week
          </BrutalButton>
          <BrutalButton
            variant={viewMode === 'month' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('month')}
            size="sm"
          >
            Month
          </BrutalButton>
          <BrutalButton
            variant={viewMode === 'quarter' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('quarter')}
            size="sm"
          >
            Quarter
          </BrutalButton>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <BrutalButton
          onClick={() => navigateDate('prev')}
          variant="secondary"
          icon={<ChevronLeft className="w-4 h-4" />}
          size="sm"
        />
        <h3 className="text-xl font-bold">{formatDateRange()}</h3>
        <BrutalButton
          onClick={() => navigateDate('next')}
          variant="secondary"
          icon={<ChevronRight className="w-4 h-4" />}
          size="sm"
        />
      </div>

      {/* Capacity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BrutalCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Capacity</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">
            {teamCapacity?.reduce((sum, m) => sum + m.availableHours, 0).toFixed(0) || 0}h
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {users?.length || 0} team members
          </div>
        </BrutalCard>

        <BrutalCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Allocated</span>
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">
            {teamCapacity?.reduce((sum, m) => sum + m.allocatedHours, 0).toFixed(0) || 0}h
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Across {allocations?.length || 0} allocations
          </div>
        </BrutalCard>

        <BrutalCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Utilization</span>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">
            {(() => {
              const total = teamCapacity?.reduce((sum, m) => sum + m.availableHours, 0) || 0
              const allocated = teamCapacity?.reduce((sum, m) => sum + m.allocatedHours, 0) || 0
              return total > 0 ? `${((allocated / total) * 100).toFixed(0)}%` : '0%'
            })()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Average across team
          </div>
        </BrutalCard>
      </div>

      {/* Calendar Grid (Month View) */}
      {viewMode === 'month' && (
        <BrutalCard className="p-6">
          <h3 className="text-xl font-bold mb-4">Capacity Calendar</h3>
          
          <div className="grid grid-cols-7 gap-px bg-gray-300">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-100 p-2 text-center font-bold text-sm">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {generateCalendarGrid.map(({ date, isCurrentMonth }, index) => {
              const capacity = getDateCapacity(date)
              const isToday = date.toDateString() === new Date().toDateString()
              
              return (
                <div
                  key={index}
                  className={`
                    bg-white p-2 min-h-[80px] border border-gray-200
                    ${!isCurrentMonth ? 'opacity-50' : ''}
                    ${isToday ? 'border-2 border-blue-500' : ''}
                  `}
                >
                  <div className="font-bold text-sm mb-1">
                    {date.getDate()}
                  </div>
                  
                  {capacity && isCurrentMonth && (
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600">
                        {capacity.allocated.toFixed(1)}h / {capacity.capacity.toFixed(1)}h
                      </div>
                      <div className="w-full bg-gray-200 h-1">
                        <div
                          className={`h-full ${
                            capacity.utilization > 100 ? 'bg-red-500' :
                            capacity.utilization > 80 ? 'bg-yellow-500' :
                            capacity.utilization > 60 ? 'bg-blue-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, capacity.utilization)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </BrutalCard>
      )}

      {/* Team Member Capacity */}
      <BrutalCard className="p-6">
        <h3 className="text-xl font-bold mb-4">Team Member Capacity</h3>
        
        <div className="space-y-3">
          {teamCapacity?.map(member => {
            const user = users?.find(u => u._id === member.userId)
            const utilization = member.availableHours > 0 
              ? (member.allocatedHours / member.availableHours) * 100 
              : 0
            
            return (
              <div key={member.userId} className="flex items-center justify-between p-3 border border-gray-300">
                <div className="flex-1">
                  <div className="font-medium">{user?.name || 'Unknown'}</div>
                  <div className="text-sm text-gray-600">
                    {member.allocatedHours.toFixed(1)}h / {member.availableHours.toFixed(1)}h
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <div className="w-full bg-gray-200 h-2">
                      <div
                        className={`h-full transition-all ${
                          utilization > 100 ? 'bg-red-500' :
                          utilization > 80 ? 'bg-yellow-500' :
                          utilization > 60 ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, utilization)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className={`px-2 py-1 rounded text-sm font-bold ${
                    utilization > 100 ? 'bg-red-100 text-red-700' :
                    utilization > 80 ? 'bg-yellow-100 text-yellow-700' :
                    utilization > 60 ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {utilization.toFixed(0)}%
                  </div>
                  
                  {utilization > 100 && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </BrutalCard>

      {/* Utilization Breakdown */}
      <BrutalCard className="p-6">
        <h3 className="text-xl font-bold mb-4">Utilization Breakdown</h3>
        
        {utilizationReport && (
          <div className="space-y-3">
            {utilizationReport.map(report => {
              const user = users?.find(u => u.clerkId === report.id)
              
              return (
                <div key={report.id} className="p-3 border border-gray-300">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{user?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-600">
                        {report.taskCount} tasks worked on
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{report.totalHours.toFixed(1)}h</div>
                      <div className="text-xs text-gray-600">Total logged</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Billable:</span>{' '}
                      <span className="font-medium text-green-600">
                        {report.billableHours.toFixed(1)}h
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Non-billable:</span>{' '}
                      <span className="font-medium text-gray-600">
                        {report.nonBillableHours.toFixed(1)}h
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rate:</span>{' '}
                      <span className="font-medium">
                        {report.utilizationRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </BrutalCard>
    </div>
  )
}

export default CapacityView