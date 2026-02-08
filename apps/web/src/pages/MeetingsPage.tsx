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
  HiOutlineX,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineVideoCamera
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
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalBadge from '@/components/ui/BrutalBadge'

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
  standup: 'bg-brutal-info text-event-horizon',
  retrospective: 'bg-brutal-warning text-event-horizon',
  planning: 'bg-primary-brutalist text-event-horizon',
  review: 'bg-brutal-success text-event-horizon',
  custom: 'bg-[var(--theme-foreground)] text-[var(--theme-background)]',
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
    <div className="h-full flex flex-col p-4 bg-[var(--theme-background)]">
      {/* Header */}
      <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <HiOutlineCalendar className="w-6 h-6 md:w-7 md:h-7 text-[var(--theme-primary)]" />
            SCHEDULE GRID
          </h1>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60 uppercase tracking-wide">
            {currentWorkspace?.name || 'Loading...'} • {format(currentDate, 'MMMM yyyy')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* View Toggle */}
          <div className="flex border-2 border-[var(--theme-border)] bg-[var(--theme-background)]">
            <button
              onClick={() => setViewMode('calendar')}
              className={clsx(
                "px-4 py-2 flex items-center gap-2 font-mono text-xs font-bold uppercase transition-colors",
                "border-r-2 border-[var(--theme-border)]",
                viewMode === 'calendar'
                  ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                  : "text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]"
              )}
            >
              <HiOutlineCalendar className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                "px-4 py-2 flex items-center gap-2 font-mono text-xs font-bold uppercase transition-colors",
                "border-r-2 border-[var(--theme-border)]",
                viewMode === 'list'
                  ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                  : "text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]"
              )}
            >
              <HiOutlineViewList className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('dashboard')}
              className={clsx(
                "px-4 py-2 flex items-center gap-2 font-mono text-xs font-bold uppercase transition-colors",
                viewMode === 'dashboard'
                  ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                  : "text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]"
              )}
            >
              <HiOutlineViewGrid className="w-4 h-4" />
              Dash
            </button>
          </div>

          <BrutalButton
            variant="primary"
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2"
          >
            <HiOutlinePlus className="w-4 h-4" />
            New Meeting
          </BrutalButton>
        </div>
      </div>

      {/* Controls Bar */}
      <BrutalCard className="mb-3 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--theme-foreground)]/60" />
            <input
              type="text"
              placeholder="SEARCH MEETINGS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] text-[var(--theme-foreground)] placeholder-[var(--theme-foreground)]/40 font-mono text-xs uppercase focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
            />
          </div>

          <BrutalButton
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className={clsx("flex items-center gap-2", showFilters && "bg-[var(--theme-primary)] text-[var(--theme-background)]")}
          >
            <HiOutlineFilter className="w-4 h-4" />
            Filter
          </BrutalButton>
        </div>

        <div className="flex items-center gap-2">
          <BrutalButton variant="ghost" onClick={() => navigateCalendar('prev')}>
            <HiOutlineChevronLeft className="w-4 h-4" />
          </BrutalButton>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="font-mono text-sm font-bold uppercase hover:text-[var(--theme-primary)] transition-colors"
          >
            Today
          </button>
          <BrutalButton variant="ghost" onClick={() => navigateCalendar('next')}>
            <HiOutlineChevronRight className="w-4 h-4" />
          </BrutalButton>
        </div>
      </BrutalCard>

      {/* Filters Panel */}
      {showFilters && (
        <BrutalCard className="mb-3 p-3 border-t-0 -mt-3">
          <div className="flex items-center gap-4">
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
              className="px-4 py-2 bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] text-[var(--theme-foreground)] font-mono text-xs uppercase focus:border-[var(--theme-primary)] focus:outline-none transition-colors cursor-pointer"
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
              className="text-xs font-mono uppercase text-[var(--theme-foreground)]/60 hover:text-[var(--theme-error)] transition-colors"
            >
              CLEAR FILTERS
            </button>
          </div>
        </BrutalCard>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
        {viewMode === 'calendar' && (
          <CalendarView
            currentDate={currentDate}
            calendarView={calendarView}
            setCalendarView={setCalendarView}
            getCalendarDays={getCalendarDays}
            getMeetingsForDay={getMeetingsForDay}
            onMeetingClick={setViewingMeeting}
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
  getCalendarDays,
  getMeetingsForDay,
  onMeetingClick,
}: any) {
  const days = getCalendarDays()
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header */}
      <div className="bg-[var(--theme-background)] border-b-2 border-[var(--theme-border)] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['month', 'week', 'day'].map((view) => (
            <button
              key={view}
              onClick={() => setCalendarView(view as CalendarView)}
              className={clsx(
                "px-3 py-1 font-mono text-xs font-bold uppercase transition-colors border-2",
                calendarView === view
                  ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-[var(--theme-background)]"
                  : "border-transparent hover:border-[var(--theme-border)]"
              )}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      {calendarView === 'month' && (
        <div className="flex-1 flex flex-col">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b-2 border-[var(--theme-border)] bg-[var(--theme-background)]">
            {weekDays.map((day: string) => (
              <div key={day} className="p-2 text-center font-mono text-xs font-bold uppercase border-r-2 border-[var(--theme-border)] last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 flex-1 bg-[var(--theme-border)] gap-[2px]">
            {days.map((day: Date, index: number) => {
              const dayMeetings = getMeetingsForDay(day)
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isTodayDate = isToday(day)

              return (
                <div
                  key={index}
                  className={clsx(
                    "bg-[var(--theme-background)] p-2 min-h-[100px] flex flex-col transition-colors hover:bg-[var(--theme-background-secondary)]",
                    !isCurrentMonth && "opacity-50 bg-[var(--theme-background-secondary)]"
                  )}
                >
                  <div className={clsx(
                    "font-mono text-xs mb-2 w-6 h-6 flex items-center justify-center",
                    isTodayDate && "bg-[var(--theme-primary)] text-[var(--theme-background)] font-bold"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1 flex-1">
                    {dayMeetings.slice(0, 3).map((meeting: any) => (
                      <button
                        key={meeting._id}
                        onClick={() => onMeetingClick(meeting)}
                        className={clsx(
                          "w-full text-left px-2 py-1 text-[10px] font-mono uppercase truncate border-l-2 hover:brightness-110 transition-all",
                          meetingTypeColors[meeting.type as keyof typeof meetingTypeColors] || meetingTypeColors.custom
                        )}
                      >
                        {format(new Date(meeting.startTime), 'HH:mm')} {meeting.title}
                      </button>
                    ))}
                    {dayMeetings.length > 3 && (
                      <div className="text-[10px] font-mono text-[var(--theme-foreground)]/60 px-1">
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

      {/* Placeholder for Week/Day views if needed, or fallback to Month view logic */}
      {calendarView !== 'month' && (
        <div className="flex-1 flex items-center justify-center bg-[var(--theme-background)]">
          <div className="text-center">
            <HiOutlineCalendar className="w-8 h-8 text-[var(--theme-foreground)]/20 mx-auto mb-3" />
            <p className="font-mono text-sm text-[var(--theme-foreground)]/60">
              {calendarView.toUpperCase()} VIEW COMING SOON
            </p>
            <button
              onClick={() => setCalendarView('month')}
              className="mt-4 text-xs font-bold uppercase text-[var(--theme-primary)] hover:underline"
            >
              Switch to Month View
            </button>
          </div>
        </div>
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
  onViewNotes,
  onView
}: any) {
  return (
    <div className="h-full overflow-y-auto p-4 bg-[var(--theme-background)]">
      {groupedMeetings.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-[var(--theme-border)]">
          <p className="text-[var(--theme-foreground)]/60 font-mono text-sm uppercase">NO MEETINGS FOUND</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedMeetings.map(({ date, meetings }: any) => (
            <div key={date}>
              <div className="flex items-center gap-4 mb-3">
                <h3 className="font-mono text-sm font-bold uppercase text-[var(--theme-primary)]">
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="h-[2px] flex-1 bg-[var(--theme-border)]"></div>
              </div>

              <div className="space-y-2">
                {meetings.map((meeting: any) => (
                  <div key={meeting._id} className="flex items-start gap-4 group">
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
                      className="mt-6 w-4 h-4 border-2 border-[var(--theme-border)] bg-[var(--theme-background)] checked:bg-[var(--theme-primary)] cursor-pointer"
                    />
                    <div className="flex-1 cursor-pointer" onClick={() => onView(meeting)}>
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
    <div className="h-full overflow-y-auto p-4 bg-[var(--theme-background)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Stats Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Upcoming', value: stats?.upcoming || 0 },
            { label: 'Today', value: stats?.today || 0 },
            { label: 'Hours (Month)', value: `${stats?.totalHours || 0}h` },
            { label: 'Acceptance Rate', value: `${stats?.acceptanceRate || 0}%` },
          ].map((stat) => (
            <BrutalCard key={stat.label} className="p-3 text-center hover:border-[var(--theme-primary)] transition-colors">
              <div className="text-[10px] font-mono uppercase text-[var(--theme-foreground)]/60 mb-2">{stat.label}</div>
              <div className="text-2xl font-bold font-mono">{stat.value}</div>
            </BrutalCard>
          ))}
        </div>

        {/* Next Meetings */}
        <div className="lg:col-span-2">
          <BrutalCard className="p-4 h-full">
            <h3 className="font-mono text-sm font-bold uppercase mb-3 flex items-center gap-2">
              <HiOutlineClock className="w-4 h-4 text-[var(--theme-primary)]" />
              UPCOMING MEETINGS
            </h3>
            {upcomingMeetings.length === 0 ? (
              <p className="text-[var(--theme-foreground)]/60 font-mono text-xs uppercase text-center py-8">NO UPCOMING MEETINGS</p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.slice(0, 5).map((meeting: any) => (
                  <div
                    key={meeting._id}
                    className="flex items-center justify-between p-3 bg-[var(--theme-background-secondary)] border-l-4 border-[var(--theme-border)] hover:border-[var(--theme-primary)] transition-all cursor-pointer group"
                    onClick={() => onMeetingClick(meeting)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={clsx(
                          "px-2 py-[2px] text-[10px] font-bold uppercase",
                          meetingTypeColors[meeting.type as keyof typeof meetingTypeColors] || meetingTypeColors.custom
                        )}>
                          {meeting.type}
                        </span>
                        <span className="font-mono text-xs text-[var(--theme-foreground)]/60">
                          {format(new Date(meeting.startTime), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <h4 className="font-mono text-sm font-bold group-hover:text-[var(--theme-primary)] transition-colors">{meeting.title}</h4>
                    </div>
                    <HiOutlineChevronRight className="w-4 h-4 text-[var(--theme-foreground)]/40 group-hover:text-[var(--theme-primary)] transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </BrutalCard>
        </div>

        {/* Quick Actions or Info */}
        <div className="lg:col-span-1">
          <BrutalCard className="p-4 h-full bg-[var(--theme-background-secondary)] border-dashed">
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <div className="w-8 h-8 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] flex items-center justify-center">
                <HiOutlineVideoCamera className="w-5 h-5 text-[var(--theme-primary)]" />
              </div>
              <div>
                <h4 className="font-bold font-mono uppercase mb-1">Quick Join</h4>
                <p className="text-xs text-[var(--theme-foreground)]/60 max-w-[200px]">
                  Join your next meeting directly from here when it starts.
                </p>
              </div>
            </div>
          </BrutalCard>
        </div>
      </div>
    </div>
  )
}