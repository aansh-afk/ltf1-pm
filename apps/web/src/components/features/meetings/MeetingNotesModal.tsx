import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'
import {
  HiOutlinePencil,
  HiOutlineSave,
  HiOutlineX,
  HiOutlineDocumentText,
  HiOutlineClipboardCopy,
  HiOutlineDownload,
  HiOutlineClock,
  HiOutlineUser
} from 'react-icons/hi'
import { format } from 'date-fns'

interface MeetingNotesModalProps {
  isOpen: boolean
  onClose: () => void
  meeting: any
  currentUserId?: string
}

export default function MeetingNotesModal({
  isOpen,
  onClose,
  meeting,
  currentUserId
}: MeetingNotesModalProps) {
  const [notes, setNotes] = useState(meeting?.notes || '')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const updateMeeting = useMutation(api.meetings.mutations.updateMeeting)

  useEffect(() => {
    if (meeting?.notes) {
      setNotes(meeting.notes)
    }
  }, [meeting])

  const isOrganizer = currentUserId === meeting?.organizerId
  const canEdit = isOrganizer || meeting?.attendees?.some((a: any) => 
    a.userId === currentUserId && a.status === 'accepted'
  )

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateMeeting({
        meetingId: meeting._id,
        notes: notes
      })
      toast.success('Notes saved')
      setIsEditing(false)
      setLastSaved(new Date())
    } catch (error: any) {
      toast.error(error.message || 'Failed to save notes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(notes)
    toast.success('Notes copied to clipboard')
  }

  const handleDownload = () => {
    const blob = new Blob([`MEETING NOTES\n\nTitle: ${meeting.title}\nDate: ${format(new Date(meeting.startTime), 'MMMM d, yyyy')}\nTime: ${format(new Date(meeting.startTime), 'h:mm a')} - ${format(new Date(meeting.endTime), 'h:mm a')}\n\n---\n\nNOTES:\n${notes}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting-notes-${meeting.title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(meeting.startTime), 'yyyy-MM-dd')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Notes downloaded')
  }

  const generateTemplate = () => {
    const attendeesList = meeting.attendees?.map((a: any) => 
      `- ${a.user?.name || 'Unknown'} (${a.status})`
    ).join('\n')

    const agendaItems = meeting.template?.agenda?.map((item: string, index: number) => 
      `${index + 1}. ${item}\\n   - [Notes here]`
    ).join('\n\n')

    const template = `MEETING NOTES
================

DATE: ${format(new Date(meeting.startTime), 'MMMM d, yyyy')}
TIME: ${format(new Date(meeting.startTime), 'h:mm a')} - ${format(new Date(meeting.endTime), 'h:mm a')}
TYPE: ${meeting.type.toUpperCase()}

ATTENDEES:
${attendeesList || '- No attendees'}

AGENDA:
${agendaItems || '- No agenda items'}

KEY DISCUSSIONS:
- [Add discussion points]

DECISIONS MADE:
- [Add decisions]

ACTION ITEMS:
- [ ] [Action item 1] - @[Assignee] - Due: [Date]
- [ ] [Action item 2] - @[Assignee] - Due: [Date]

NEXT STEPS:
- [Next step 1]
- [Next step 2]

BLOCKERS/ISSUES:
- [List any blockers]

NOTES:
[Additional notes here]
`
    setNotes(template)
    setIsEditing(true)
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="MEETING NOTES"
      size="lg"
    >
      <div className="space-y-24px">
        {/* Header */}
        <div className="bg-carbon-plate border-2 border-basalt-border p-16px">
          <div className="flex items-center justify-between mb-12px">
            <div>
              <h2 className="font-mono text-lg font-bold uppercase">{meeting?.title}</h2>
              <div className="flex items-center gap-12px text-brutal-xs text-cathode-white/60">
                <span className="flex items-center gap-4px">
                  <HiOutlineClock className="w-12px h-12px" />
                  {format(new Date(meeting.startTime), 'MMM d, yyyy h:mm a')}
                </span>
                {lastSaved && (
                  <span className="flex items-center gap-4px">
                    <HiOutlineSave className="w-12px h-12px" />
                    LAST SAVED: {format(lastSaved, 'h:mm a')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-8px">
              {!notes && !isEditing && (
                <button
                  onClick={generateTemplate}
                  className="brutal-btn-sm bg-primary-brutalist"
                >
                  <HiOutlineDocumentText className="w-16px h-16px mr-4px" />
                  GENERATE TEMPLATE
                </button>
              )}
              {notes && !isEditing && (
                <>
                  <button
                    onClick={handleCopy}
                    className="brutal-btn-sm"
                  >
                    <HiOutlineClipboardCopy className="w-16px h-16px" />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="brutal-btn-sm"
                  >
                    <HiOutlineDownload className="w-16px h-16px" />
                  </button>
                </>
              )}
              {canEdit && (
                <>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="brutal-btn-sm bg-primary-brutalist"
                    >
                      <HiOutlinePencil className="w-16px h-16px mr-4px" />
                      EDIT
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="brutal-btn-sm bg-brutal-success"
                      >
                        <HiOutlineSave className="w-16px h-16px mr-4px" />
                        {isSaving ? 'SAVING...' : 'SAVE'}
                      </button>
                      <button
                        onClick={() => {
                          setNotes(meeting?.notes || '')
                          setIsEditing(false)
                        }}
                        className="brutal-btn-sm bg-brutal-error"
                      >
                        <HiOutlineX className="w-16px h-16px" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes Editor/Viewer */}
        <div className="bg-event-horizon border-4 border-basalt-border">
          {isEditing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-400px p-16px bg-carbon-plate border-0 font-mono text-brutal-sm text-cathode-white placeholder:text-neutral-600 focus:outline-none resize-none"
              placeholder="ADD YOUR MEETING NOTES HERE...

USE MARKDOWN FOR FORMATTING:
# HEADING
## SUBHEADING
- BULLET POINT
[ ] TODO ITEM
**BOLD TEXT**"
              autoFocus
            />
          ) : (
            <div className="min-h-400px p-16px">
              {notes ? (
                <pre className="font-mono text-brutal-sm whitespace-pre-wrap break-words">
                  {notes}
                </pre>
              ) : (
                <div className="text-center py-48px">
                  <HiOutlineDocumentText className="w-48px h-48px mx-auto mb-16px text-cathode-white/30" />
                  <p className="text-cathode-white/60 font-mono text-brutal-sm uppercase mb-16px">
                    NO NOTES YET
                  </p>
                  {canEdit && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="brutal-btn-primary"
                    >
                      ADD NOTES
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Participants who can edit */}
        {meeting?.attendees && (
          <div className="bg-carbon-plate border-2 border-basalt-border p-12px">
            <div className="flex items-center gap-8px text-brutal-xs text-cathode-white/60">
              <HiOutlineUser className="w-14px h-14px" />
              <span className="uppercase">Can Edit:</span>
              <div className="flex items-center gap-8px">
                {meeting.attendees
                  .filter((a: any) => a.status === 'accepted' || a.userId === meeting.organizerId)
                  .map((a: any) => (
                    <span key={a.userId} className="px-8px py-2px bg-event-horizon border border-basalt-border">
                      {a.user?.name || 'Unknown'}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-16px justify-end pt-16px border-t-2 border-basalt-border">
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