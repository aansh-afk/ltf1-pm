import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isSameDay, addDays, addWeeks, addMonths, subMonths, differenceInMinutes } from 'date-fns'
import { 
  HiOutlineCalendar, 
  HiOutlineViewList, 
  HiOutlineViewGrid,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCheck,
  HiOutlineX
} from 'react-icons/hi'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useShortcut } from '../contexts/ShortcutContext'
import MeetingCard from '../components/features/meetings/MeetingCard'
import ScheduleMeetingModal from '../components/features/meetings/ScheduleMeetingModal'
import MeetingDetailsModal from '../components/features/meetings/MeetingDetailsModal'
import MeetingNotesModal from '../components/features/meetings/MeetingNotesModal'
import BulkScheduleModal from '../components/features/meetings/BulkScheduleModal'
import toast from 'react-hot-toast'
import clsx from 'clsx'

type ViewMode = 'calendar' | 'list' | 'dashboard'
type CalendarView = 'month' | 'week' | 'day'
type MeetingFilter = {
  type?: string
  status?: string
  project?: string
  search?: string
  dateRange?: { start: Date; end: Date }
}

const meetingTypeColors = {
  standup: 'bg-brutal-info border-brutal-info',
  retrospective: 'bg-brutal-warning border-brutal-warning',
  planning: 'bg-primary-brutalist border-primary-brutalist',
  review: 'bg-brutal-success border-brutal-success',
  custom: 'bg-neutral-600 border-neutral-600',
}

export default function MeetingsPage() {
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('meetings-view', 'calendar')
  const [calendarView, setCalendarView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filters, setFilters] = useState<MeetingFilter>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMeetings, setSelectedMeetings] = useState<Set<string>>(new Set())
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showBulkScheduleModal, setShowBulkScheduleModal] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<any>(null)
  const [viewingMeeting, setViewingMeeting] = useState<any>(null)
  const [notesModalMeeting, setNotesModalMeeting] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Get current workspace (simplified - you should get this from context/props)
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)
  const currentWorkspace = workspaces?.[0]

  // Get user info
  const currentUser = useQuery(api.auth.users.getCurrentUser)

  // Date range for queries
  const dateRange = useMemo(() => {
    if (filters.dateRange) return filters.dateRange

    switch (calendarView) {
      case 'month':
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        }
      case 'week':
        return {
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate)
        }
      case 'day':
        return {
          start: new Date(currentDate.setHours(0, 0, 0, 0)),
          end: new Date(currentDate.setHours(23, 59, 59, 999))
        }
      default:
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        }
    }
  }, [currentDate, calendarView, filters.dateRange])

  // Query meetings
  const meetings = useQuery(
    api.meetings.queries.getUserMeetings,
    currentWorkspace?._id ? {
      workspaceId: currentWorkspace._id,
      startDate: dateRange.start.getTime(),
      endDate: dateRange.end.getTime()
    } : 'skip'
  )

  const upcomingMeetings = useQuery(
    api.meetings.queries.getUpcomingMeetings,
    currentWorkspace?._id ? {
      workspaceId: currentWorkspace._id,
      limit: 5
    } : 'skip'
  )

  // Mutations
  const deleteMeeting = useMutation(api.meetings.mutations.deleteMeeting)
  const respondToMeeting = useMutation(api.meetings.mutations.respondToMeeting)

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    if (!meetings) return []

    return meetings.filter(meeting => {
      if (filters.type && meeting.type !== filters.type) return false
      if (filters.project && meeting.projectId !== filters.project) return false
      if (searchQuery && !meeting.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [meetings, filters, searchQuery])

  // Group meetings by date for list view
  const groupedMeetings = useMemo(() => {
    const groups = new Map<string, any[]>()
    
    filteredMeetings.forEach(meeting => {
      const date = format(new Date(meeting.startTime), 'yyyy-MM-dd')
      if (!groups.has(date)) {
        groups.set(date, [])
      }
      groups.get(date)!.push(meeting)
    })

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, meetings]) => ({
        date,
        meetings: meetings.sort((a, b) => a.startTime - b.startTime)
      }))
  }, [filteredMeetings])

  // Calendar helpers
  const getCalendarDays = useCallback(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const startWeek = startOfWeek(start)
    const endWeek = endOfWeek(end)

    const days = []
    let day = startWeek
    while (day <= endWeek) {
      days.push(new Date(day))
      day = addDays(day, 1)
    }
    return days
  }, [currentDate])

  const getMeetingsForDay = useCallback((date: Date) => {
    return filteredMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime)
      return isSameDay(date, meetingDate)
    })
  }, [filteredMeetings])

  // Navigation
  const navigateCalendar = (direction: 'prev' | 'next') => {
    switch (calendarView) {
      case 'month':
        setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
        break
      case 'week':
        setCurrentDate(direction === 'prev' ? addWeeks(currentDate, -1) : addWeeks(currentDate, 1))
        break
      case 'day':
        setCurrentDate(direction === 'prev' ? addDays(currentDate, -1) : addDays(currentDate, 1))
        break
    }
  }

  const handleBulkDelete = async () => {
    if (selectedMeetings.size === 0) return

    if (!confirm(`Delete ${selectedMeetings.size} meetings?`)) return

    try {
      for (const meetingId of selectedMeetings) {
        await deleteMeeting({ meetingId: meetingId as any })
      }
      toast.success(`Deleted ${selectedMeetings.size} meetings`)
      setSelectedMeetings(new Set())
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete meetings')
    }
  }

  const handleQuickRSVP = async (meetingId: string, status: 'accepted' | 'declined' | 'tentative') => {
    try {
      await respondToMeeting({ meetingId: meetingId as any, status })
      toast.success(`Meeting ${status}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to respond')
    }
  }

  // Keyboard shortcuts integration
  useEffect(() => {
    const handleCommand = (event: CustomEvent) => {
      const { command } = event.detail
      
      switch (command) {
        case 'toggleCalendarView':
          // Cycle through view modes
          const modes: ViewMode[] = ['calendar', 'list', 'dashboard']
          const currentIndex = modes.indexOf(viewMode)
          const nextIndex = (currentIndex + 1) % modes.length
          setViewMode(modes[nextIndex])
          break
        
        case 'calendarToday':
          setCurrentDate(new Date())
          break
        
        case 'calendarNext':
          navigateCalendar('next')
          break
        
        case 'calendarPrevious':
          navigateCalendar('prev')
          break
        
        case 'joinMeeting':
          // Join the next upcoming meeting if exists
          if (upcomingMeetings && upcomingMeetings.length > 0) {
            const nextMeeting = upcomingMeetings[0]
            if (nextMeeting.meetingLink) {
              window.open(nextMeeting.meetingLink, '_blank')
              toast.success('Joining meeting...')
            } else {
              toast.error('No meeting link available')
            }
          } else {
            toast.error('No upcoming meetings')
          }
          break
        
        case 'rsvpMeeting':
          // RSVP to the next meeting requiring response
          if (upcomingMeetings && upcomingMeetings.length > 0) {
            const needsResponse = upcomingMeetings.find((m: any) => {
              const userAttendee = m.attendees?.find((a: any) => a.userId === currentUser?._id)
              return userAttendee && userAttendee.status === 'pending'
            })
            if (needsResponse) {
              setViewingMeeting(needsResponse)
            } else {
              toast.error('No meetings require RSVP')
            }
          }
          break
      }
    }
    
    const handleNewMeeting = () => {
      setShowScheduleModal(true)
    }
    
    window.addEventListener('meeting-command' as any, handleCommand)
    window.addEventListener('open-new-meeting' as any, handleNewMeeting)
    
    return () => {
      window.removeEventListener('meeting-command' as any, handleCommand)
      window.removeEventListener('open-new-meeting' as any, handleNewMeeting)
    }
  }, [viewMode, upcomingMeetings, currentUser])

  // Use specific shortcuts
  useShortcut('newMeeting', () => setShowScheduleModal(true))

  // Statistics for dashboard
  const stats = useMemo(() => {
    if (!meetings) return null

    const now = Date.now()
    const upcomingCount = meetings.filter(m => m.startTime > now).length
    const todayCount = meetings.filter(m => isToday(new Date(m.startTime))).length
    const totalMinutes = meetings.reduce((acc, m) => acc + differenceInMinutes(new Date(m.endTime), new Date(m.startTime)), 0)
    const acceptedCount = meetings.filter(m => {
      const userAttendee = m.attendees?.find((a: any) => a.userId === currentUser?._id)
      return userAttendee?.status === 'accepted'
    }).length

    return {
      upcoming: upcomingCount,
      today: todayCount,
      totalHours: Math.round(totalMinutes / 60),
      acceptanceRate: meetings.length > 0 ? Math.round((acceptedCount / meetings.length) * 100) : 0
    }
  }, [meetings, currentUser])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-[var(--theme-background)] border-b-2 border-[var(--theme-border)] p-16px">
        <div className="flex items-center justify-between mb-16px">
          <div className="flex items-center gap-16px">
            <h1 className="text-2xl font-mono uppercase">Meetings</h1>
            
            {/* View Toggle */}
            <div className="flex items-center gap-4px bg-[var(--theme-background-secondary)]">
              <button
                onClick={() => setViewMode('calendar')}
                className={clsx(
                  "px-12px py-8px font-mono text-brutal-xs uppercase transition-colors",
                  viewMode === 'calendar' ? 'bg-primary-brutalist text-event-horizon' : 'hover:bg-primary-brutalist/20'
                )}
              >
                <HiOutlineCalendar className="w-16px h-16px" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  "px-12px py-8px font-mono text-brutal-xs uppercase transition-colors",
                  viewMode === 'list' ? 'bg-primary-brutalist text-event-horizon' : 'hover:bg-primary-brutalist/20'
                )}
              >
                <HiOutlineViewList className="w-16px h-16px" />
              </button>
              <button
                onClick={() => setViewMode('dashboard')}
                className={clsx(
                  "px-12px py-8px font-mono text-brutal-xs uppercase transition-colors",
                  viewMode === 'dashboard' ? 'bg-primary-brutalist text-event-horizon' : 'hover:bg-primary-brutalist/20'
                )}
              >
                <HiOutlineViewGrid className="w-16px h-16px" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-12px">
            {/* Search */}
            <div className="relative">
              <HiOutlineSearch className="absolute left-12px top-1/2 -translate-y-1/2 w-16px h-16px text-[var(--theme-foreground)]/60" />
              <input
                type="text"
                placeholder="SEARCH MEETINGS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="brutal-input pl-36px w-200px"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                "brutal-btn-sm",
                showFilters && "bg-primary-brutalist text-event-horizon"
              )}
            >
              <HiOutlineFilter className="w-16px h-16px" />
            </button>

            {/* Bulk Actions */}
            {selectedMeetings.size > 0 && (
              <div className="flex items-center gap-8px">
                <span className="text-brutal-xs text-[var(--theme-foreground)]/60">
                  {selectedMeetings.size} SELECTED
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="brutal-btn-sm bg-brutal-error"
                >
                  DELETE
                </button>
                <button
                  onClick={() => setSelectedMeetings(new Set())}
                  className="brutal-btn-sm"
                >
                  CLEAR
                </button>
              </div>
            )}

            {/* New Meeting */}
            <button
              onClick={() => setShowScheduleModal(true)}
              className="brutal-btn-primary"
            >
              <HiOutlinePlus className="w-16px h-16px mr-8px" />
              NEW MEETING
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex items-center gap-12px py-12px border-t border-[var(--theme-border)]">
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
              className="brutal-select"
            >
              <option value="">ALL TYPES</option>
              <option value="standup">STANDUP</option>
              <option value="retrospective">RETROSPECTIVE</option>
              <option value="planning">PLANNING</option>
              <option value="review">REVIEW</option>
              <option value="custom">CUSTOM</option>
            </select>

            <button
              onClick={() => setFilters({})}
              className="brutal-btn-sm"
            >
              CLEAR FILTERS
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'calendar' && (
          <CalendarView
            currentDate={currentDate}
            calendarView={calendarView}
            setCalendarView={setCalendarView}
            navigateCalendar={navigateCalendar}
            getCalendarDays={getCalendarDays}
            getMeetingsForDay={getMeetingsForDay}
            onMeetingClick={setViewingMeeting}
            setCurrentDate={setCurrentDate}
          />
        )}

        {viewMode === 'list' && (
          <ListView
            groupedMeetings={groupedMeetings}
            currentUserId={currentUser?._id}
            selectedMeetings={selectedMeetings}
            setSelectedMeetings={setSelectedMeetings}
            onEdit={setEditingMeeting}
            onViewNotes={setNotesModalMeeting}
            onView={setViewingMeeting}
          />
        )}

        {viewMode === 'dashboard' && (
          <DashboardView
            stats={stats}
            upcomingMeetings={upcomingMeetings || []}
            onMeetingClick={setViewingMeeting}
            onQuickRSVP={handleQuickRSVP}
          />
        )}
      </div>

      {/* Modals */}
      {showScheduleModal && currentWorkspace && (
        <ScheduleMeetingModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          workspaceId={currentWorkspace._id}
          onSuccess={() => {
            setShowScheduleModal(false)
            toast.success('Meeting scheduled')
          }}
        />
      )}

      {editingMeeting && currentWorkspace && (
        <ScheduleMeetingModal
          isOpen={!!editingMeeting}
          onClose={() => setEditingMeeting(null)}
          workspaceId={currentWorkspace._id}
          meeting={editingMeeting}
          onSuccess={() => {
            setEditingMeeting(null)
            toast.success('Meeting updated')
          }}
        />
      )}

      {viewingMeeting && (
        <MeetingDetailsModal
          isOpen={!!viewingMeeting}
          onClose={() => setViewingMeeting(null)}
          meeting={viewingMeeting}
          currentUserId={currentUser?._id}
          onEdit={() => {
            setEditingMeeting(viewingMeeting)
            setViewingMeeting(null)
          }}
          onViewNotes={() => {
            setNotesModalMeeting(viewingMeeting)
            setViewingMeeting(null)
          }}
        />
      )}

      {notesModalMeeting && (
        <MeetingNotesModal
          isOpen={!!notesModalMeeting}
          onClose={() => setNotesModalMeeting(null)}
          meeting={notesModalMeeting}
          currentUserId={currentUser?._id}
        />
      )}

      {showBulkScheduleModal && currentWorkspace && (
        <BulkScheduleModal
          isOpen={showBulkScheduleModal}
          onClose={() => setShowBulkScheduleModal(false)}
          workspaceId={currentWorkspace._id}
          onSuccess={() => {
            setShowBulkScheduleModal(false)
            toast.success('Recurring meetings scheduled')
          }}
        />
      )}
    </div>
  )
}

// Calendar View Component
function CalendarView({ 
  currentDate, 
  calendarView, 
  setCalendarView, 
  navigateCalendar, 
  getCalendarDays,
  getMeetingsForDay,
  onMeetingClick,
  setCurrentDate
}: any) {
  const days = getCalendarDays()
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  return (
    <div className="h-full flex flex-col bg-[var(--theme-background-secondary)]">
      {/* Calendar Header */}
      <div className="bg-[var(--theme-background)] border-b-2 border-[var(--theme-border)] p-16px flex items-center justify-between">
        <div className="flex items-center gap-16px">
          <div className="flex items-center gap-8px">
            <button
              onClick={() => navigateCalendar('prev')}
              className="brutal-btn-sm"
            >
              <HiOutlineChevronLeft className="w-16px h-16px" />
            </button>
            <h2 className="font-mono text-lg uppercase min-w-200px text-center">
              {format(currentDate, calendarView === 'day' ? 'MMMM d, yyyy' : 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => navigateCalendar('next')}
              className="brutal-btn-sm"
            >
              <HiOutlineChevronRight className="w-16px h-16px" />
            </button>
          </div>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="brutal-btn-sm"
          >
            TODAY
          </button>
        </div>

        <div className="flex items-center gap-4px">
          <button
            onClick={() => setCalendarView('month')}
            className={clsx(
              "px-12px py-6px font-mono text-brutal-xs uppercase",
              calendarView === 'month' ? 'bg-primary-brutalist text-event-horizon' : 'hover:bg-primary-brutalist/20'
            )}
          >
            MONTH
          </button>
          <button
            onClick={() => setCalendarView('week')}
            className={clsx(
              "px-12px py-6px font-mono text-brutal-xs uppercase",
              calendarView === 'week' ? 'bg-primary-brutalist text-event-horizon' : 'hover:bg-primary-brutalist/20'
            )}
          >
            WEEK
          </button>
          <button
            onClick={() => setCalendarView('day')}
            className={clsx(
              "px-12px py-6px font-mono text-brutal-xs uppercase",
              calendarView === 'day' ? 'bg-primary-brutalist text-event-horizon' : 'hover:bg-primary-brutalist/20'
            )}
          >
            DAY
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {calendarView === 'month' && (
        <div className="flex-1 p-16px">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1px mb-1px">
            {weekDays.map((day: string) => (
              <div key={day} className="bg-[var(--theme-background)] p-8px text-center font-mono text-brutal-xs uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1px h-[calc(100%-40px)]">
            {days.map((day: Date, index: number) => {
              const dayMeetings = getMeetingsForDay(day)
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isTodayDate = isToday(day)

              return (
                <div
                  key={index}
                  className={clsx(
                    "bg-[var(--theme-background)] p-8px min-h-100px border-2",
                    isCurrentMonth ? 'border-[var(--theme-border)]' : 'border-transparent opacity-50',
                    isTodayDate && 'border-primary-brutalist'
                  )}
                >
                  <div className="font-mono text-brutal-xs mb-4px">
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-2px">
                    {dayMeetings.slice(0, 3).map((meeting: any) => (
                      <button
                        key={meeting._id}
                        onClick={() => onMeetingClick(meeting)}
                        className={clsx(
                          "w-full text-left px-4px py-2px text-brutal-xs truncate hover:opacity-80",
                          meetingTypeColors[meeting.type as keyof typeof meetingTypeColors]
                        )}
                      >
                        {format(new Date(meeting.startTime), 'HH:mm')} {meeting.title}
                      </button>
                    ))}
                    {dayMeetings.length > 3 && (
                      <div className="text-brutal-xs text-[var(--theme-foreground)]/60 px-4px">
                        +{dayMeetings.length - 3} MORE
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {calendarView === 'week' && (
        <WeekView
          currentDate={currentDate}
          getMeetingsForDay={getMeetingsForDay}
          onMeetingClick={onMeetingClick}
        />
      )}

      {calendarView === 'day' && (
        <DayView
          meetings={getMeetingsForDay(currentDate)}
          onMeetingClick={onMeetingClick}
        />
      )}
    </div>
  )
}

// List View Component
function ListView({ 
  groupedMeetings, 
  currentUserId, 
  selectedMeetings, 
  setSelectedMeetings,
  onEdit,
  onViewNotes
}: any) {
  return (
    <div className="h-full overflow-y-auto bg-[var(--theme-background-secondary)] p-16px">
      {groupedMeetings.length === 0 ? (
        <div className="text-center py-48px">
          <p className="text-[var(--theme-foreground)]/60 mb-16px">NO MEETINGS FOUND</p>
        </div>
      ) : (
        <div className="space-y-24px">
          {groupedMeetings.map(({ date, meetings }: any) => (
            <div key={date}>
              <h3 className="font-mono text-brutal-sm uppercase mb-12px text-primary-brutalist">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                {isToday(new Date(date)) && (
                  <span className="ml-8px text-brutal-success">(TODAY)</span>
                )}
              </h3>
              <div className="space-y-12px">
                {meetings.map((meeting: any) => (
                  <div key={meeting._id} className="flex items-start gap-12px">
                    <input
                      type="checkbox"
                      checked={selectedMeetings.has(meeting._id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedMeetings)
                        if (e.target.checked) {
                          newSelected.add(meeting._id)
                        } else {
                          newSelected.delete(meeting._id)
                        }
                        setSelectedMeetings(newSelected)
                      }}
                      className="mt-4px"
                    />
                    <div className="flex-1">
                      <MeetingCard
                        meeting={meeting}
                        currentUserId={currentUserId}
                        onEdit={onEdit}
                        onViewNotes={onViewNotes}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Dashboard View Component
function DashboardView({ 
  stats, 
  upcomingMeetings, 
  onMeetingClick,
  onQuickRSVP
}: any) {
  return (
    <div className="h-full overflow-y-auto bg-[var(--theme-background-secondary)] p-16px">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16px">
        {/* Stats Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-16px">
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
            <div className="text-brutal-xs text-[var(--theme-foreground)]/60 uppercase mb-8px">Upcoming</div>
            <div className="text-2xl font-mono">{stats?.upcoming || 0}</div>
          </div>
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
            <div className="text-brutal-xs text-[var(--theme-foreground)]/60 uppercase mb-8px">Today</div>
            <div className="text-2xl font-mono">{stats?.today || 0}</div>
          </div>
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
            <div className="text-brutal-xs text-[var(--theme-foreground)]/60 uppercase mb-8px">Hours This Month</div>
            <div className="text-2xl font-mono">{stats?.totalHours || 0}h</div>
          </div>
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
            <div className="text-brutal-xs text-[var(--theme-foreground)]/60 uppercase mb-8px">Acceptance Rate</div>
            <div className="text-2xl font-mono">{stats?.acceptanceRate || 0}%</div>
          </div>
        </div>

        {/* Next Meetings */}
        <div className="lg:col-span-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
          <h3 className="font-mono text-brutal-sm uppercase mb-16px">UPCOMING MEETINGS</h3>
          {upcomingMeetings.length === 0 ? (
            <p className="text-[var(--theme-foreground)]/60 text-brutal-xs">NO UPCOMING MEETINGS</p>
          ) : (
            <div className="space-y-12px">
              {upcomingMeetings.slice(0, 5).map((meeting: any) => (
                <div 
                  key={meeting._id}
                  className="flex items-center justify-between p-12px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] hover:border-primary-brutalist transition-colors cursor-pointer"
                  onClick={() => onMeetingClick(meeting)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-8px mb-4px">
                      <span className={clsx(
                        "px-6px py-2px text-brutal-xs uppercase",
                        meetingTypeColors[meeting.type as keyof typeof meetingTypeColors]
                      )}>
                        {meeting.type}
                      </span>
                      <span className="font-mono text-brutal-xs">
                        {format(new Date(meeting.startTime), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <h4 className="font-mono text-brutal-sm">{meeting.title}</h4>
                  </div>
                  
                  {/* Quick RSVP */}
                  <div className="flex items-center gap-4px">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onQuickRSVP(meeting._id, 'accepted')
                      }}
                      className="p-4px hover:bg-brutal-success/20 transition-colors"
                      title="Accept"
                    >
                      <HiOutlineCheck className="w-16px h-16px text-brutal-success" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onQuickRSVP(meeting._id, 'declined')
                      }}
                      className="p-4px hover:bg-brutal-error/20 transition-colors"
                      title="Decline"
                    >
                      <HiOutlineX className="w-16px h-16px text-brutal-error" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
          <h3 className="font-mono text-brutal-sm uppercase mb-16px">TODAY'S SCHEDULE</h3>
          <TodaySchedule />
        </div>
      </div>
    </div>
  )
}

// Week View Component
function WeekView({ currentDate, getMeetingsForDay, onMeetingClick }: any) {
  const weekStart = startOfWeek(currentDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="flex-1 overflow-auto p-16px">
      <div className="grid grid-cols-8 gap-1px min-w-800px">
        {/* Time column */}
        <div className="bg-[var(--theme-background)]">
          <div className="h-40px border-b border-[var(--theme-border)]"></div>
          {hours.map(hour => (
            <div key={hour} className="h-60px border-b border-[var(--theme-border)] p-4px text-brutal-xs text-[var(--theme-foreground)]/60">
              {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map(day => (
          <div key={day.toISOString()} className="bg-[var(--theme-background)]">
            <div className="h-40px border-b border-[var(--theme-border)] p-4px">
              <div className="font-mono text-brutal-xs uppercase">{format(day, 'EEE')}</div>
              <div className={clsx(
                "font-mono text-brutal-sm",
                isToday(day) && "text-primary-brutalist"
              )}>
                {format(day, 'd')}
              </div>
            </div>
            <div className="relative">
              {hours.map(hour => (
                <div key={hour} className="h-60px border-b border-[var(--theme-border)]"></div>
              ))}
              {/* Meetings */}
              {getMeetingsForDay(day).map((meeting: any) => {
                const startHour = new Date(meeting.startTime).getHours()
                const startMinute = new Date(meeting.startTime).getMinutes()
                const duration = differenceInMinutes(new Date(meeting.endTime), new Date(meeting.startTime))
                
                return (
                  <button
                    key={meeting._id}
                    onClick={() => onMeetingClick(meeting)}
                    className={clsx(
                      "absolute left-0 right-0 mx-1px p-2px text-brutal-xs truncate hover:opacity-80 z-10",
                      meetingTypeColors[meeting.type as keyof typeof meetingTypeColors]
                    )}
                    style={{
                      top: `${(startHour * 60 + startMinute) * (60 / 60)}px`,
                      height: `${duration * (60 / 60)}px`,
                      minHeight: '20px'
                    }}
                  >
                    {meeting.title}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Day View Component
function DayView({ meetings, onMeetingClick }: any) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="flex-1 overflow-auto p-16px">
      <div className="max-w-800px mx-auto">
        {hours.map(hour => {
          const hourMeetings = meetings.filter((m: any) => 
            new Date(m.startTime).getHours() === hour
          )

          return (
            <div key={hour} className="flex gap-16px mb-1px">
              <div className="w-60px text-right font-mono text-brutal-xs text-[var(--theme-foreground)]/60 py-8px">
                {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
              </div>
              <div className="flex-1 min-h-60px bg-[var(--theme-background)] border border-[var(--theme-border)] p-8px">
                {hourMeetings.map((meeting: any) => (
                  <button
                    key={meeting._id}
                    onClick={() => onMeetingClick(meeting)}
                    className={clsx(
                      "w-full text-left p-8px mb-4px text-brutal-xs hover:opacity-80",
                      meetingTypeColors[meeting.type as keyof typeof meetingTypeColors]
                    )}
                  >
                    <div className="font-mono">
                      {format(new Date(meeting.startTime), 'HH:mm')} - {format(new Date(meeting.endTime), 'HH:mm')}
                    </div>
                    <div className="font-bold">{meeting.title}</div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Today's Schedule Component
function TodaySchedule({ }: any) {
  // Today's schedule would normally be queried here
  
  // This would normally query today's meetings
  return (
    <div className="space-y-8px">
      <div className="text-brutal-xs text-[var(--theme-foreground)]/60">
        YOUR SCHEDULE IS CLEAR TODAY
      </div>
    </div>
  )
}