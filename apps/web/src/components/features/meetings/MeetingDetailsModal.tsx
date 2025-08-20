import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineVideoCamera,
  HiOutlineUsers,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineExternalLink,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineExclamationCircle,
  HiOutlinePlus,
  HiOutlineRefresh
} from 'react-icons/hi'
import clsx from 'clsx'

interface MeetingDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  meeting: any
  currentUserId?: string
  onEdit?: () => void
  onViewNotes?: () => void
}

const meetingTypeConfig = {
  standup: { icon: '🏃', color: 'bg-brutal-info border-brutal-info', label: 'DAILY STANDUP' },
  retrospective: { icon: '🔄', color: 'bg-brutal-warning border-brutal-warning', label: 'RETROSPECTIVE' },
  planning: { icon: '📋', color: 'bg-primary-brutalist border-primary-brutalist', label: 'SPRINT PLANNING' },
  review: { icon: '👥', color: 'bg-brutal-success border-brutal-success', label: 'SPRINT REVIEW' },
  custom: { icon: '⚙️', color: 'bg-neutral-600 border-neutral-600', label: 'CUSTOM MEETING' },
}

export default function MeetingDetailsModal({
  isOpen,
  onClose,
  meeting,
  currentUserId,
  onEdit,
  onViewNotes
}: MeetingDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'attendees' | 'agenda' | 'actions'>('details')
  const [isResponding, setIsResponding] = useState(false)
  const [newActionItem, setNewActionItem] = useState('')
  const [isAddingAction, setIsAddingAction] = useState(false)

  const respondToMeeting = useMutation(api.meetings.mutations.respondToMeeting)
  const deleteMeeting = useMutation(api.meetings.mutations.deleteMeeting)
  const addActionItem = useMutation(api.meetings.mutations.addActionItem)
  const convertActionItemToTask = useMutation(api.meetings.mutations.convertActionItemToTask)

  if (!meeting) return null

  const typeConfig = meetingTypeConfig[meeting.type as keyof typeof meetingTypeConfig] || meetingTypeConfig.custom
  const isOrganizer = currentUserId === meeting.organizerId
  const currentUserAttendee = meeting.attendees?.find((a: any) => a.userId === currentUserId)
  const userResponse = currentUserAttendee?.status || 'pending'

  const now = Date.now()
  const isUpcoming = meeting.startTime > now
  const isHappening = meeting.startTime <= now && meeting.endTime > now
  const isPast = meeting.endTime < now

  const acceptedCount = meeting.attendees?.filter((a: any) => a.status === 'accepted').length || 0
  const declinedCount = meeting.attendees?.filter((a: any) => a.status === 'declined').length || 0
  const tentativeCount = meeting.attendees?.filter((a: any) => a.status === 'tentative').length || 0
  const pendingCount = meeting.attendees?.filter((a: any) => a.status === 'pending').length || 0

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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meeting?')) return

    try {
      await deleteMeeting({ meetingId: meeting._id })
      toast.success('Meeting deleted')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete meeting')
    }
  }

  const handleAddActionItem = async () => {
    if (!newActionItem.trim()) return

    setIsAddingAction(true)
    try {
      await addActionItem({
        meetingId: meeting._id,
        description: newActionItem.trim(),
        assigneeId: currentUserId as any,
      })
      toast.success('Action item added')
      setNewActionItem('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add action item')
    } finally {
      setIsAddingAction(false)
    }
  }

  const handleConvertToTask = async (actionItemId: string) => {
    try {
      await convertActionItemToTask({
        meetingId: meeting._id,
        actionItemId,
      })
      toast.success('Converted to task')
    } catch (error: any) {
      toast.error(error.message || 'Failed to convert to task')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <HiOutlineCheck className="w-14px h-14px text-brutal-success" />
      case 'declined': return <HiOutlineX className="w-14px h-14px text-brutal-error" />
      case 'tentative': return <HiOutlineExclamationCircle className="w-14px h-14px text-brutal-warning" />
      default: return <HiOutlineClock className="w-14px h-14px text-cathode-white/60" />
    }
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="MEETING DETAILS"
      size="lg"
    >
      <div className="space-y-24px">
        {/* Header */}
        <div className="bg-carbon-plate border-2 border-basalt-border p-16px">
          <div className="flex items-start justify-between mb-12px">
            <div className="flex items-center gap-12px">
              <div className={clsx(
                "w-48px h-48px flex items-center justify-center text-event-horizon text-2xl border-4",
                typeConfig.color
              )}>
                {typeConfig.icon}
              </div>
              <div>
                <h2 className="font-mono text-xl font-bold uppercase">{meeting.title}</h2>
                <div className="flex items-center gap-8px text-brutal-xs text-cathode-white/60">
                  <span className="uppercase">{typeConfig.label}</span>
                  {isHappening && (
                    <span className="flex items-center gap-4px text-brutal-success">
                      <div className="w-6px h-6px bg-brutal-success animate-pulse"></div>
                      LIVE NOW
                    </span>
                  )}
                  {isPast && <span>COMPLETED</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8px">
              {meeting.meetingUrl && (
                <button
                  onClick={() => window.open(meeting.meetingUrl, '_blank')}
                  className="brutal-btn-sm bg-primary-brutalist"
                >
                  <HiOutlineExternalLink className="w-16px h-16px mr-4px" />
                  JOIN
                </button>
              )}
              {isOrganizer && (
                <>
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="brutal-btn-sm"
                    >
                      <HiOutlinePencil className="w-16px h-16px" />
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="brutal-btn-sm bg-brutal-error"
                  >
                    <HiOutlineTrash className="w-16px h-16px" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Time & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12px">
            <div className="flex items-center gap-8px text-brutal-sm">
              <HiOutlineCalendar className="w-16px h-16px text-primary-brutalist" />
              <span className="font-mono">
                {format(new Date(meeting.startTime), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-8px text-brutal-sm">
              <HiOutlineClock className="w-16px h-16px text-primary-brutalist" />
              <span className="font-mono">
                {format(new Date(meeting.startTime), 'h:mm a')} - {format(new Date(meeting.endTime), 'h:mm a')}
              </span>
              {isUpcoming && (
                <span className="text-brutal-xs text-cathode-white/60">
                  ({formatDistanceToNow(new Date(meeting.startTime), { addSuffix: true })})
                </span>
              )}
            </div>
            {meeting.location && (
              <div className="flex items-center gap-8px text-brutal-sm">
                <HiOutlineLocationMarker className="w-16px h-16px text-primary-brutalist" />
                <span className="font-mono">{meeting.location}</span>
              </div>
            )}
            {meeting.meetingUrl && (
              <div className="flex items-center gap-8px text-brutal-sm">
                <HiOutlineVideoCamera className="w-16px h-16px text-primary-brutalist" />
                <span className="font-mono">VIDEO CALL</span>
              </div>
            )}
          </div>
        </div>

        {/* Your Response */}
        {currentUserId && !isOrganizer && isUpcoming && (
          <div className="bg-event-horizon border-2 border-basalt-border p-16px">
            <h3 className="font-mono text-brutal-sm uppercase mb-12px">YOUR RESPONSE</h3>
            <div className="flex items-center gap-8px">
              <button
                onClick={() => handleResponse('accepted')}
                disabled={isResponding}
                className={clsx(
                  "flex-1 px-16px py-12px font-mono text-brutal-sm uppercase border-2 transition-colors",
                  userResponse === 'accepted'
                    ? 'bg-brutal-success border-brutal-success text-event-horizon'
                    : 'bg-carbon-plate border-basalt-border hover:border-brutal-success'
                )}
              >
                <HiOutlineCheck className="inline w-16px h-16px mr-8px" />
                ACCEPT
              </button>
              <button
                onClick={() => handleResponse('tentative')}
                disabled={isResponding}
                className={clsx(
                  "flex-1 px-16px py-12px font-mono text-brutal-sm uppercase border-2 transition-colors",
                  userResponse === 'tentative'
                    ? 'bg-brutal-warning border-brutal-warning text-event-horizon'
                    : 'bg-carbon-plate border-basalt-border hover:border-brutal-warning'
                )}
              >
                <HiOutlineExclamationCircle className="inline w-16px h-16px mr-8px" />
                MAYBE
              </button>
              <button
                onClick={() => handleResponse('declined')}
                disabled={isResponding}
                className={clsx(
                  "flex-1 px-16px py-12px font-mono text-brutal-sm uppercase border-2 transition-colors",
                  userResponse === 'declined'
                    ? 'bg-brutal-error border-brutal-error text-white'
                    : 'bg-carbon-plate border-basalt-border hover:border-brutal-error'
                )}
              >
                <HiOutlineX className="inline w-16px h-16px mr-8px" />
                DECLINE
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-2 border-basalt-border">
          <div className="flex border-b-2 border-basalt-border">
            {(['details', 'attendees', 'agenda', 'actions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  "flex-1 px-16px py-12px font-mono text-brutal-sm uppercase transition-colors",
                  activeTab === tab
                    ? 'bg-primary-brutalist text-event-horizon'
                    : 'bg-carbon-plate hover:bg-event-horizon/20'
                )}
              >
                {tab === 'details' && <HiOutlineDocumentText className="inline w-16px h-16px mr-8px" />}
                {tab === 'attendees' && <HiOutlineUsers className="inline w-16px h-16px mr-8px" />}
                {tab === 'agenda' && <HiOutlineClipboardList className="inline w-16px h-16px mr-8px" />}
                {tab === 'actions' && <HiOutlineCheck className="inline w-16px h-16px mr-8px" />}
                {tab}
              </button>
            ))}
          </div>

          <div className="p-16px bg-event-horizon min-h-200px">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-16px">
                {meeting.description && (
                  <div>
                    <h4 className="font-mono text-brutal-xs uppercase text-cathode-white/60 mb-8px">DESCRIPTION</h4>
                    <p className="font-mono text-brutal-sm">{meeting.description}</p>
                  </div>
                )}
                {meeting.recurrence && (
                  <div>
                    <h4 className="font-mono text-brutal-xs uppercase text-cathode-white/60 mb-8px">RECURRENCE</h4>
                    <div className="flex items-center gap-8px">
                      <HiOutlineRefresh className="w-16px h-16px text-primary-brutalist" />
                      <span className="font-mono text-brutal-sm uppercase">
                        {meeting.recurrence.frequency} (EVERY {meeting.recurrence.interval} {meeting.recurrence.frequency === 'daily' ? 'DAY' : meeting.recurrence.frequency === 'weekly' ? 'WEEK' : 'MONTH'})
                      </span>
                    </div>
                  </div>
                )}
                {meeting.projectId && (
                  <div>
                    <h4 className="font-mono text-brutal-xs uppercase text-cathode-white/60 mb-8px">PROJECT</h4>
                    <p className="font-mono text-brutal-sm">PROJECT MEETING</p>
                  </div>
                )}
              </div>
            )}

            {/* Attendees Tab */}
            {activeTab === 'attendees' && (
              <div className="space-y-12px">
                <div className="grid grid-cols-2 gap-8px mb-16px">
                  <div className="bg-carbon-plate border-2 border-basalt-border p-8px text-center">
                    <div className="text-2xl font-mono">{acceptedCount}</div>
                    <div className="text-brutal-xs text-cathode-white/60 uppercase">ACCEPTED</div>
                  </div>
                  <div className="bg-carbon-plate border-2 border-basalt-border p-8px text-center">
                    <div className="text-2xl font-mono">{pendingCount}</div>
                    <div className="text-brutal-xs text-cathode-white/60 uppercase">PENDING</div>
                  </div>
                  <div className="bg-carbon-plate border-2 border-basalt-border p-8px text-center">
                    <div className="text-2xl font-mono">{tentativeCount}</div>
                    <div className="text-brutal-xs text-cathode-white/60 uppercase">TENTATIVE</div>
                  </div>
                  <div className="bg-carbon-plate border-2 border-basalt-border p-8px text-center">
                    <div className="text-2xl font-mono">{declinedCount}</div>
                    <div className="text-brutal-xs text-cathode-white/60 uppercase">DECLINED</div>
                  </div>
                </div>

                <div className="space-y-8px">
                  {meeting.attendees?.map((attendee: any) => (
                    <div
                      key={attendee.userId}
                      className="flex items-center justify-between p-12px bg-carbon-plate border-2 border-basalt-border"
                    >
                      <div className="flex items-center gap-12px">
                        {attendee.user?.avatarUrl ? (
                          <img
                            src={attendee.user.avatarUrl}
                            alt={attendee.user.name}
                            className="w-32px h-32px border-2 border-basalt-border"
                          />
                        ) : (
                          <div className="w-32px h-32px border-2 border-basalt-border bg-event-horizon flex items-center justify-center font-mono text-brutal-sm">
                            {attendee.user?.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <div className="font-mono text-brutal-sm">{attendee.user?.name || 'Unknown'}</div>
                          <div className="font-mono text-brutal-xs text-cathode-white/60">{attendee.user?.email}</div>
                        </div>
                        {attendee.userId === meeting.organizerId && (
                          <span className="px-8px py-2px bg-primary-brutalist text-event-horizon font-mono text-brutal-xs uppercase">
                            ORGANIZER
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4px">
                        {getStatusIcon(attendee.status)}
                        <span className="font-mono text-brutal-xs uppercase">{attendee.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agenda Tab */}
            {activeTab === 'agenda' && (
              <div className="space-y-8px">
                {meeting.template?.agenda && meeting.template.agenda.length > 0 ? (
                  meeting.template.agenda.map((item: string, index: number) => (
                    <div
                      key={index}
                      className="p-12px bg-carbon-plate border-2 border-basalt-border"
                    >
                      <span className="font-mono text-brutal-xs text-primary-brutalist mr-8px">
                        {(index + 1).toString().padStart(2, '0')}.
                      </span>
                      <span className="font-mono text-brutal-sm uppercase">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-cathode-white/60 font-mono text-brutal-sm">NO AGENDA ITEMS</p>
                )}
              </div>
            )}

            {/* Actions Tab */}
            {activeTab === 'actions' && (
              <div className="space-y-12px">
                {meeting.actionItems && meeting.actionItems.length > 0 ? (
                  meeting.actionItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-12px bg-carbon-plate border-2 border-basalt-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-8px flex-1">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          disabled
                          className="w-16px h-16px"
                        />
                        <span className={clsx(
                          "font-mono text-brutal-sm",
                          item.completed && "line-through text-cathode-white/60"
                        )}>
                          {item.description}
                        </span>
                      </div>
                      {!item.createdTaskId && meeting.projectId && (
                        <button
                          onClick={() => handleConvertToTask(item.id)}
                          className="brutal-btn-sm"
                        >
                          CONVERT TO TASK
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-cathode-white/60 font-mono text-brutal-sm mb-12px">NO ACTION ITEMS YET</p>
                )}

                {isPast && (
                  <div className="flex gap-8px">
                    <input
                      type="text"
                      value={newActionItem}
                      onChange={(e) => setNewActionItem(e.target.value)}
                      placeholder="ADD NEW ACTION ITEM..."
                      className="flex-1 px-16px py-12px bg-carbon-plate border-2 border-basalt-border font-mono text-brutal-sm placeholder:text-neutral-600 focus:border-primary-brutalist focus:outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddActionItem()}
                    />
                    <button
                      onClick={handleAddActionItem}
                      disabled={isAddingAction || !newActionItem.trim()}
                      className="brutal-btn"
                    >
                      <HiOutlinePlus className="w-16px h-16px" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-16px justify-end">
          {onViewNotes && (
            <button
              onClick={onViewNotes}
              className="brutal-btn-secondary"
            >
              VIEW NOTES
            </button>
          )}
          <button
            onClick={onClose}
            className="brutal-btn"
          >
            CLOSE
          </button>
        </div>
      </div>
    </BrutalModal>
  )
}