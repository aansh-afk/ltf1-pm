import { useReducer } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import toast from 'react-hot-toast'
import BrutalModal from '@/components/ui/BrutalModal'
import BrutalSelect from '@/components/ui/BrutalSelect'
import MultiSelect from '@/components/ui/MultiSelect'
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

// --- Sub-components ---

interface BulkMeetingItem {
  id: number
  type: string
  title: string
  dayOfWeek: number | string
  time: string
  duration: number
}

interface CalculatedMeetingItem extends BulkMeetingItem {
  startTime: number
  endTime: number
}

interface MeetingScheduleItemRowProps {
  meeting: BulkMeetingItem
  onUpdateField: (id: number, field: string, value: string | number) => void
  onRemove: (id: number) => void
}

function MeetingScheduleItemRow({ meeting, onUpdateField, onRemove }: MeetingScheduleItemRowProps) {
  return (
    <div
      className="p-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]"
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-[4px] items-center">
        <input
          type="text"
          value={meeting.title}
          onChange={(e) => onUpdateField(meeting.id, 'title', e.target.value)}
          placeholder="MEETING TITLE"
          aria-label="Meeting title"
          className="px-[8px] py-[4px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-brutal-xs placeholder:text-neutral-600 focus:border-primary-brutalist focus:outline-none"
        />
        <BrutalSelect
          value={meeting.type}
          onChange={(v) => onUpdateField(meeting.id, 'type', v)}
          options={[
            { value: 'standup', label: 'STANDUP' },
            { value: 'retrospective', label: 'RETROSPECTIVE' },
            { value: 'planning', label: 'PLANNING' },
            { value: 'review', label: 'REVIEW' },
            { value: 'custom', label: 'CUSTOM' },
          ]}
          compact
        />
        <BrutalSelect
          value={String(meeting.dayOfWeek)}
          onChange={(v) => onUpdateField(
            meeting.id,
            'dayOfWeek',
            v === 'daily' || v === 'weekdays'
              ? v
              : parseInt(v)
          )}
          options={[
            { value: 'daily', label: 'DAILY' },
            { value: 'weekdays', label: 'WEEKDAYS' },
            { value: '0', label: 'SUNDAY' },
            { value: '1', label: 'MONDAY' },
            { value: '2', label: 'TUESDAY' },
            { value: '3', label: 'WEDNESDAY' },
            { value: '4', label: 'THURSDAY' },
            { value: '5', label: 'FRIDAY' },
            { value: '6', label: 'SATURDAY' },
          ]}
          compact
        />
        <input
          type="time"
          value={meeting.time}
          onChange={(e) => onUpdateField(meeting.id, 'time', e.target.value)}
          aria-label="Meeting time"
          className="px-[8px] py-[4px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-brutal-xs focus:border-primary-brutalist focus:outline-none"
        />
        <div className="flex items-center gap-4px">
          <input
            type="number"
            value={meeting.duration}
            onChange={(e) => onUpdateField(meeting.id, 'duration', parseInt(e.target.value))}
            min="5"
            max="480"
            aria-label="Duration in minutes"
            className="w-60px px-[4px] py-[4px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-brutal-xs focus:border-primary-brutalist focus:outline-none"
          />
          <span className="text-brutal-xs">MIN</span>
          <button
            type="button"
            onClick={() => onRemove(meeting.id)}
            className="ml-auto p-4px hover:bg-brutal-error/20 transition-colors"
          >
            <HiOutlineTrash className="w-16px h-16px text-brutal-error" />
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Main component ---

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

type BulkScheduleState = {
  selectedTemplate: string | null
  customMeetings: BulkMeetingItem[]
  startDate: string
  endDate: string
  selectedAttendees: string[]
  isCreating: boolean
}

type BulkScheduleAction =
  | { type: 'SET_TEMPLATE'; value: string | null }
  | { type: 'SET_CUSTOM_MEETINGS'; value: BulkMeetingItem[] }
  | { type: 'ADD_CUSTOM_MEETING' }
  | { type: 'UPDATE_CUSTOM_MEETING'; id: number; field: string; value: string | number }
  | { type: 'REMOVE_CUSTOM_MEETING'; id: number }
  | { type: 'SET_START_DATE'; value: string }
  | { type: 'SET_END_DATE'; value: string }
  | { type: 'SET_SELECTED_ATTENDEES'; value: string[] }
  | { type: 'SET_IS_CREATING'; value: boolean }

const initialBulkScheduleState: BulkScheduleState = {
  selectedTemplate: null,
  customMeetings: [],
  startDate: '',
  endDate: '',
  selectedAttendees: [],
  isCreating: false,
}

function bulkScheduleReducer(state: BulkScheduleState, action: BulkScheduleAction): BulkScheduleState {
  switch (action.type) {
    case 'SET_TEMPLATE':
      return { ...state, selectedTemplate: action.value }
    case 'SET_CUSTOM_MEETINGS':
      return { ...state, customMeetings: action.value }
    case 'ADD_CUSTOM_MEETING':
      return {
        ...state,
        customMeetings: [
          ...state.customMeetings,
          { id: Math.random(), type: 'custom', title: '', dayOfWeek: 1, time: '14:00', duration: 30 }
        ]
      }
    case 'UPDATE_CUSTOM_MEETING':
      return {
        ...state,
        customMeetings: state.customMeetings.map(m =>
          m.id === action.id ? { ...m, [action.field]: action.value } : m
        )
      }
    case 'REMOVE_CUSTOM_MEETING':
      return {
        ...state,
        customMeetings: state.customMeetings.filter(m => m.id !== action.id)
      }
    case 'SET_START_DATE':
      return { ...state, startDate: action.value }
    case 'SET_END_DATE':
      return { ...state, endDate: action.value }
    case 'SET_SELECTED_ATTENDEES':
      return { ...state, selectedAttendees: action.value }
    case 'SET_IS_CREATING':
      return { ...state, isCreating: action.value }
    default:
      return state
  }
}

export default function BulkScheduleModal({
  isOpen,
  onClose,
  workspaceId,
  projectId,
  sprintId,
  onSuccess
}: BulkScheduleModalProps) {
  const [state, dispatch] = useReducer(bulkScheduleReducer, initialBulkScheduleState)
  const { selectedTemplate, customMeetings, startDate, endDate, selectedAttendees, isCreating } = state

  const createMeeting = useMutation(api.meetings.mutations.createMeeting)

  // Get workspace members for attendee selection
  const workspaceMembers = useQuery(
    api.workspaces.queries.getWorkspaceMembers,
    workspaceId ? { workspaceId: workspaceId as Id<"workspaces"> } : 'skip'
  )

  const attendeeOptions = workspaceMembers?.map(member => ({
    value: member.user?._id || '',
    label: member.user?.name || 'Unknown User',
    avatar: member.user?.avatarUrl,
  })).filter(option => option.value) || []

  const handleTemplateSelect = (templateId: string) => {
    dispatch({ type: 'SET_TEMPLATE', value: templateId })
    const template = meetingTemplates.find(t => t.id === templateId)
    if (template) {
      dispatch({ type: 'SET_CUSTOM_MEETINGS', value: template.meetings.map(m => ({ ...m, id: Math.random() })) })
    }
  }

  const calculateMeetingDates = () => {
    if (!startDate || !endDate) return []

    const meetings: CalculatedMeetingItem[] = []
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

    dispatch({ type: 'SET_IS_CREATING', value: true })

    try {
      const meetings = calculateMeetingDates()

      for (const meeting of meetings) {
        await createMeeting({
          workspaceId: workspaceId as Id<"workspaces">,
          projectId: projectId ? projectId as Id<"projects"> : undefined,
          sprintId: sprintId ? sprintId as Id<"sprints"> : undefined,
          title: meeting.title,
          type: meeting.type as 'standup' | 'retrospective' | 'planning' | 'review' | 'custom',
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          attendeeIds: selectedAttendees as Id<"users">[],
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
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to schedule meetings')
    } finally {
      dispatch({ type: 'SET_IS_CREATING', value: false })
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
      <form onSubmit={handleSubmit} className="space-y-[12px]">
        {/* Template Selection */}
        <div>
          <span className="block text-brutal-sm uppercase mb-[6px]">
            <HiOutlineTemplate className="inline w-16px h-16px mr-[4px]" />
            SELECT TEMPLATE
          </span>
          <div className="grid grid-cols-1 gap-[4px]">
            {meetingTemplates.map(template => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template.id)}
                className={clsx(
                  "p-[10px] border-2 text-left transition-colors",
                  selectedTemplate === template.id
                    ? 'bg-primary-brutalist border-primary-brutalist text-event-horizon'
                    : 'bg-[var(--theme-background)] border-[var(--theme-border)] hover:border-primary-brutalist'
                )}
              >
                <div className="font-mono text-brutal-sm uppercase mb-[2px]">{template.name}</div>
                <div className="font-mono text-brutal-xs opacity-80">{template.description}</div>
                <div className="font-mono text-brutal-xs mt-[4px]">
                  {template.meetings.length} MEETING{template.meetings.length > 1 ? 'S' : ''}
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'SET_TEMPLATE', value: 'custom' })
                dispatch({ type: 'SET_CUSTOM_MEETINGS', value: [] })
              }}
              className={clsx(
                "p-[10px] border-2 text-left transition-colors",
                selectedTemplate === 'custom'
                  ? 'bg-primary-brutalist border-primary-brutalist text-event-horizon'
                  : 'bg-[var(--theme-background)] border-[var(--theme-border)] hover:border-primary-brutalist'
              )}
            >
              <div className="font-mono text-brutal-sm uppercase mb-[2px]">CUSTOM SCHEDULE</div>
              <div className="font-mono text-brutal-xs opacity-80">Create your own meeting schedule</div>
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-[10px]">
          <div>
            <label htmlFor="bulk-schedule-start-date" className="block text-brutal-sm uppercase mb-[4px]">
              <HiOutlineCalendar className="inline w-16px h-16px mr-[4px]" />
              START DATE
            </label>
            <input
              id="bulk-schedule-start-date"
              type="date"
              value={startDate}
              onChange={(e) => dispatch({ type: 'SET_START_DATE', value: e.target.value })}
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm focus:border-primary-brutalist focus:outline-none"
              required
            />
          </div>
          <div>
            <label htmlFor="bulk-schedule-end-date" className="block text-brutal-sm uppercase mb-[4px]">
              <HiOutlineCalendar className="inline w-16px h-16px mr-[4px]" />
              END DATE
            </label>
            <input
              id="bulk-schedule-end-date"
              type="date"
              value={endDate}
              onChange={(e) => dispatch({ type: 'SET_END_DATE', value: e.target.value })}
              min={startDate}
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm focus:border-primary-brutalist focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Meeting Configuration */}
        {(selectedTemplate || customMeetings.length > 0) && (
          <div>
            <span className="block text-brutal-sm uppercase mb-[6px]">
              <HiOutlineRefresh className="inline w-16px h-16px mr-[4px]" />
              MEETING SCHEDULE
            </span>
            <div className="space-y-[4px] max-h-300px overflow-y-auto">
              {customMeetings.map(meeting => (
                <MeetingScheduleItemRow
                  key={meeting.id}
                  meeting={meeting}
                  onUpdateField={(id, field, value) => dispatch({ type: 'UPDATE_CUSTOM_MEETING', id, field, value })}
                  onRemove={(id) => dispatch({ type: 'REMOVE_CUSTOM_MEETING', id })}
                />
              ))}
              <button
                type="button"
                onClick={() => dispatch({ type: 'ADD_CUSTOM_MEETING' })}
                className="w-full p-[8px] border-2 border-dashed border-[var(--theme-border)] text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] hover:border-primary-brutalist transition-colors font-mono text-brutal-sm"
              >
                <HiOutlinePlus className="inline w-16px h-16px mr-[4px]" />
                ADD MEETING
              </button>
            </div>
          </div>
        )}

        {/* Attendees */}
        <div>
          <span className="block text-brutal-sm uppercase mb-[4px]">
            <HiOutlineUsers className="inline w-16px h-16px mr-[4px]" />
            ATTENDEES
          </span>
          <MultiSelect
            options={attendeeOptions}
            value={selectedAttendees}
            onChange={(ids) => dispatch({ type: 'SET_SELECTED_ATTENDEES', value: ids })}
            placeholder="SELECT TEAM MEMBERS"
          />
        </div>

        {/* Summary */}
        {meetingCount > 0 && (
          <div className="bg-[var(--theme-background)] border-2 border-primary-brutalist p-[10px]">
            <div className="flex items-center gap-[4px] text-brutal-sm">
              <HiOutlineExclamationCircle className="w-20px h-20px text-primary-brutalist" />
              <span className="font-mono uppercase">
                THIS WILL CREATE {meetingCount} MEETING{meetingCount > 1 ? 'S' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-[10px] justify-end pt-[12px] border-t-2 border-[var(--theme-border)]">
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
