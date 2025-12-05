import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlineVideoCamera,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineUsers,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineExclamationCircle,
  HiOutlineDotsVertical,
  HiOutlinePlay,
  HiOutlineDocument,
  HiOutlineLink
} from 'react-icons/hi'
import { formatDistanceToNow, format } from 'date-fns'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { BrutalCard, BrutalButton, BrutalBadge } from '@/components/ui'

interface MeetingCardProps {
  meeting: any
  currentUserId?: string
  onEdit?: (meeting: any) => void
  onViewNotes?: (meeting: any) => void
}

const meetingTypeConfig = {
  standup: { icon: '🏃', color: 'bg-brutal-info', label: 'STANDUP' },
  retrospective: { icon: '🔄', color: 'bg-brutal-warning', label: 'RETROSPECTIVE' },
  planning: { icon: '📋', color: 'bg-primary-brutalist', label: 'PLANNING' },
  review: { icon: '👥', color: 'bg-brutal-success', label: 'REVIEW' },
  custom: { icon: '⚙️', color: 'bg-neutral-600', label: 'CUSTOM' },
}

export default function MeetingCard({
  meeting,
  currentUserId,
  onEdit,
  onViewNotes
}: MeetingCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isResponding, setIsResponding] = useState(false)

  const respondToMeeting = useMutation(api.meetings.mutations.respondToMeeting)

  const typeConfig = meetingTypeConfig[meeting.type as keyof typeof meetingTypeConfig] || meetingTypeConfig.custom
  const isOrganizer = currentUserId === meeting.organizerId
  const currentUserAttendee = meeting.attendees?.find((a: any) => a.userId === currentUserId)
  const userResponse = currentUserAttendee?.status || 'pending'

  const now = Date.now()
  const isUpcoming = meeting.startTime > now
  const isHappening = meeting.startTime <= now && meeting.endTime > now

  const handleResponse = async (status: 'accepted' | 'declined' | 'tentative') => {
    if (!currentUserId) return

    setIsResponding(true)
    try {
      await respondToMeeting({
        meetingId: meeting._id,
        status,
      })
      toast.success(`Meeting ${status}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to respond to meeting')
    } finally {
      setIsResponding(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-brutal-success'
      case 'declined': return 'text-brutal-error'
      case 'tentative': return 'text-brutal-warning'
      default: return 'text-[var(--theme-foreground)]/60'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <HiOutlineCheck className="w-3 h-3" />
      case 'declined': return <HiOutlineX className="w-3 h-3" />
      case 'tentative': return <HiOutlineExclamationCircle className="w-3 h-3" />
      default: return <HiOutlineClock className="w-3 h-3" />
    }
  }

  const acceptedCount = meeting.attendees?.filter((a: any) => a.status === 'accepted').length || 0
  const totalAttendees = meeting.attendees?.length || 0

  return (
    <BrutalCard
      variant={isHappening ? 'neon' : 'default'}
      className={clsx(
        "p-4 transition-all hover:border-[var(--theme-primary)]",
        isHappening && "border-brutal-success"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "w-8 h-8 flex items-center justify-center text-event-horizon text-lg border-2 border-event-horizon",
            typeConfig.color
          )}>
            {typeConfig.icon}
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold uppercase">{meeting.title}</h3>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--theme-foreground)]/60">
              <span className="uppercase">{typeConfig.label}</span>
              {meeting.projectId && (
                <>
                  <span>•</span>
                  <span>PROJECT MEETING</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHappening && (
            <div className="flex items-center gap-1 text-brutal-success text-[10px] font-bold uppercase animate-pulse">
              <div className="w-2 h-2 bg-brutal-success"></div>
              LIVE
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-[var(--theme-background-secondary)] transition-colors border border-transparent hover:border-[var(--theme-border)]"
            >
              <HiOutlineDotsVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] shadow-brutal-md z-10 min-w-[160px]">
                {meeting.meetingUrl && (
                  <button
                    onClick={() => window.open(meeting.meetingUrl, '_blank')}
                    className="w-full px-3 py-2 text-left font-mono text-xs uppercase hover:bg-[var(--theme-primary)] hover:text-[var(--theme-background)] flex items-center gap-2"
                  >
                    <HiOutlinePlay className="w-3 h-3" />
                    JOIN MEETING
                  </button>
                )}

                {onViewNotes && (
                  <button
                    onClick={() => onViewNotes(meeting)}
                    className="w-full px-3 py-2 text-left font-mono text-xs uppercase hover:bg-[var(--theme-primary)] hover:text-[var(--theme-background)] flex items-center gap-2"
                  >
                    <HiOutlineDocument className="w-3 h-3" />
                    VIEW NOTES
                  </button>
                )}

                {isOrganizer && onEdit && (
                  <button
                    onClick={() => onEdit(meeting)}
                    className="w-full px-3 py-2 text-left font-mono text-xs uppercase hover:bg-[var(--theme-primary)] hover:text-[var(--theme-background)] flex items-center gap-2"
                  >
                    <HiOutlineLink className="w-3 h-3" />
                    EDIT MEETING
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {meeting.description && (
        <p className="text-xs font-mono text-[var(--theme-foreground)]/80 mb-3 pl-3 border-l-2 border-[var(--theme-border)]">{meeting.description}</p>
      )}

      {/* Time & Location */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs font-mono">
          <HiOutlineCalendar className="w-4 h-4 text-[var(--theme-primary)]" />
          <span>
            {format(new Date(meeting.startTime), 'MMM d, yyyy')}
          </span>
          <HiOutlineClock className="w-4 h-4 text-[var(--theme-primary)]" />
          <span>
            {format(new Date(meeting.startTime), 'h:mm a')} - {format(new Date(meeting.endTime), 'h:mm a')}
          </span>
          {isUpcoming && (
            <span className="text-[var(--theme-foreground)]/60">
              ({formatDistanceToNow(new Date(meeting.startTime), { addSuffix: true })})
            </span>
          )}
        </div>

        {(meeting.location || meeting.meetingUrl) && (
          <div className="flex items-center gap-2 text-xs font-mono">
            {meeting.location && (
              <>
                <HiOutlineLocationMarker className="w-4 h-4 text-[var(--theme-primary)]" />
                <span>{meeting.location}</span>
              </>
            )}
            {meeting.meetingUrl && (
              <>
                {meeting.location && <span>•</span>}
                <HiOutlineVideoCamera className="w-4 h-4 text-[var(--theme-primary)]" />
                <span>VIDEO CALL</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Attendees */}
      <div className="flex items-center justify-between pt-3 border-t-2 border-[var(--theme-border)]">
        <div className="flex items-center gap-2">
          <HiOutlineUsers className="w-4 h-4 text-[var(--theme-primary)]" />
          <div className="flex items-center gap-1">
            {meeting.attendees?.slice(0, 5).map((attendee: any) => (
              <div
                key={attendee.userId}
                className={clsx(
                  "w-6 h-6 border-2 flex items-center justify-center",
                  getStatusColor(attendee.status)
                )}
                title={`${attendee.user?.name || 'Unknown'} - ${attendee.status}`}
              >
                {attendee.user?.avatarUrl ? (
                  <img
                    src={attendee.user.avatarUrl}
                    alt={attendee.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold">
                    {attendee.user?.name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
            ))}
            {totalAttendees > 5 && (
              <div className="w-6 h-6 border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] flex items-center justify-center">
                <span className="text-[10px] font-bold">+{totalAttendees - 5}</span>
              </div>
            )}
          </div>
          <span className="text-[10px] font-mono text-[var(--theme-foreground)]/60">
            {acceptedCount}/{totalAttendees} ACCEPTED
          </span>
        </div>

        {/* User Response */}
        {currentUserId && !isOrganizer && isUpcoming && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--theme-foreground)]/60 hidden sm:inline">YOUR RESPONSE:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleResponse('accepted')}
                disabled={isResponding}
                className={clsx(
                  "px-2 py-1 text-[10px] font-mono font-bold uppercase transition-colors border-2",
                  userResponse === 'accepted'
                    ? 'bg-brutal-success text-white border-brutal-success'
                    : 'bg-[var(--theme-background)] border-[var(--theme-border)] hover:border-brutal-success'
                )}
              >
                YES
              </button>
              <button
                onClick={() => handleResponse('tentative')}
                disabled={isResponding}
                className={clsx(
                  "px-2 py-1 text-[10px] font-mono font-bold uppercase transition-colors border-2",
                  userResponse === 'tentative'
                    ? 'bg-brutal-warning text-white border-brutal-warning'
                    : 'bg-[var(--theme-background)] border-[var(--theme-border)] hover:border-brutal-warning'
                )}
              >
                MAYBE
              </button>
              <button
                onClick={() => handleResponse('declined')}
                disabled={isResponding}
                className={clsx(
                  "px-2 py-1 text-[10px] font-mono font-bold uppercase transition-colors border-2",
                  userResponse === 'declined'
                    ? 'bg-brutal-error text-white border-brutal-error'
                    : 'bg-[var(--theme-background)] border-[var(--theme-border)] hover:border-brutal-error'
                )}
              >
                NO
              </button>
            </div>
          </div>
        )}

        {/* Meeting Status for Organizer */}
        {isOrganizer && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[var(--theme-foreground)]/60 uppercase text-[10px]">ORGANIZER</span>
            {isHappening && meeting.meetingUrl && (
              <BrutalButton
                size="sm"
                onClick={() => window.open(meeting.meetingUrl, '_blank')}
                className="h-6 text-[10px]"
              >
                START
              </BrutalButton>
            )}
          </div>
        )}
      </div>
    </BrutalCard>
  )
}