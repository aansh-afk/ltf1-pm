import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
} from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineClipboardList,
  HiOutlineChatAlt2,
  HiOutlineAtSymbol,
  HiOutlineLightningBolt,
  HiOutlineCheckCircle,
  HiOutlineUserAdd,
  HiOutlineMailOpen,
  HiOutlineCode,
} from "react-icons/hi";

const TYPE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  task_assigned: HiOutlineClipboardList,
  task_comment: HiOutlineChatAlt2,
  task_mention: HiOutlineAtSymbol,
  sprint_started: HiOutlineLightningBolt,
  sprint_completed: HiOutlineCheckCircle,
  member_joined: HiOutlineUserAdd,
  pr_merged: HiOutlineCode,
};

const FALLBACK_ICON = HiOutlineMailOpen;

const TYPE_LABELS: Record<string, string> = {
  task_assigned: "ASSIGNED",
  task_comment: "COMMENT",
  task_mention: "MENTION",
  sprint_started: "SPRINT",
  sprint_completed: "SPRINT",
  member_joined: "TEAM",
  pr_merged: "GIT",
};

type DateGroup = "TODAY" | "YESTERDAY" | "THIS WEEK" | "OLDER";

interface NotificationCenterProps {
  workspaceId: Id<"workspaces">;
  onClose: () => void;
}

export default function NotificationCenter({
  workspaceId,
  onClose,
}: NotificationCenterProps) {
  const navigate = useNavigate();
  const notifications = useQuery(api.notificationQueries.getNotifications, {
    workspaceId,
    limit: 30,
  });
  const markAsRead = useMutation(api.notificationQueries.markAsRead);
  const markAllAsRead = useMutation(api.notificationQueries.markAllAsRead);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllAsRead({ workspaceId });
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleClick = async (
    notificationId: Id<"notifications">,
    link?: string,
  ) => {
    await markAsRead({ notificationId });
    if (link) {
      navigate(link);
      onClose();
    }
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const groupedNotifications = useMemo(() => {
    if (!notifications || notifications.length === 0) return null;

    const groups: Array<{ label: DateGroup; items: typeof notifications }> = [];
    const buckets: Record<DateGroup, typeof notifications> = {
      TODAY: [],
      YESTERDAY: [],
      "THIS WEEK": [],
      OLDER: [],
    };

    for (const n of notifications) {
      const date = new Date(n._creationTime);
      if (isToday(date)) {
        buckets["TODAY"].push(n);
      } else if (isYesterday(date)) {
        buckets["YESTERDAY"].push(n);
      } else if (isThisWeek(date)) {
        buckets["THIS WEEK"].push(n);
      } else {
        buckets["OLDER"].push(n);
      }
    }

    const order: Array<DateGroup> = [
      "TODAY",
      "YESTERDAY",
      "THIS WEEK",
      "OLDER",
    ];
    for (const label of order) {
      if (buckets[label].length > 0) {
        groups.push({ label, items: buckets[label] });
      }
    }

    return groups;
  }, [notifications]);

  const renderNotification = (
    notification: NonNullable<typeof notifications>[number],
  ) => {
    const IconComponent = TYPE_ICONS[notification.type] || FALLBACK_ICON;
    return (
      <button
        key={notification._id}
        onClick={() => handleClick(notification._id, notification.link)}
        className={`w-full text-left px-4 py-3 border-b border-[var(--theme-border)]/50 hover:bg-[var(--theme-background-secondary)] transition-colors ${
          !notification.isRead
            ? "border-l-2 border-l-[#6366F1] bg-[#6366F1]/5"
            : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-[var(--theme-foreground)]/60">
            <IconComponent className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-mono font-bold uppercase text-[var(--theme-foreground)]/40 tracking-wider">
                {TYPE_LABELS[notification.type] || notification.type}
              </span>
              <span className="text-[9px] font-mono text-[var(--theme-foreground)]/30">
                {formatDistanceToNow(new Date(notification._creationTime), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p
              className={`text-sm font-medium truncate ${!notification.isRead ? "text-[var(--theme-foreground)]" : "text-[var(--theme-foreground)]/70"}`}
            >
              {notification.title}
            </p>
            <p className="text-xs font-mono text-[var(--theme-foreground)]/50 truncate mt-0.5">
              {notification.body}
            </p>
          </div>
          {!notification.isRead && (
            <span className="w-2 h-2 bg-[#6366F1] shrink-0 mt-2" />
          )}
        </div>
      </button>
    );
  };

  return (
    <div
      className="w-[380px] max-h-[520px] flex flex-col bg-[var(--theme-background)] border-2 border-[var(--theme-border)]"
      style={{ boxShadow: "4px 4px 0px rgba(0,0,0,0.8)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[var(--theme-border)]">
        <div className="flex items-center gap-2">
          <h2 className="font-mono font-bold text-sm uppercase tracking-wide">
            NOTIFICATIONS
          </h2>
          {unreadCount > 0 && (
            <span className="bg-[var(--theme-error)] text-white text-[10px] font-mono font-bold px-1.5 py-0.5 min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="text-[10px] font-mono font-bold uppercase text-[#6366F1] hover:text-[#4F46E5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMarkingAll ? "MARKING..." : "MARK ALL READ"}
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] transition-colors p-1"
            aria-label="Close notifications"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {!notifications ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-4 h-4 border-2 border-[#6366F1] border-t-transparent animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <span className="text-2xl mb-2">0</span>
            <p className="font-mono text-xs text-[var(--theme-foreground)]/40 uppercase">
              NO NOTIFICATIONS
            </p>
          </div>
        ) : groupedNotifications ? (
          groupedNotifications.map((group) => (
            <div key={group.label}>
              <div className="sticky top-0 bg-[var(--theme-background)] border-b border-[var(--theme-border)] py-1 px-3 z-10">
                <span className="text-xs font-mono font-bold uppercase text-[var(--theme-foreground)]/40 tracking-wider">
                  {group.label}
                </span>
              </div>
              {group.items.map(renderNotification)}
            </div>
          ))
        ) : null}
      </div>
    </div>
  );
}
