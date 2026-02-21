import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import {
  HiOutlineVideoCamera,
  HiOutlineLocationMarker,
  HiOutlineUsers,
  HiOutlineDotsVertical,
  HiOutlinePlay,
  HiOutlineDocument,
  HiOutlinePencil,
  HiOutlineLightningBolt,
  HiOutlineRefresh,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineCog,
} from "react-icons/hi";
import { formatDistanceToNow, format } from "date-fns";
import clsx from "clsx";
import toast from "react-hot-toast";

interface MeetingCardProps {
  meeting: any;
  currentUserId?: string;
  onEdit?: (meeting: any) => void;
  onViewNotes?: (meeting: any) => void;
}

const meetingTypeConfig = {
  standup: {
    icon: HiOutlineLightningBolt,
    label: "STANDUP",
    color: "var(--theme-info)",
  },
  retrospective: {
    icon: HiOutlineRefresh,
    label: "RETROSPECTIVE",
    color: "var(--theme-warning)",
  },
  planning: {
    icon: HiOutlineClipboardList,
    label: "PLANNING",
    color: "var(--theme-primary)",
  },
  review: {
    icon: HiOutlineUserGroup,
    label: "REVIEW",
    color: "var(--theme-success)",
  },
  custom: {
    icon: HiOutlineCog,
    label: "CUSTOM",
    color: "var(--theme-foreground)",
  },
};

export default function MeetingCard({
  meeting,
  currentUserId,
  onEdit,
  onViewNotes,
}: MeetingCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const respondToMeeting = useMutation(api.meetings.mutations.respondToMeeting);

  const typeConfig =
    meetingTypeConfig[meeting.type as keyof typeof meetingTypeConfig] ||
    meetingTypeConfig.custom;
  const TypeIcon = typeConfig.icon;
  const isOrganizer = currentUserId === meeting.organizerId;
  const userAttendee = meeting.attendees?.find(
    (a: any) => a.userId === currentUserId,
  );
  const userResponse = userAttendee?.status || "pending";

  const now = Date.now();
  const isUpcoming = meeting.startTime > now;
  const isHappening = meeting.startTime <= now && meeting.endTime > now;

  const acceptedCount =
    meeting.attendees?.filter((a: any) => a.status === "accepted").length || 0;
  const totalAttendees = meeting.attendees?.length || 0;

  const handleResponse = async (
    status: "accepted" | "declined" | "tentative",
  ) => {
    if (!currentUserId) return;
    setIsResponding(true);
    try {
      await respondToMeeting({ meetingId: meeting._id, status });
      toast.success(`Meeting ${status}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to respond");
    } finally {
      setIsResponding(false);
    }
  };

  const rsvpColor = (status: string) => {
    if (status === "accepted") return "var(--theme-success)";
    if (status === "declined") return "var(--theme-error)";
    if (status === "tentative") return "var(--theme-warning)";
    return "var(--theme-border)";
  };

  return (
    <div
      className={clsx(
        "flex border-2 transition-colors hover:border-[var(--theme-primary)]/50 bg-[var(--theme-background)]",
        isHappening
          ? "border-[var(--theme-success)]"
          : "border-[var(--theme-border)]",
      )}
    >
      {/* ── Left: date/time column ── */}
      <div
        className="w-[100px] shrink-0 flex flex-col items-center justify-center px-3 py-4 border-r-2 border-[var(--theme-border)] text-center"
        style={{ borderLeft: `3px solid ${typeConfig.color}` }}
      >
        {isHappening ? (
          <div className="flex items-center gap-1 mb-1">
            <span
              className="w-1.5 h-1.5 animate-pulse"
              style={{ backgroundColor: "var(--theme-success)" }}
            />
            <span
              className="font-mono text-[9px] font-bold uppercase"
              style={{ color: "var(--theme-success)" }}
            >
              LIVE
            </span>
          </div>
        ) : (
          <div className="font-mono text-[9px] text-[var(--theme-foreground)]/40 uppercase mb-1">
            {isUpcoming
              ? formatDistanceToNow(new Date(meeting.startTime), {
                  addSuffix: false,
                }).toUpperCase()
              : "PAST"}
          </div>
        )}
        <div className="font-mono text-lg font-bold leading-none text-[var(--theme-foreground)]">
          {format(new Date(meeting.startTime), "d")}
        </div>
        <div className="font-mono text-[9px] uppercase text-[var(--theme-foreground)]/50 mb-2">
          {format(new Date(meeting.startTime), "MMM")}
        </div>
        <div className="font-mono text-[10px] text-[var(--theme-foreground)]/60">
          {format(new Date(meeting.startTime), "h:mm")}
          <span className="text-[8px]">
            {format(new Date(meeting.startTime), "a")}
          </span>
        </div>
        <div className="font-mono text-[9px] text-[var(--theme-foreground)]/30">
          {format(new Date(meeting.endTime), "h:mm")}
          <span className="text-[8px]">
            {format(new Date(meeting.endTime), "a")}
          </span>
        </div>
      </div>

      {/* ── Right: details ── */}
      <div className="flex-1 min-w-0 px-4 py-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <TypeIcon
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: typeConfig.color }}
            />
            <h3 className="font-mono text-sm font-bold uppercase truncate text-[var(--theme-foreground)]">
              {meeting.title}
            </h3>
            <span
              className="shrink-0 px-1.5 py-0.5 border font-mono text-[9px] font-bold uppercase"
              style={{
                color: typeConfig.color,
                borderColor: `color-mix(in srgb, ${typeConfig.color} 30%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${typeConfig.color} 8%, transparent)`,
              }}
            >
              {typeConfig.label}
            </span>
          </div>

          {/* Kebab menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-[var(--theme-foreground)]/30 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)] border border-transparent hover:border-[var(--theme-border)] transition-colors"
            >
              <HiOutlineDotsVertical className="w-3.5 h-3.5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-0.5 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] z-20 min-w-[140px]">
                {meeting.meetingUrl && (
                  <button
                    onClick={() => window.open(meeting.meetingUrl, "_blank")}
                    className="w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase hover:bg-[var(--theme-primary)] hover:text-[var(--theme-background)] flex items-center gap-2 transition-colors"
                  >
                    <HiOutlinePlay className="w-3 h-3" /> JOIN
                  </button>
                )}
                {onViewNotes && (
                  <button
                    onClick={() => {
                      onViewNotes(meeting);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase hover:bg-[var(--theme-primary)] hover:text-[var(--theme-background)] flex items-center gap-2 transition-colors"
                  >
                    <HiOutlineDocument className="w-3 h-3" /> NOTES
                  </button>
                )}
                {isOrganizer && onEdit && (
                  <button
                    onClick={() => {
                      onEdit(meeting);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase hover:bg-[var(--theme-primary)] hover:text-[var(--theme-background)] flex items-center gap-2 transition-colors"
                  >
                    <HiOutlinePencil className="w-3 h-3" /> EDIT
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {meeting.description && (
          <p className="font-mono text-[10px] text-[var(--theme-foreground)]/60 mb-2 border-l-2 border-[var(--theme-border)] pl-2">
            {meeting.description}
          </p>
        )}

        {/* Meta row: location, video, attendees */}
        <div className="flex items-center gap-4 flex-wrap mb-2">
          {meeting.location && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--theme-foreground)]/50">
              <HiOutlineLocationMarker className="w-3 h-3" />
              {meeting.location}
            </span>
          )}
          {meeting.meetingUrl && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--theme-foreground)]/50">
              <HiOutlineVideoCamera className="w-3 h-3" />
              VIDEO CALL
            </span>
          )}
          <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--theme-foreground)]/50">
            <HiOutlineUsers className="w-3 h-3" />
            {acceptedCount}/{totalAttendees} ACCEPTED
          </span>
          {isOrganizer && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 border border-[var(--theme-border)] text-[var(--theme-foreground)]/40 uppercase">
              ORGANIZER
            </span>
          )}
        </div>

        {/* Attendee dots */}
        {meeting.attendees && meeting.attendees.length > 0 && (
          <div className="flex items-center gap-0.5 mb-3">
            {meeting.attendees.slice(0, 8).map((attendee: any) => (
              <div
                key={attendee.userId}
                className="w-5 h-5 border-2 flex items-center justify-center font-mono text-[8px] font-bold overflow-hidden"
                style={{ borderColor: rsvpColor(attendee.status) }}
                title={`${attendee.user?.name || "Unknown"} — ${attendee.status}`}
              >
                {attendee.user?.avatarUrl ? (
                  <img
                    src={attendee.user.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span style={{ color: rsvpColor(attendee.status) }}>
                    {attendee.user?.name?.charAt(0) || "?"}
                  </span>
                )}
              </div>
            ))}
            {totalAttendees > 8 && (
              <span className="font-mono text-[9px] text-[var(--theme-foreground)]/40 ml-1">
                +{totalAttendees - 8}
              </span>
            )}
          </div>
        )}

        {/* RSVP buttons (non-organizers, upcoming) */}
        {currentUserId && !isOrganizer && isUpcoming && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase text-[var(--theme-foreground)]/30 mr-1">
              RSVP:
            </span>
            {(["accepted", "tentative", "declined"] as const).map((status) => {
              const labels = {
                accepted: "YES",
                tentative: "MAYBE",
                declined: "NO",
              };
              const active = userResponse === status;
              return (
                <button
                  key={status}
                  onClick={() => handleResponse(status)}
                  disabled={isResponding}
                  className="px-2 py-0.5 border-2 font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer disabled:opacity-50"
                  style={{
                    borderColor: active
                      ? rsvpColor(status)
                      : "var(--theme-border)",
                    color: active
                      ? rsvpColor(status)
                      : "var(--theme-foreground)",
                    backgroundColor: active
                      ? `color-mix(in srgb, ${rsvpColor(status)} 10%, transparent)`
                      : "transparent",
                  }}
                >
                  {labels[status]}
                </button>
              );
            })}

            {/* Join button if live */}
            {isHappening && meeting.meetingUrl && (
              <button
                onClick={() => window.open(meeting.meetingUrl, "_blank")}
                className="ml-auto px-3 py-0.5 border-2 font-mono text-[10px] font-bold uppercase transition-colors"
                style={{
                  borderColor: "var(--theme-success)",
                  color: "var(--theme-success)",
                }}
              >
                JOIN NOW
              </button>
            )}
          </div>
        )}

        {/* Organizer join button if live */}
        {isOrganizer && isHappening && meeting.meetingUrl && (
          <button
            onClick={() => window.open(meeting.meetingUrl, "_blank")}
            className="px-3 py-0.5 border-2 font-mono text-[10px] font-bold uppercase transition-colors"
            style={{
              borderColor: "var(--theme-success)",
              color: "var(--theme-success)",
            }}
          >
            START MEETING
          </button>
        )}
      </div>
    </div>
  );
}
