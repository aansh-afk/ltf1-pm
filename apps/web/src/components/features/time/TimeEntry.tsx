import React, { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalInput from '@/components/ui/BrutalInput'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalModal from '@/components/ui/BrutalModal'
import { Plus, Edit2, Trash2, Check, X, Clock, Calendar, DollarSign } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'

interface TimeEntryFormProps {
  taskId?: Id<"tasks">
  entryId?: Id<"timeEntries">
  onClose: () => void
  onSuccess?: () => void
}

export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  taskId,
  entryId,
  onClose,
  onSuccess
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | undefined>(taskId)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [description, setDescription] = useState('')
  const [billable, setBillable] = useState(true)
  const [loading, setLoading] = useState(false)

  // Get workspace context (you'll need to pass this or get from context)
  const workspaceId = 'workspace_id' as Id<"workspaces"> // TODO: Get from context

  // Get tasks for selection
  const tasks = useQuery(api.tasks.getTasksByWorkspace, { workspaceId })

  // Get existing entry if editing
  const existingEntry = useQuery(api.timeEntries.getTimeEntry,
    entryId ? { timeEntryId: entryId } : 'skip'
  )

  // Mutations
  const createEntry = useMutation(api.timeEntries.createManualEntry)
  const updateEntry = useMutation(api.timeEntries.updateTimeEntry)

  // Initialize form with existing entry
  React.useEffect(() => {
    if (existingEntry) {
      const startDate = new Date(existingEntry.startTime)
      const endDate = existingEntry.endTime ? new Date(existingEntry.endTime) : new Date()
      
      setSelectedTaskId(existingEntry.taskId)
      setDate(startDate.toISOString().split('T')[0])
      setStartTime(startDate.toTimeString().slice(0, 5))
      setEndTime(endDate.toTimeString().slice(0, 5))
      setDescription(existingEntry.description || '')
      setBillable(existingEntry.billable ?? true)
    }
  }, [existingEntry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTaskId) {
      alert('Please select a task')
      return
    }

    setLoading(true)

    try {
      // Parse date and times
      const startDateTime = new Date(`${date}T${startTime}:00`)
      const endDateTime = new Date(`${date}T${endTime}:00`)

      if (endDateTime <= startDateTime) {
        alert('End time must be after start time')
        setLoading(false)
        return
      }

      if (entryId) {
        // Update existing entry
        await updateEntry({
          timeEntryId: entryId,
          startTime: startDateTime.getTime(),
          endTime: endDateTime.getTime(),
          description: description || undefined,
          billable
        })
      } else {
        // Create new entry
        await createEntry({
          taskId: selectedTaskId,
          startTime: startDateTime.getTime(),
          endTime: endDateTime.getTime(),
          description: description || undefined,
          billable
        })
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to save time entry:', error)
      alert(error instanceof Error ? error.message : 'Failed to save time entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BrutalModal isOpen onClose={onClose} title={entryId ? 'Edit Time Entry' : 'Add Time Entry'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Task *</label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value as Id<"tasks">)}
            className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
            required
            disabled={!!taskId}
          >
            <option value="">Select a task...</option>
            {tasks?.map(task => (
              <option key={task._id} value={task._id}>
                #{task.number} - {task.title}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-2">Date *</label>
          <BrutalInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Time *</label>
            <BrutalInput
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Time *</label>
            <BrutalInput
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Duration Display */}
        <div className="p-3 bg-gray-100 border-2 border-black">
          <div className="text-sm text-gray-600">Duration</div>
          <div className="text-xl font-bold">
            {(() => {
              const start = new Date(`2000-01-01T${startTime}:00`)
              const end = new Date(`2000-01-01T${endTime}:00`)
              const diff = (end.getTime() - start.getTime()) / 3600000
              return diff > 0 ? `${diff.toFixed(2)} hours` : 'Invalid time range'
            })()}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you work on?"
            className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
            rows={3}
          />
        </div>

        {/* Billable */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={billable}
            onChange={(e) => setBillable(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium">Billable</span>
        </label>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <BrutalButton
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {entryId ? 'Update Entry' : 'Add Entry'}
          </BrutalButton>
          <BrutalButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </BrutalButton>
        </div>
      </form>
    </BrutalModal>
  )
}

interface TimesheetViewProps {
  userId?: string
  projectId?: Id<"projects">
  startDate?: Date
  endDate?: Date
}

export const TimesheetView: React.FC<TimesheetViewProps> = ({
  userId,
  projectId,
  startDate,
  endDate
}) => {
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Id<"timeEntries"> | null>(null)
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)
    return monday
  })

  const user = useUser()
  const currentUserId = userId || user?.user?.id

  // Get time entries
  const timeEntries = useQuery(api.timeEntries.getTimeEntriesByUser, 
    currentUserId ? {
      userId: currentUserId,
      startDate: startDate?.getTime(),
      endDate: endDate?.getTime()
    } : 'skip'
  )

  // Get tasks for display
  const tasks = useQuery(api.tasks.getTasksByUser,
    currentUserId ? { userId: currentUserId } : 'skip'
  )

  // Get time stats
  const timeStats = useQuery(api.timeEntries.getTimeStatsByUser,
    currentUserId ? {
      userId: currentUserId,
      startDate: startDate?.getTime(),
      endDate: endDate?.getTime()
    } : 'skip'
  )

  // Mutations
  const deleteEntry = useMutation(api.timeEntries.deleteTimeEntry)
  const approveEntries = useMutation(api.timeEntries.approveTimeEntries)

  // Group entries by day
  const entriesByDay = React.useMemo(() => {
    const grouped = new Map<string, typeof timeEntries>()
    
    timeEntries?.forEach(entry => {
      const date = new Date(entry.startTime).toDateString()
      const existing = grouped.get(date) || []
      grouped.set(date, [...existing, entry])
    })
    
    return grouped
  }, [timeEntries])

  // Calculate week days
  const weekDays = React.useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(selectedWeek)
      day.setDate(selectedWeek.getDate() + i)
      days.push(day)
    }
    return days
  }, [selectedWeek])

  const handleDeleteEntry = async (entryId: Id<"timeEntries">) => {
    if (!confirm('Are you sure you want to delete this time entry?')) {
      return
    }

    try {
      await deleteEntry({ timeEntryId: entryId })
    } catch (error) {
      console.error('Failed to delete entry:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete entry')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Timesheet</h2>
          {timeStats && (
            <div className="flex gap-6 mt-2 text-sm">
              <div>
                <span className="text-gray-600">Total:</span>{' '}
                <span className="font-bold">{timeStats.totalTime.toFixed(2)}h</span>
              </div>
              <div>
                <span className="text-gray-600">Billable:</span>{' '}
                <span className="font-bold text-green-600">
                  {timeStats.billableTime.toFixed(2)}h
                </span>
              </div>
              <div>
                <span className="text-gray-600">Approved:</span>{' '}
                <span className="font-bold text-blue-600">
                  {timeStats.approvedTime.toFixed(2)}h
                </span>
              </div>
            </div>
          )}
        </div>
        <BrutalButton
          onClick={() => setShowAddEntry(true)}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Entry
        </BrutalButton>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <BrutalButton
          onClick={() => {
            const newWeek = new Date(selectedWeek)
            newWeek.setDate(newWeek.getDate() - 7)
            setSelectedWeek(newWeek)
          }}
          variant="secondary"
          size="sm"
        >
          Previous Week
        </BrutalButton>
        <div className="text-lg font-medium">
          {selectedWeek.toLocaleDateString('en-US', { 
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })} - {
            new Date(selectedWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })
          }
        </div>
        <BrutalButton
          onClick={() => {
            const newWeek = new Date(selectedWeek)
            newWeek.setDate(newWeek.getDate() + 7)
            setSelectedWeek(newWeek)
          }}
          variant="secondary"
          size="sm"
        >
          Next Week
        </BrutalButton>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dayEntries = entriesByDay.get(day.toDateString()) || []
          const dayTotal = dayEntries.reduce((sum, entry) => 
            sum + (entry.duration || 0), 0
          ) / 3600000

          return (
            <BrutalCard
              key={day.toISOString()}
              className={`p-3 ${
                day.toDateString() === new Date().toDateString()
                  ? 'border-blue-500 border-2'
                  : ''
              }`}
            >
              <div className="space-y-2">
                <div className="font-bold text-sm">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-xs text-gray-600">
                  {day.toLocaleDateString('en-US', { 
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-lg font-bold">
                  {dayTotal.toFixed(2)}h
                </div>
                <div className="space-y-1">
                  {dayEntries.slice(0, 3).map(entry => {
                    const task = tasks?.find(t => t._id === entry.taskId)
                    return (
                      <div
                        key={entry._id}
                        className="text-xs p-1 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                        onClick={() => setEditingEntry(entry._id)}
                      >
                        <div className="font-medium truncate">
                          {task?.title || 'Unknown Task'}
                        </div>
                        <div className="text-gray-600">
                          {(entry.duration || 0) / 3600000}h
                        </div>
                      </div>
                    )
                  })}
                  {dayEntries.length > 3 && (
                    <div className="text-xs text-gray-600">
                      +{dayEntries.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </BrutalCard>
          )
        })}
      </div>

      {/* Detailed List */}
      <BrutalCard className="p-4">
        <h3 className="text-lg font-bold mb-4">Time Entries</h3>
        <div className="space-y-2">
          {timeEntries?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No time entries found
            </div>
          )}
          {timeEntries?.map(entry => {
            const task = tasks?.find(t => t._id === entry.taskId)
            const duration = (entry.duration || 0) / 3600000
            
            return (
              <div
                key={entry._id}
                className="flex items-center justify-between p-3 border border-gray-300 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {task?.title || 'Unknown Task'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(entry.startTime).toLocaleDateString()} • {duration.toFixed(2)}h
                    {entry.description && ` • ${entry.description}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {entry.billable && (
                    <DollarSign className="w-4 h-4 text-green-600" />
                  )}
                  {entry.approved && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                  <BrutalButton
                    onClick={() => setEditingEntry(entry._id)}
                    variant="secondary"
                    size="sm"
                    icon={<Edit2 className="w-4 h-4" />}
                  />
                  <BrutalButton
                    onClick={() => handleDeleteEntry(entry._id)}
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    disabled={entry.approved}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </BrutalCard>

      {/* Add/Edit Entry Modal */}
      {(showAddEntry || editingEntry) && (
        <TimeEntryForm
          entryId={editingEntry || undefined}
          onClose={() => {
            setShowAddEntry(false)
            setEditingEntry(null)
          }}
          onSuccess={() => {
            setShowAddEntry(false)
            setEditingEntry(null)
          }}
        />
      )}
    </div>
  )
}

export default TimesheetView