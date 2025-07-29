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
      default: return 'text-cathode-white/60'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <HiOutlineCheck className="w-12px h-12px" />
      case 'declined': return <HiOutlineX className="w-12px h-12px" />
      case 'tentative': return <HiOutlineExclamationCircle className="w-12px h-12px" />
      default: return <HiOutlineClock className="w-12px h-12px" />
    }
  }

  const acceptedCount = meeting.attendees?.filter((a: any) => a.status === 'accepted').length || 0
  const totalAttendees = meeting.attendees?.length || 0

  return (
    <div className={clsx(
      "bg-carbon-plate border-2 p-16px transition-all hover:border-primary-brutalist",
      isHappening ? "border-brutal-success" : "border-basalt-border"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-12px">
        <div className="flex items-center gap-12px">
          <div className={clsx(
            "w-32px h-32px flex items-center justify-center text-event-horizon text-lg border-2 border-event-horizon",
            typeConfig.color
          )}>
            {typeConfig.icon}
          </div>
          <div>
            <h3 className="font-mono text-brutal-sm font-bold uppercase">{meeting.title}</h3>
            <div className="flex items-center gap-8px text-brutal-xs text-cathode-white/60">
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

        <div className="flex items-center gap-8px">
          {isHappening && (
            <div className="flex items-center gap-4px text-brutal-success text-brutal-xs uppercase">
              <div className="w-6px h-6px bg-brutal-success rounded-full animate-pulse"></div>
              LIVE
            </div>
          )}
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-4px hover:bg-event-horizon/20 transition-colors"
            >
              <HiOutlineDotsVertical className="w-16px h-16px" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-4px bg-carbon-plate border-2 border-basalt-border shadow-brutal-md z-10 min-w-150px">
                {meeting.meetingUrl && (
                  <button
                    onClick={() => window.open(meeting.meetingUrl, '_blank')}
                    className="w-full px-12px py-8px text-left font-mono text-brutal-xs uppercase hover:bg-primary-brutalist hover:text-event-horizon flex items-center gap-8px"
                  >
                    <HiOutlinePlay className="w-12px h-12px" />
                    JOIN MEETING
                  </button>
                )}
                
                {onViewNotes && (
                  <button
                    onClick={() => onViewNotes(meeting)}
                    className="w-full px-12px py-8px text-left font-mono text-brutal-xs uppercase hover:bg-primary-brutalist hover:text-event-horizon flex items-center gap-8px"
                  >
                    <HiOutlineDocument className="w-12px h-12px" />
                    VIEW NOTES
                  </button>
                )}
                
                {isOrganizer && onEdit && (
                  <button
                    onClick={() => onEdit(meeting)}
                    className="w-full px-12px py-8px text-left font-mono text-brutal-xs uppercase hover:bg-primary-brutalist hover:text-event-horizon flex items-center gap-8px"
                  >
                    <HiOutlineLink className="w-12px h-12px" />
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
        <p className="text-brutal-xs text-cathode-white/80 mb-12px">{meeting.description}</p>
      )}

      {/* Time & Location */}
      <div className="space-y-8px mb-16px">
        <div className="flex items-center gap-8px text-brutal-xs">
          <HiOutlineCalendar className="w-14px h-14px text-primary-brutalist" />
          <span className="font-mono">
            {format(new Date(meeting.startTime), 'MMM d, yyyy')}
          </span>
          <HiOutlineClock className="w-14px h-14px text-primary-brutalist" />
          <span className="font-mono">
            {format(new Date(meeting.startTime), 'h:mm a')} - {format(new Date(meeting.endTime), 'h:mm a')}
          </span>
          {isUpcoming && (
            <span className="text-cathode-white/60">
              ({formatDistanceToNow(new Date(meeting.startTime), { addSuffix: true })})
            </span>
          )}
        </div>

        {(meeting.location || meeting.meetingUrl) && (
          <div className="flex items-center gap-8px text-brutal-xs">
            {meeting.location && (
              <>
                <HiOutlineLocationMarker className="w-14px h-14px text-primary-brutalist" />
                <span className="font-mono">{meeting.location}</span>
              </>
            )}
            {meeting.meetingUrl && (
              <>
                {meeting.location && <span>•</span>}
                <HiOutlineVideoCamera className="w-14px h-14px text-primary-brutalist" />
                <span className="font-mono">VIDEO CALL</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Attendees */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8px">
          <HiOutlineUsers className="w-14px h-14px text-primary-brutalist" />
          <div className="flex items-center gap-4px">
            {meeting.attendees?.slice(0, 5).map((attendee: any) => (
              <div
                key={attendee.userId}
                className={clsx(
                  "w-24px h-24px border-2 flex items-center justify-center",
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
                  <span className="text-brutal-xs">
                    {attendee.user?.name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
            ))}
            {totalAttendees > 5 && (
              <div className="w-24px h-24px border-2 border-basalt-border bg-event-horizon flex items-center justify-center">
                <span className="text-brutal-xs">+{totalAttendees - 5}</span>
              </div>
            )}
          </div>
          <span className="text-brutal-xs text-cathode-white/60">
            {acceptedCount}/{totalAttendees} ACCEPTED
          </span>
        </div>

        {/* User Response */}
        {currentUserId && !isOrganizer && isUpcoming && (
          <div className="flex items-center gap-4px">
            <span className="text-brutal-xs text-cathode-white/60 mr-8px">YOUR RESPONSE:</span>
            <div className="flex items-center gap-4px">
              <button
                onClick={() => handleResponse('accepted')}
                disabled={isResponding}
                className={clsx(
                  "px-8px py-4px text-brutal-xs font-mono uppercase transition-colors",
                  userResponse === 'accepted'
                    ? 'bg-brutal-success text-white'
                    : 'bg-event-horizon border border-basalt-border hover:border-brutal-success'
                )}
              >
                {getStatusIcon('accepted')} YES
              </button>
              <button
                onClick={() => handleResponse('tentative')}
                disabled={isResponding}
                className={clsx(
                  "px-8px py-4px text-brutal-xs font-mono uppercase transition-colors",
                  userResponse === 'tentative'
                    ? 'bg-brutal-warning text-white'
                    : 'bg-event-horizon border border-basalt-border hover:border-brutal-warning'
                )}
              >
                {getStatusIcon('tentative')} MAYBE
              </button>
              <button
                onClick={() => handleResponse('declined')}
                disabled={isResponding}
                className={clsx(
                  "px-8px py-4px text-brutal-xs font-mono uppercase transition-colors",
                  userResponse === 'declined'
                    ? 'bg-brutal-error text-white'
                    : 'bg-event-horizon border border-basalt-border hover:border-brutal-error'
                )}
              >
                {getStatusIcon('declined')} NO
              </button>
            </div>
          </div>
        )}

        {/* Meeting Status for Organizer */}
        {isOrganizer && (
          <div className="flex items-center gap-8px text-brutal-xs">
            <span className="text-cathode-white/60">ORGANIZER</span>
            {isHappening && meeting.meetingUrl && (
              <button
                onClick={() => window.open(meeting.meetingUrl, '_blank')}
                className="brutal-btn-sm"
              >
                START MEETING
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}