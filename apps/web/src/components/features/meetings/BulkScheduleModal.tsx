import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'
import MultiSelect from '../../ui/MultiSelect'
import {
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineUsers,
  HiOutlineTemplate,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineExclamationCircle
} from 'react-icons/hi'
import clsx from 'clsx'

interface BulkScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  projectId?: string
  sprintId?: string
  onSuccess?: () => void
}

const meetingTemplates = [
  {
    id: 'sprint-ceremonies',
    name: 'SPRINT CEREMONIES',
    description: 'Complete set of Scrum ceremonies',
    meetings: [
      { type: 'planning', title: 'Sprint Planning', dayOfWeek: 1, time: '10:00', duration: 120 },
      { type: 'standup', title: 'Daily Standup', dayOfWeek: 'daily', time: '09:00', duration: 15 },
      { type: 'review', title: 'Sprint Review', dayOfWeek: 5, time: '14:00', duration: 60 },
      { type: 'retrospective', title: 'Sprint Retrospective', dayOfWeek: 5, time: '15:30', duration: 60 },
    ]
  },
  {
    id: 'daily-standup',
    name: 'DAILY STANDUPS',
    description: 'Daily team sync meetings',
    meetings: [
      { type: 'standup', title: 'Daily Standup', dayOfWeek: 'weekdays', time: '09:00', duration: 15 },
    ]
  },
  {
    id: 'weekly-sync',
    name: 'WEEKLY TEAM SYNC',
    description: 'Weekly team synchronization',
    meetings: [
      { type: 'custom', title: 'Team Sync', dayOfWeek: 1, time: '14:00', duration: 60 },
      { type: 'custom', title: 'Progress Review', dayOfWeek: 3, time: '14:00', duration: 30 },
      { type: 'custom', title: 'Planning Session', dayOfWeek: 5, time: '14:00', duration: 60 },
    ]
  }
]

export default function BulkScheduleModal({
  isOpen,
  onClose,
  workspaceId,
  projectId,
  sprintId,
  onSuccess
}: BulkScheduleModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [customMeetings, setCustomMeetings] = useState<any[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const createMeeting = useMutation(api.meetings.mutations.createMeeting)
  
  // Get workspace members for attendee selection
  const workspaceMembers = useQuery(
    api.workspaces.queries.getWorkspaceMembers,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
  )

  const attendeeOptions = workspaceMembers?.map(member => ({
    value: member.user?._id || '',
    label: member.user?.name || 'Unknown User',
    avatar: member.user?.avatarUrl,
  })).filter(option => option.value) || []

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = meetingTemplates.find(t => t.id === templateId)
    if (template) {
      setCustomMeetings(template.meetings.map(m => ({ ...m, id: Math.random() })))
    }
  }

  const addCustomMeeting = () => {
    setCustomMeetings([
      ...customMeetings,
      {
        id: Math.random(),
        type: 'custom',
        title: '',
        dayOfWeek: 1,
        time: '14:00',
        duration: 30
      }
    ])
  }

  const updateCustomMeeting = (id: number, field: string, value: any) => {
    setCustomMeetings(customMeetings.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ))
  }

  const removeCustomMeeting = (id: number) => {
    setCustomMeetings(customMeetings.filter(m => m.id !== id))
  }

  const calculateMeetingDates = () => {
    if (!startDate || !endDate) return []

    const meetings: any[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    customMeetings.forEach(meeting => {
      let current = new Date(start)

      while (current <= end) {
        let shouldAdd = false

        if (meeting.dayOfWeek === 'daily') {
          shouldAdd = true
        } else if (meeting.dayOfWeek === 'weekdays') {
          const day = current.getDay()
          shouldAdd = day >= 1 && day <= 5
        } else if (typeof meeting.dayOfWeek === 'number') {
          shouldAdd = current.getDay() === meeting.dayOfWeek
        }

        if (shouldAdd) {
          const [hours, minutes] = meeting.time.split(':').map(Number)
          const meetingStart = new Date(current)
          meetingStart.setHours(hours, minutes, 0, 0)
          
          meetings.push({
            ...meeting,
            startTime: meetingStart.getTime(),
            endTime: meetingStart.getTime() + (meeting.duration * 60 * 1000)
          })
        }

        current.setDate(current.getDate() + 1)
      }
    })

    return meetings
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startDate || !endDate) {
      toast.error('Please select date range')
      return
    }

    if (selectedAttendees.length === 0) {
      toast.error('Please select at least one attendee')
      return
    }

    if (customMeetings.length === 0) {
      toast.error('Please add at least one meeting')
      return
    }

    const invalidMeetings = customMeetings.filter(m => !m.title)
    if (invalidMeetings.length > 0) {
      toast.error('All meetings must have a title')
      return
    }

    setIsCreating(true)

    try {
      const meetings = calculateMeetingDates()
      
      for (const meeting of meetings) {
        await createMeeting({
          workspaceId: workspaceId as any,
          projectId: projectId ? projectId as any : undefined,
          sprintId: sprintId ? sprintId as any : undefined,
          title: meeting.title,
          type: meeting.type,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          attendeeIds: selectedAttendees as any[],
          recurrence: {
            frequency: meeting.dayOfWeek === 'daily' ? 'daily' : 'weekly',
            interval: 1,
            endDate: new Date(endDate).getTime()
          }
        })
      }

      toast.success(`Scheduled ${meetings.length} meetings`)
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule meetings')
    } finally {
      setIsCreating(false)
    }
  }

  const meetingCount = calculateMeetingDates().length

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="BULK SCHEDULE MEETINGS"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-24px">
        {/* Template Selection */}
        <div>
          <label className="block text-brutal-sm uppercase mb-12px">
            <HiOutlineTemplate className="inline w-16px h-16px mr-8px" />
            SELECT TEMPLATE
          </label>
          <div className="grid grid-cols-1 gap-8px">
            {meetingTemplates.map(template => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template.id)}
                className={clsx(
                  "p-16px border-2 text-left transition-colors",
                  selectedTemplate === template.id
                    ? 'bg-primary-brutalist border-primary-brutalist text-event-horizon'
                    : 'bg-[var(--theme-background)] border-[var(--theme-border)] hover:border-primary-brutalist'
                )}
              >
                <div className="font-mono text-brutal-sm uppercase mb-4px">{template.name}</div>
                <div className="font-mono text-brutal-xs opacity-80">{template.description}</div>
                <div className="font-mono text-brutal-xs mt-8px">
                  {template.meetings.length} MEETING{template.meetings.length > 1 ? 'S' : ''}
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setSelectedTemplate('custom')
                setCustomMeetings([])
              }}
              className={clsx(
                "p-16px border-2 text-left transition-colors",
                selectedTemplate === 'custom'
                  ? 'bg-primary-brutalist border-primary-brutalist text-event-horizon'
                  : 'bg-[var(--theme-background)] border-[var(--theme-border)] hover:border-primary-brutalist'
              )}
            >
              <div className="font-mono text-brutal-sm uppercase mb-4px">CUSTOM SCHEDULE</div>
              <div className="font-mono text-brutal-xs opacity-80">Create your own meeting schedule</div>
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-16px">
          <div>
            <label className="block text-brutal-sm uppercase mb-8px">
              <HiOutlineCalendar className="inline w-16px h-16px mr-8px" />
              START DATE
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm focus:border-primary-brutalist focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-brutal-sm uppercase mb-8px">
              <HiOutlineCalendar className="inline w-16px h-16px mr-8px" />
              END DATE
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full px-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm focus:border-primary-brutalist focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Meeting Configuration */}
        {(selectedTemplate || customMeetings.length > 0) && (
          <div>
            <label className="block text-brutal-sm uppercase mb-12px">
              <HiOutlineRefresh className="inline w-16px h-16px mr-8px" />
              MEETING SCHEDULE
            </label>
            <div className="space-y-8px max-h-300px overflow-y-auto">
              {customMeetings.map(meeting => (
                <div
                  key={meeting.id}
                  className="p-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)]"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-8px items-center">
                    <input
                      type="text"
                      value={meeting.title}
                      onChange={(e) => updateCustomMeeting(meeting.id, 'title', e.target.value)}
                      placeholder="MEETING TITLE"
                      className="px-12px py-8px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-brutal-xs placeholder:text-neutral-600 focus:border-primary-brutalist focus:outline-none"
                    />
                    <select
                      value={meeting.type}
                      onChange={(e) => updateCustomMeeting(meeting.id, 'type', e.target.value)}
                      className="px-12px py-8px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-brutal-xs focus:border-primary-brutalist focus:outline-none"
                    >
                      <option value="standup">STANDUP</option>
                      <option value="retrospective">RETROSPECTIVE</option>
                      <option value="planning">PLANNING</option>
                      <option value="review">REVIEW</option>
                      <option value="custom">CUSTOM</option>
                    </select>
                    <select
                      value={meeting.dayOfWeek}
                      onChange={(e) => updateCustomMeeting(meeting.id, 'dayOfWeek', 
                        e.target.value === 'daily' || e.target.value === 'weekdays' 
                          ? e.target.value 
                          : parseInt(e.target.value)
                      )}
                      className="px-12px py-8px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-brutal-xs focus:border-primary-brutalist focus:outline-none"
                    >
                      <option value="daily">DAILY</option>
                      <option value="weekdays">WEEKDAYS</option>
                      <option value="0">SUNDAY</option>
                      <option value="1">MONDAY</option>
                      <option value="2">TUESDAY</option>
                      <option value="3">WEDNESDAY</option>
                      <option value="4">THURSDAY</option>
                      <option value="5">FRIDAY</option>
                      <option value="6">SATURDAY</option>
                    </select>
                    <input
                      type="time"
                      value={meeting.time}
                      onChange={(e) => updateCustomMeeting(meeting.id, 'time', e.target.value)}
                      className="px-12px py-8px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-brutal-xs focus:border-primary-brutalist focus:outline-none"
                    />
                    <div className="flex items-center gap-4px">
                      <input
                        type="number"
                        value={meeting.duration}
                        onChange={(e) => updateCustomMeeting(meeting.id, 'duration', parseInt(e.target.value))}
                        min="5"
                        max="480"
                        className="w-60px px-8px py-8px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-brutal-xs focus:border-primary-brutalist focus:outline-none"
                      />
                      <span className="text-brutal-xs">MIN</span>
                      <button
                        type="button"
                        onClick={() => removeCustomMeeting(meeting.id)}
                        className="ml-auto p-4px hover:bg-brutal-error/20 transition-colors"
                      >
                        <HiOutlineTrash className="w-16px h-16px text-brutal-error" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addCustomMeeting}
                className="w-full p-12px border-2 border-dashed border-[var(--theme-border)] text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] hover:border-primary-brutalist transition-colors font-mono text-brutal-sm"
              >
                <HiOutlinePlus className="inline w-16px h-16px mr-8px" />
                ADD MEETING
              </button>
            </div>
          </div>
        )}

        {/* Attendees */}
        <div>
          <label className="block text-brutal-sm uppercase mb-8px">
            <HiOutlineUsers className="inline w-16px h-16px mr-8px" />
            ATTENDEES
          </label>
          <MultiSelect
            options={attendeeOptions}
            value={selectedAttendees}
            onChange={setSelectedAttendees}
            placeholder="SELECT TEAM MEMBERS"
          />
        </div>

        {/* Summary */}
        {meetingCount > 0 && (
          <div className="bg-[var(--theme-background)] border-2 border-primary-brutalist p-16px">
            <div className="flex items-center gap-8px text-brutal-sm">
              <HiOutlineExclamationCircle className="w-20px h-20px text-primary-brutalist" />
              <span className="font-mono uppercase">
                THIS WILL CREATE {meetingCount} MEETING{meetingCount > 1 ? 'S' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-16px justify-end pt-24px border-t-2 border-[var(--theme-border)]">
          <button
            type="button"
            onClick={onClose}
            className="brutal-btn-secondary"
            disabled={isCreating}
          >
            CANCEL
          </button>
          <button
            type="submit"
            className="brutal-btn"
            disabled={isCreating || meetingCount === 0}
          >
            {isCreating ? `CREATING ${meetingCount} MEETINGS...` : `SCHEDULE ${meetingCount} MEETING${meetingCount !== 1 ? 'S' : ''}`}
          </button>
        </div>
      </form>
    </BrutalModal>
  )
}