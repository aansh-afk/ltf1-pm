import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'
import MultiSelect from '../../ui/MultiSelect'
import {
  HiOutlineVideoCamera,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineUsers,
  HiOutlineTemplate,
  HiOutlineRefresh
} from 'react-icons/hi'

interface ScheduleMeetingModalProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string
  sprintId?: string
  workspaceId: string
  onSuccess?: () => void
}

const meetingTypes = [
  { value: 'standup', label: 'DAILY STANDUP', icon: '🏃', duration: 15 },
  { value: 'retrospective', label: 'RETROSPECTIVE', icon: '🔄', duration: 60 },
  { value: 'planning', label: 'SPRINT PLANNING', icon: '📋', duration: 120 },
  { value: 'review', label: 'SPRINT REVIEW', icon: '👥', duration: 60 },
  { value: 'custom', label: 'CUSTOM MEETING', icon: '⚙️', duration: 30 },
]

export default function ScheduleMeetingModal({ 
  isOpen, 
  onClose, 
  projectId,
  sprintId,
  workspaceId,
  onSuccess 
}: ScheduleMeetingModalProps) {
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'standup' | 'retrospective' | 'planning' | 'review' | 'custom'>('standup')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState(30)
  const [location, setLocation] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceFreq, setRecurrenceFreq] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  const [agenda, setAgenda] = useState<string[]>([''])
  const [isCreating, setIsCreating] = useState(false)

  const createMeeting = useMutation(api.meetings.mutations.createMeeting)
  const templates = useQuery(api.meetings.queries.getMeetingTemplates)
  
  // Get workspace members for attendee selection
  const workspaceMembers = useQuery(
    api.workspaces.queries.getWorkspaceMembers,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
  )

  // Auto-populate based on meeting type
  useEffect(() => {
    const selectedType = meetingTypes.find(t => t.value === type)
    const template = templates?.find(t => t.type === type)
    
    if (selectedType && template) {
      setTitle(template.title)
      setDuration(template.duration)
      setAgenda(template.agenda || [''])
      setIsRecurring(template.isRecurring)
      
      if (template.defaultRecurrence) {
        setRecurrenceFreq(template.defaultRecurrence.frequency)
        setRecurrenceInterval(template.defaultRecurrence.interval)
      }
    } else if (selectedType) {
      setTitle(selectedType.label)
      setDuration(selectedType.duration)
    }
  }, [type, templates])

  // Set default date/time
  useEffect(() => {
    if (isOpen && !startDate) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setStartDate(tomorrow.toISOString().split('T')[0])
      
      // Set default time based on meeting type
      const defaultTimes = {
        standup: '09:00',
        retrospective: '14:00',
        planning: '10:00',
        review: '15:00',
        custom: '14:00'
      }
      setStartTime(defaultTimes[type])
    }
  }, [isOpen, startDate, type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Meeting title is required')
      return
    }
    
    if (!startDate || !startTime) {
      toast.error('Start date and time are required')
      return
    }

    if (selectedAttendees.length === 0) {
      toast.error('At least one attendee is required')
      return
    }

    setIsCreating(true)
    
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`).getTime()
      const endDateTime = startDateTime + (duration * 60 * 1000)
      
      const recurrence = isRecurring ? {
        frequency: recurrenceFreq,
        interval: recurrenceInterval,
        endDate: recurrenceEndDate ? new Date(recurrenceEndDate).getTime() : undefined,
      } : undefined

      const template = {
        agenda: agenda.filter(item => item.trim()),
        duration,
        isRecurring,
      }

      await createMeeting({
        workspaceId: workspaceId as any,
        projectId: projectId ? projectId as any : undefined,
        sprintId: sprintId ? sprintId as any : undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        startTime: startDateTime,
        endTime: endDateTime,
        location: location.trim() || undefined,
        meetingUrl: meetingUrl.trim() || undefined,
        attendeeIds: selectedAttendees as any[],
        template,
        recurrence,
      })
      
      toast.success('Meeting scheduled successfully')
      onSuccess?.()
      onClose()
      resetForm()
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule meeting')
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setType('standup')
    setStartDate('')
    setStartTime('')
    setDuration(30)
    setLocation('')
    setMeetingUrl('')
    setSelectedAttendees([])
    setIsRecurring(false)
    setRecurrenceFreq('weekly')
    setRecurrenceInterval(1)
    setRecurrenceEndDate('')
    setAgenda([''])
  }

  const addAgendaItem = () => {
    setAgenda([...agenda, ''])
  }

  const updateAgendaItem = (index: number, value: string) => {
    const newAgenda = [...agenda]
    newAgenda[index] = value
    setAgenda(newAgenda)
  }

  const removeAgendaItem = (index: number) => {
    if (agenda.length > 1) {
      setAgenda(agenda.filter((_, i) => i !== index))
    }
  }

  const attendeeOptions = workspaceMembers?.map(member => ({
    value: member.user?._id || '',
    label: member.user?.name || 'Unknown User',
    avatar: member.user?.avatarUrl,
  })).filter(option => option.value) || []

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="SCHEDULE MEETING"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-24px">
        {/* Meeting Type Selection */}
        <div>
          <label className="block text-brutal-sm uppercase mb-12px">
            <HiOutlineTemplate className="inline w-16px h-16px mr-8px" />
            MEETING TYPE
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8px">
            {meetingTypes.map((meetingType) => (
              <button
                key={meetingType.value}
                type="button"
                onClick={() => setType(meetingType.value as 'standup' | 'retrospective' | 'planning' | 'review' | 'custom')}
                className={`p-12px border-2 text-center transition-colors ${
                  type === meetingType.value
                    ? 'bg-primary-brutalist border-primary-brutalist text-event-horizon'
                    : 'bg-event-horizon border-basalt-border text-cathode-white hover:border-primary-brutalist'
                }`}
              >
                <div className="text-lg mb-4px">{meetingType.icon}</div>
                <div className="font-mono text-brutal-xs uppercase">{meetingType.label}</div>
                <div className="font-mono text-brutal-xs text-cathode-white/60">{meetingType.duration}min</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title & Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16px">
          <div>
            <label className="block text-brutal-sm uppercase mb-8px">TITLE</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border 
                       font-mono text-brutal-sm focus:border-primary-brutalist focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-brutal-sm uppercase mb-8px">DURATION (MINUTES)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              min={5}
              max={480}
              className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border 
                       font-mono text-brutal-sm focus:border-primary-brutalist focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-brutal-sm uppercase mb-8px">DESCRIPTION</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border 
                     font-mono text-brutal-sm focus:border-primary-brutalist focus:outline-none resize-none"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16px">
          <div>
            <label className="block text-brutal-sm uppercase mb-8px">
              <HiOutlineCalendar className="inline w-16px h-16px mr-8px" />
              DATE
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border 
                       font-mono text-brutal-sm focus:border-primary-brutalist focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-brutal-sm uppercase mb-8px">
              <HiOutlineClock className="inline w-16px h-16px mr-8px" />
              TIME
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border 
                       font-mono text-brutal-sm focus:border-primary-brutalist focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Location & Meeting URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16px">
          <div>
            <label className="block text-brutal-sm uppercase mb-8px">
              <HiOutlineLocationMarker className="inline w-16px h-16px mr-8px" />
              LOCATION
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="CONFERENCE ROOM A"
              className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border 
                       font-mono text-brutal-sm placeholder:text-neutral-600
                       focus:border-primary-brutalist focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-brutal-sm uppercase mb-8px">
              <HiOutlineVideoCamera className="inline w-16px h-16px mr-8px" />
              MEETING URL
            </label>
            <input
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="HTTPS://MEET.GOOGLE.COM/..."
              className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border 
                       font-mono text-brutal-sm placeholder:text-neutral-600
                       focus:border-primary-brutalist focus:outline-none"
            />
          </div>
        </div>

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

        {/* Recurring Options */}
        <div>
          <label className="flex items-center gap-8px mb-16px">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-16px h-16px"
            />
            <HiOutlineRefresh className="w-16px h-16px" />
            <span className="text-brutal-sm uppercase">RECURRING MEETING</span>
          </label>
          
          {isRecurring && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16px p-16px bg-event-horizon border border-basalt-border">
              <div>
                <label className="block text-brutal-xs uppercase mb-8px">FREQUENCY</label>
                <select
                  value={recurrenceFreq}
                  onChange={(e) => setRecurrenceFreq(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="w-full px-12px py-8px bg-carbon-plate border border-basalt-border font-mono text-brutal-xs"
                >
                  <option value="daily">DAILY</option>
                  <option value="weekly">WEEKLY</option>
                  <option value="monthly">MONTHLY</option>
                </select>
              </div>
              <div>
                <label className="block text-brutal-xs uppercase mb-8px">INTERVAL</label>
                <input
                  type="number"
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                  min={1}
                  max={12}
                  className="w-full px-12px py-8px bg-carbon-plate border border-basalt-border font-mono text-brutal-xs"
                />
              </div>
              <div>
                <label className="block text-brutal-xs uppercase mb-8px">END DATE</label>
                <input
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  className="w-full px-12px py-8px bg-carbon-plate border border-basalt-border font-mono text-brutal-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Agenda */}
        <div>
          <label className="block text-brutal-sm uppercase mb-8px">AGENDA</label>
          <div className="space-y-8px">
            {agenda.map((item, index) => (
              <div key={index} className="flex gap-8px">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateAgendaItem(index, e.target.value)}
                  placeholder={`AGENDA ITEM ${index + 1}`}
                  className="flex-1 px-16px py-12px bg-event-horizon border-2 border-basalt-border 
                           font-mono text-brutal-sm placeholder:text-neutral-600
                           focus:border-primary-brutalist focus:outline-none"
                />
                {agenda.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAgendaItem(index)}
                    className="px-12px py-12px bg-brutal-error border-2 border-brutal-error text-white hover:bg-brutal-error/80"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addAgendaItem}
              className="w-full px-16px py-12px border-2 border-dashed border-basalt-border 
                       text-cathode-white/60 hover:text-cathode-white hover:border-primary-brutalist 
                       transition-colors font-mono text-brutal-sm"
            >
              + ADD AGENDA ITEM
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-16px justify-end pt-24px border-t-2 border-basalt-border">
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
            disabled={isCreating}
          >
            {isCreating ? 'SCHEDULING...' : 'SCHEDULE MEETING'}
          </button>
        </div>
      </form>
    </BrutalModal>
  )
}