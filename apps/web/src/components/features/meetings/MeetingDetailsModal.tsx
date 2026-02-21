import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import BrutalModal from "../../ui/BrutalModal";
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
  HiOutlineRefresh,
} from "react-icons/hi";
import clsx from "clsx";

interface MeetingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: any;
  currentUserId?: string;
  onEdit?: () => void;
  onViewNotes?: () => void;
}

// --- Sub-components ---

interface MeetingHeaderProps {
  meeting: any;
  typeConfig: { icon: string; color: string; label: string };
  isOrganizer: boolean;
  isHappening: boolean;
  isPast: boolean;
  onEdit?: () => void;
  onDelete: () => void;
}

function MeetingHeader({
  meeting,
  typeConfig,
  isOrganizer,
  isHappening,
  isPast,
  onEdit,
  onDelete,
}: MeetingHeaderProps) {
  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[10px]">
      <div className="flex items-start justify-between mb-[6px]">
        <div className="flex items-center gap-[6px]">
          <div
            className={clsx(
              "w-6 h-6 flex items-center justify-center text-[var(--theme-background)] text-2xl border-4",
              typeConfig.color,
            )}
          >
            {typeConfig.icon}
          </div>
          <div>
            <h2 className="font-mono text-xl font-bold uppercase">
              {meeting.title}
            </h2>
            <div className="flex items-center gap-[4px] text-brutal-xs text-[var(--theme-foreground)]/60">
              <span className="uppercase">{typeConfig.label}</span>
              {isHappening && (
                <span className="flex items-center gap-4px text-[var(--theme-success)]">
                  <div className="w-6px h-6px bg-[var(--theme-success)] animate-pulse"></div>
                  LIVE NOW
                </span>
              )}
              {isPast && <span>COMPLETED</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-[4px]">
          {meeting.meetingUrl && (
            <button
              onClick={() => window.open(meeting.meetingUrl, "_blank")}
              className="brutal-btn-sm bg-[var(--theme-primary)]"
            >
              <HiOutlineExternalLink className="w-16px h-16px mr-4px" />
              JOIN
            </button>
          )}
          {isOrganizer && (
            <>
              {onEdit && (
                <button onClick={onEdit} className="brutal-btn-sm">
                  <HiOutlinePencil className="w-16px h-16px" />
                </button>
              )}
              <button
                onClick={onDelete}
                className="brutal-btn-sm bg-[var(--theme-error)]"
              >
                <HiOutlineTrash className="w-16px h-16px" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[6px]">
        <div className="flex items-center gap-[4px] text-brutal-sm">
          <HiOutlineCalendar className="w-16px h-16px text-[var(--theme-primary)]" />
          <span className="font-mono">
            {format(new Date(meeting.startTime), "EEEE, MMMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-[4px] text-brutal-sm">
          <HiOutlineClock className="w-16px h-16px text-[var(--theme-primary)]" />
          <span className="font-mono">
            {format(new Date(meeting.startTime), "h:mm a")} -{" "}
            {format(new Date(meeting.endTime), "h:mm a")}
          </span>
          {meeting.startTime > Date.now() && (
            <span className="text-brutal-xs text-[var(--theme-foreground)]/60">
              (
              {formatDistanceToNow(new Date(meeting.startTime), {
                addSuffix: true,
              })}
              )
            </span>
          )}
        </div>
        {meeting.location && (
          <div className="flex items-center gap-[4px] text-brutal-sm">
            <HiOutlineLocationMarker className="w-16px h-16px text-[var(--theme-primary)]" />
            <span className="font-mono">{meeting.location}</span>
          </div>
        )}
        {meeting.meetingUrl && (
          <div className="flex items-center gap-[4px] text-brutal-sm">
            <HiOutlineVideoCamera className="w-16px h-16px text-[var(--theme-primary)]" />
            <span className="font-mono">VIDEO CALL</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface MeetingResponseSectionProps {
  userResponse: string;
  isResponding: boolean;
  onResponse: (status: "accepted" | "declined" | "tentative") => void;
}

function MeetingResponseSection({
  userResponse,
  isResponding,
  onResponse,
}: MeetingResponseSectionProps) {
  return (
    <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-[10px]">
      <h3 className="font-mono text-brutal-sm uppercase mb-[6px]">
        YOUR RESPONSE
      </h3>
      <div className="flex items-center gap-[4px]">
        <button
          onClick={() => onResponse("accepted")}
          disabled={isResponding}
          className={clsx(
            "flex-1 px-[10px] py-[8px] font-mono text-brutal-sm uppercase border-2 transition-colors",
            userResponse === "accepted"
              ? "bg-[var(--theme-success)] border-[var(--theme-success)] text-[var(--theme-background)]"
              : "bg-[var(--theme-background)] border-[var(--theme-border)] hover:border-[var(--theme-success)]",
          )}
        >
          <HiOutlineCheck className="inline w-16px h-16px mr-[4px]" />
          ACCEPT
        </button>
        <button
          onClick={() => onResponse("tentative")}
          disabled={isResponding}
          className={clsx(
            "flex-1 px-[10px] py-[8px] font-mono text-brutal-sm uppercase border-2 transition-colors",
            userResponse === "tentative"
              ? "bg-[var(--theme-warning)] border-[var(--theme-warning)] text-[var(--theme-background)]"
              : "bg-[var(--theme-background)] border-[var(--theme-border)] hover:border-[var(--theme-warning)]",
          )}
        >
          <HiOutlineExclamationCircle className="inline w-16px h-16px mr-[4px]" />
          MAYBE
        </button>
        <button
          onClick={() => onResponse("declined")}
          disabled={isResponding}
          className={clsx(
            "flex-1 px-[10px] py-[8px] font-mono text-brutal-sm uppercase border-2 transition-colors",
            userResponse === "declined"
              ? "bg-[var(--theme-error)] border-[var(--theme-error)] text-[var(--theme-background)]"
              : "bg-[var(--theme-background)] border-[var(--theme-border)] hover:border-[var(--theme-error)]",
          )}
        >
          <HiOutlineX className="inline w-16px h-16px mr-[4px]" />
          DECLINE
        </button>
      </div>
    </div>
  );
}

interface AttendeesTabContentProps {
  meeting: any;
  acceptedCount: number;
  pendingCount: number;
  tentativeCount: number;
  declinedCount: number;
  getStatusIcon: (status: string) => React.ReactNode;
}

function AttendeesTabContent({
  meeting,
  acceptedCount,
  pendingCount,
  tentativeCount,
  declinedCount,
  getStatusIcon,
}: AttendeesTabContentProps) {
  return (
    <div className="space-y-[6px]">
      <div className="grid grid-cols-2 gap-[4px] mb-[8px]">
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[4px] text-center">
          <div className="text-2xl font-mono">{acceptedCount}</div>
          <div className="text-brutal-xs text-[var(--theme-foreground)]/60 uppercase">
            ACCEPTED
          </div>
        </div>
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[4px] text-center">
          <div className="text-2xl font-mono">{pendingCount}</div>
          <div className="text-brutal-xs text-[var(--theme-foreground)]/60 uppercase">
            PENDING
          </div>
        </div>
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[4px] text-center">
          <div className="text-2xl font-mono">{tentativeCount}</div>
          <div className="text-brutal-xs text-[var(--theme-foreground)]/60 uppercase">
            TENTATIVE
          </div>
        </div>
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[4px] text-center">
          <div className="text-2xl font-mono">{declinedCount}</div>
          <div className="text-brutal-xs text-[var(--theme-foreground)]/60 uppercase">
            DECLINED
          </div>
        </div>
      </div>

      <div className="space-y-[4px]">
        {meeting.attendees?.map((attendee: any) => (
          <div
            key={attendee.userId}
            className="flex items-center justify-between p-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]"
          >
            <div className="flex items-center gap-[6px]">
              {attendee.user?.avatarUrl ? (
                <img
                  src={attendee.user.avatarUrl}
                  alt={attendee.user.name}
                  className="w-5 h-5 border-2 border-[var(--theme-border)]"
                />
              ) : (
                <div className="w-5 h-5 border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] flex items-center justify-center font-mono text-brutal-sm">
                  {attendee.user?.name?.charAt(0) || "?"}
                </div>
              )}
              <div>
                <div className="font-mono text-brutal-sm">
                  {attendee.user?.name || "Unknown"}
                </div>
                <div className="font-mono text-brutal-xs text-[var(--theme-foreground)]/60">
                  {attendee.user?.email}
                </div>
              </div>
              {attendee.userId === meeting.organizerId && (
                <span className="px-[4px] py-2px bg-[var(--theme-primary)] text-[var(--theme-background)] font-mono text-brutal-xs uppercase">
                  ORGANIZER
                </span>
              )}
            </div>
            <div className="flex items-center gap-4px">
              {getStatusIcon(attendee.status)}
              <span className="font-mono text-brutal-xs uppercase">
                {attendee.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ActionsTabContentProps {
  meeting: any;
  isPast: boolean;
  newActionItem: string;
  isAddingAction: boolean;
  onNewActionItemChange: (value: string) => void;
  onAddActionItem: () => void;
  onConvertToTask: (actionItemId: string) => void;
}

function ActionsTabContent({
  meeting,
  isPast,
  newActionItem,
  isAddingAction,
  onNewActionItemChange,
  onAddActionItem,
  onConvertToTask,
}: ActionsTabContentProps) {
  return (
    <div className="space-y-[6px]">
      {meeting.actionItems && meeting.actionItems.length > 0 ? (
        meeting.actionItems.map((item: any) => (
          <div
            key={item.id}
            className="p-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)] flex items-center justify-between"
          >
            <div className="flex items-center gap-[4px] flex-1">
              <input
                type="checkbox"
                checked={item.completed}
                disabled
                aria-label={`Action item: ${item.text || "task"}`}
                className="w-16px h-16px"
              />
              <span
                className={clsx(
                  "font-mono text-brutal-sm",
                  item.completed &&
                    "line-through text-[var(--theme-foreground)]/60",
                )}
              >
                {item.description}
              </span>
            </div>
            {!item.createdTaskId && meeting.projectId && (
              <button
                onClick={() => onConvertToTask(item.id)}
                className="brutal-btn-sm"
              >
                CONVERT TO TASK
              </button>
            )}
          </div>
        ))
      ) : (
        <p className="text-[var(--theme-foreground)]/60 font-mono text-brutal-sm mb-[6px]">
          NO ACTION ITEMS YET
        </p>
      )}

      {isPast && (
        <div className="flex gap-[4px]">
          <input
            type="text"
            value={newActionItem}
            onChange={(e) => onNewActionItemChange(e.target.value)}
            placeholder="ADD NEW ACTION ITEM..."
            className="flex-1 px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm placeholder:text-[var(--theme-foreground-secondary)] focus:border-[var(--theme-primary)] focus:outline-none"
            onKeyPress={(e) => e.key === "Enter" && onAddActionItem()}
          />
          <button
            onClick={onAddActionItem}
            disabled={isAddingAction || !newActionItem.trim()}
            className="brutal-btn"
          >
            <HiOutlinePlus className="w-16px h-16px" />
          </button>
        </div>
      )}
    </div>
  );
}

// --- Main Component ---

const meetingTypeConfig = {
  standup: {
    icon: "🏃",
    color: "bg-[var(--theme-info)] border-[var(--theme-info)]",
    label: "DAILY STANDUP",
  },
  retrospective: {
    icon: "🔄",
    color: "bg-[var(--theme-warning)] border-[var(--theme-warning)]",
    label: "RETROSPECTIVE",
  },
  planning: {
    icon: "📋",
    color: "bg-[var(--theme-primary)] border-[var(--theme-primary)]",
    label: "SPRINT PLANNING",
  },
  review: {
    icon: "👥",
    color: "bg-[var(--theme-success)] border-[var(--theme-success)]",
    label: "SPRINT REVIEW",
  },
  custom: {
    icon: "⚙️",
    color:
      "bg-[var(--theme-foreground-secondary)] border-[var(--theme-foreground-secondary)]",
    label: "CUSTOM MEETING",
  },
};

export default function MeetingDetailsModal({
  isOpen,
  onClose,
  meeting,
  currentUserId,
  onEdit,
  onViewNotes,
}: MeetingDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<
    "details" | "attendees" | "agenda" | "actions"
  >("details");
  const [isResponding, setIsResponding] = useState(false);
  const [newActionItem, setNewActionItem] = useState("");
  const [isAddingAction, setIsAddingAction] = useState(false);

  const respondToMeeting = useMutation(api.meetings.mutations.respondToMeeting);
  const deleteMeeting = useMutation(api.meetings.mutations.deleteMeeting);
  const addActionItem = useMutation(api.meetings.mutations.addActionItem);
  const convertActionItemToTask = useMutation(
    api.meetings.mutations.convertActionItemToTask,
  );

  if (!meeting) return null;

  const typeConfig =
    meetingTypeConfig[meeting.type as keyof typeof meetingTypeConfig] ||
    meetingTypeConfig.custom;
  const isOrganizer = currentUserId === meeting.organizerId;
  const currentUserAttendee = meeting.attendees?.find(
    (a: any) => a.userId === currentUserId,
  );
  const userResponse = currentUserAttendee?.status || "pending";

  const now = Date.now();
  const isUpcoming = meeting.startTime > now;
  const isHappening = meeting.startTime <= now && meeting.endTime > now;
  const isPast = meeting.endTime < now;

  const acceptedCount =
    meeting.attendees?.filter((a: any) => a.status === "accepted").length || 0;
  const declinedCount =
    meeting.attendees?.filter((a: any) => a.status === "declined").length || 0;
  const tentativeCount =
    meeting.attendees?.filter((a: any) => a.status === "tentative").length || 0;
  const pendingCount =
    meeting.attendees?.filter((a: any) => a.status === "pending").length || 0;

  const handleResponse = async (
    status: "accepted" | "declined" | "tentative",
  ) => {
    if (!currentUserId) return;

    setIsResponding(true);
    try {
      await respondToMeeting({
        meetingId: meeting._id,
        status,
      });
      toast.success(`Meeting ${status}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to respond to meeting");
    } finally {
      setIsResponding(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;

    try {
      await deleteMeeting({ meetingId: meeting._id });
      toast.success("Meeting deleted");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete meeting");
    }
  };

  const handleAddActionItem = async () => {
    if (!newActionItem.trim()) return;

    setIsAddingAction(true);
    try {
      await addActionItem({
        meetingId: meeting._id,
        description: newActionItem.trim(),
        assigneeId: currentUserId as any,
      });
      toast.success("Action item added");
      setNewActionItem("");
    } catch (error: any) {
      toast.error(error.message || "Failed to add action item");
    } finally {
      setIsAddingAction(false);
    }
  };

  const handleConvertToTask = async (actionItemId: string) => {
    try {
      await convertActionItemToTask({
        meetingId: meeting._id,
        actionItemId,
      });
      toast.success("Converted to task");
    } catch (error: any) {
      toast.error(error.message || "Failed to convert to task");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <HiOutlineCheck className="w-14px h-14px text-[var(--theme-success)]" />
        );
      case "declined":
        return (
          <HiOutlineX className="w-14px h-14px text-[var(--theme-error)]" />
        );
      case "tentative":
        return (
          <HiOutlineExclamationCircle className="w-14px h-14px text-[var(--theme-warning)]" />
        );
      default:
        return (
          <HiOutlineClock className="w-14px h-14px text-[var(--theme-foreground)]/60" />
        );
    }
  };

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="MEETING DETAILS"
      size="lg"
    >
      <div className="space-y-[12px]">
        {/* Header */}
        <MeetingHeader
          meeting={meeting}
          typeConfig={typeConfig}
          isOrganizer={isOrganizer}
          isHappening={isHappening}
          isPast={isPast}
          onEdit={onEdit}
          onDelete={handleDelete}
        />

        {/* Your Response */}
        {currentUserId && !isOrganizer && isUpcoming && (
          <MeetingResponseSection
            userResponse={userResponse}
            isResponding={isResponding}
            onResponse={handleResponse}
          />
        )}

        {/* Tabs */}
        <div className="border-2 border-[var(--theme-border)]">
          <div className="flex border-b-2 border-[var(--theme-border)]">
            {(["details", "attendees", "agenda", "actions"] as const).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    "flex-1 px-[10px] py-[8px] font-mono text-brutal-sm uppercase transition-colors",
                    activeTab === tab
                      ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                      : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]/20",
                  )}
                >
                  {tab === "details" && (
                    <HiOutlineDocumentText className="inline w-16px h-16px mr-[4px]" />
                  )}
                  {tab === "attendees" && (
                    <HiOutlineUsers className="inline w-16px h-16px mr-[4px]" />
                  )}
                  {tab === "agenda" && (
                    <HiOutlineClipboardList className="inline w-16px h-16px mr-[4px]" />
                  )}
                  {tab === "actions" && (
                    <HiOutlineCheck className="inline w-16px h-16px mr-[4px]" />
                  )}
                  {tab}
                </button>
              ),
            )}
          </div>

          <div className="p-[10px] bg-[var(--theme-background-secondary)] min-h-200px">
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-[8px]">
                {meeting.description && (
                  <div>
                    <h4 className="font-mono text-brutal-xs uppercase text-[var(--theme-foreground)]/60 mb-[4px]">
                      DESCRIPTION
                    </h4>
                    <p className="font-mono text-brutal-sm">
                      {meeting.description}
                    </p>
                  </div>
                )}
                {meeting.recurrence && (
                  <div>
                    <h4 className="font-mono text-brutal-xs uppercase text-[var(--theme-foreground)]/60 mb-[4px]">
                      RECURRENCE
                    </h4>
                    <div className="flex items-center gap-[4px]">
                      <HiOutlineRefresh className="w-16px h-16px text-[var(--theme-primary)]" />
                      <span className="font-mono text-brutal-sm uppercase">
                        {meeting.recurrence.frequency} (EVERY{" "}
                        {meeting.recurrence.interval}{" "}
                        {meeting.recurrence.frequency === "daily"
                          ? "DAY"
                          : meeting.recurrence.frequency === "weekly"
                            ? "WEEK"
                            : "MONTH"}
                        )
                      </span>
                    </div>
                  </div>
                )}
                {meeting.projectId && (
                  <div>
                    <h4 className="font-mono text-brutal-xs uppercase text-[var(--theme-foreground)]/60 mb-[4px]">
                      PROJECT
                    </h4>
                    <p className="font-mono text-brutal-sm">PROJECT MEETING</p>
                  </div>
                )}
              </div>
            )}

            {/* Attendees Tab */}
            {activeTab === "attendees" && (
              <AttendeesTabContent
                meeting={meeting}
                acceptedCount={acceptedCount}
                pendingCount={pendingCount}
                tentativeCount={tentativeCount}
                declinedCount={declinedCount}
                getStatusIcon={getStatusIcon}
              />
            )}

            {/* Agenda Tab */}
            {activeTab === "agenda" && (
              <div className="space-y-[4px]">
                {meeting.template?.agenda &&
                meeting.template.agenda.length > 0 ? (
                  meeting.template.agenda.map(
                    (item: string, agendaIdx: number) => (
                      <div
                        key={item}
                        className="p-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]"
                      >
                        <span className="font-mono text-brutal-xs text-[var(--theme-primary)] mr-[4px]">
                          {(agendaIdx + 1).toString().padStart(2, "0")}.
                        </span>
                        <span className="font-mono text-brutal-sm uppercase">
                          {item}
                        </span>
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-[var(--theme-foreground)]/60 font-mono text-brutal-sm">
                    NO AGENDA ITEMS
                  </p>
                )}
              </div>
            )}

            {/* Actions Tab */}
            {activeTab === "actions" && (
              <ActionsTabContent
                meeting={meeting}
                isPast={isPast}
                newActionItem={newActionItem}
                isAddingAction={isAddingAction}
                onNewActionItemChange={setNewActionItem}
                onAddActionItem={handleAddActionItem}
                onConvertToTask={handleConvertToTask}
              />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-[8px] justify-end">
          {onViewNotes && (
            <button onClick={onViewNotes} className="brutal-btn-secondary">
              VIEW NOTES
            </button>
          )}
          <button onClick={onClose} className="brutal-btn">
            CLOSE
          </button>
        </div>
      </div>
    </BrutalModal>
  );
}
