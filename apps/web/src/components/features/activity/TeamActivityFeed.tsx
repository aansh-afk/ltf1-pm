import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import {
  HiOutlineTerminal,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineChat,
  HiOutlineCode,
  HiOutlineExclamationCircle,
  HiOutlinePlus,
} from "react-icons/hi";
import UserDisplay from "../user/UserDisplay";
import clsx from "clsx";

interface TeamActivityFeedProps {
  projectId: string;
  workspaceId?: string;
  limit?: number;
  showFilters?: boolean;
  className?: string;
}

const activityTypeConfig = {
  task_created: {
    icon: HiOutlinePlus,
    color: "var(--theme-success)",
    label: "CREATED TASK",
  },
  task_completed: {
    icon: HiOutlineCheckCircle,
    color: "var(--theme-success)",
    label: "COMPLETED",
  },
  task_status_changed: {
    icon: HiOutlineTerminal,
    color: "var(--theme-info)",
    label: "STATUS CHANGED",
  },
  task_assigned: {
    icon: HiOutlineUser,
    color: "var(--theme-info)",
    label: "ASSIGNED",
  },
  task_priority_changed: {
    icon: HiOutlineExclamationCircle,
    color: "var(--theme-warning)",
    label: "PRIORITY CHANGED",
  },
  task_time_started: {
    icon: HiOutlinePlay,
    color: "var(--theme-info)",
    label: "STARTED TIMER",
  },
  task_time_stopped: {
    icon: HiOutlinePause,
    color: "var(--theme-warning)",
    label: "STOPPED TIMER",
  },
  task_commented: {
    icon: HiOutlineChat,
    color: "var(--theme-primary)",
    label: "COMMENTED",
  },
  task_blocked: {
    icon: HiOutlineExclamationCircle,
    color: "var(--theme-error)",
    label: "BLOCKED",
  },
  task_unblocked: {
    icon: HiOutlineCheckCircle,
    color: "var(--theme-success)",
    label: "UNBLOCKED",
  },
  member_joined: {
    icon: HiOutlineUser,
    color: "var(--theme-success)",
    label: "JOINED TEAM",
  },
  member_removed: {
    icon: HiOutlineUser,
    color: "var(--theme-error)",
    label: "LEFT TEAM",
  },
  member_role_changed: {
    icon: HiOutlineUser,
    color: "var(--theme-info)",
    label: "ROLE CHANGED",
  },
  project_created: {
    icon: HiOutlineTerminal,
    color: "var(--theme-success)",
    label: "PROJECT CREATED",
  },
  project_updated: {
    icon: HiOutlineTerminal,
    color: "var(--theme-info)",
    label: "PROJECT UPDATED",
  },
  sprint_created: {
    icon: HiOutlineTerminal,
    color: "var(--theme-success)",
    label: "SPRINT CREATED",
  },
  sprint_started: {
    icon: HiOutlinePlay,
    color: "var(--theme-info)",
    label: "SPRINT STARTED",
  },
  sprint_completed: {
    icon: HiOutlineCheckCircle,
    color: "var(--theme-success)",
    label: "SPRINT COMPLETED",
  },
  meeting_scheduled: {
    icon: HiOutlineClock,
    color: "var(--theme-info)",
    label: "MEETING SCHEDULED",
  },
  meeting_completed: {
    icon: HiOutlineCheckCircle,
    color: "var(--theme-success)",
    label: "MEETING COMPLETED",
  },
  meeting_cancelled: {
    icon: HiOutlineExclamationCircle,
    color: "var(--theme-error)",
    label: "MEETING CANCELLED",
  },
  commit_pushed: {
    icon: HiOutlineCode,
    color: "var(--theme-primary)",
    label: "COMMIT PUSHED",
  },
  pr_opened: {
    icon: HiOutlineCode,
    color: "var(--theme-info)",
    label: "PR OPENED",
  },
  pr_merged: {
    icon: HiOutlineCheckCircle,
    color: "var(--theme-success)",
    label: "PR MERGED",
  },
  pr_reviewed: {
    icon: HiOutlineCode,
    color: "var(--theme-warning)",
    label: "PR REVIEWED",
  },
};

const timeFilterOptions = [
  { label: "TODAY", value: 24 },
  { label: "WEEK", value: 168 },
  { label: "MONTH", value: 720 },
];

const typeFilterOptions = [
  { label: "ALL", value: null },
  {
    label: "TASKS",
    value: [
      "task_created",
      "task_completed",
      "task_status_changed",
      "task_assigned",
    ],
  },
  {
    label: "TEAM",
    value: ["member_joined", "member_removed", "member_role_changed"],
  },
  {
    label: "CODE",
    value: ["commit_pushed", "pr_opened", "pr_merged", "pr_reviewed"],
  },
];

function getDayLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d.getTime() === today.getTime()) return "TODAY";
  if (d.getTime() === yesterday.getTime()) return "YESTERDAY";
  return date
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    .toUpperCase();
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDescription(activity: any): string {
  if (activity.description) return activity.description;
  const config =
    activityTypeConfig[activity.type as keyof typeof activityTypeConfig];
  return (
    config?.label ||
    activity.type?.replace(/_/g, " ").toUpperCase() ||
    "ACTIVITY"
  );
}

export default function TeamActivityFeed({
  projectId,
  workspaceId,
  limit = 20,
  showFilters = true,
  className,
}: TeamActivityFeedProps) {
  const [timeFilter, setTimeFilter] = useState(24);
  const [typeFilter, setTypeFilter] = useState<string[] | null>(null);

  const activities = useQuery(
    projectId
      ? api.activities.queries.getRecentTeamActivity
      : api.activities.queries.getWorkspaceActivities,
    projectId
      ? {
          projectId: projectId as any,
          limit,
          timeRangeHours: timeFilter,
          types: typeFilter || undefined,
        }
      : workspaceId
        ? {
            workspaceId: workspaceId as any,
            limit,
            timeRangeHours: timeFilter,
            types: typeFilter || undefined,
          }
        : "skip",
  );

  // Group activities by day
  const grouped = useMemo(() => {
    const list = activities || [];
    const map: Map<string, any[]> = new Map();
    for (const a of list) {
      const label = getDayLabel((a as any).timestamp || Date.now());
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(a);
    }
    return Array.from(map.entries()); // [[dayLabel, activities[]], ...]
  }, [activities]);

  // Loading skeleton
  if (!activities) {
    return (
      <div
        className={clsx(
          "bg-[var(--theme-background)] border-2 border-[var(--theme-border)]",
          className,
        )}
      >
        <div className="px-4 py-3 border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
            TEAM ACTIVITY
          </span>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-3 h-3 bg-[var(--theme-border)]" />
              <div className="w-4 h-4 bg-[var(--theme-border)]" />
              <div className="flex-1 h-3 bg-[var(--theme-border)]" />
              <div className="w-8 h-3 bg-[var(--theme-border)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "bg-[var(--theme-background)] border-2 border-[var(--theme-border)]",
        className,
      )}
    >
      {/* Header + filters */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
          TEAM ACTIVITY
        </span>

        {showFilters && (
          <div className="flex items-center gap-2">
            {/* Time filter */}
            <div className="flex items-center border-2 border-[var(--theme-border)]">
              {timeFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimeFilter(opt.value)}
                  className={clsx(
                    "px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
                    timeFilter === opt.value
                      ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                      : "text-[var(--theme-foreground)]/50 hover:text-[var(--theme-foreground)]",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="flex items-center border-2 border-[var(--theme-border)]">
              {typeFilterOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setTypeFilter(opt.value as string[] | null)}
                  className={clsx(
                    "px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
                    JSON.stringify(typeFilter) === JSON.stringify(opt.value)
                      ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                      : "text-[var(--theme-foreground)]/50 hover:text-[var(--theme-foreground)]",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline body */}
      <div className="overflow-y-auto max-h-[600px]">
        {grouped.length === 0 ? (
          <div className="py-12 text-center">
            <HiOutlineTerminal className="w-5 h-5 text-[var(--theme-foreground)]/20 mx-auto mb-3" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--theme-foreground)]/30">
              NO RECENT ACTIVITY
            </p>
          </div>
        ) : (
          grouped.map(([dayLabel, items]) => (
            <div key={dayLabel}>
              {/* Day header */}
              <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--theme-border)]/40 bg-[var(--theme-background-secondary)]/40 sticky top-0 z-10">
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--theme-foreground)]/40">
                  {dayLabel}
                </span>
                <div className="flex-1 h-px bg-[var(--theme-border)]/30" />
                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/30">
                  {items.length} events
                </span>
              </div>

              {/* Items */}
              <div className="relative pl-10 pr-4 py-2">
                {/* Vertical connector line */}
                <div className="absolute left-[28px] top-0 bottom-0 w-px bg-[var(--theme-border)]/40" />

                <div className="space-y-0">
                  {items.map((activity: any, idx: number) => {
                    const aType =
                      activity.type as keyof typeof activityTypeConfig;
                    const config = activityTypeConfig[aType] || {
                      icon: HiOutlineTerminal,
                      color: "var(--theme-primary)",
                      label:
                        aType?.replace(/_/g, " ").toUpperCase() || "ACTIVITY",
                    };
                    const Icon = config.icon;

                    return (
                      <div
                        key={activity._id || idx}
                        className="group relative flex items-start gap-3 py-2 hover:bg-[var(--theme-background-secondary)]/30 transition-colors -mx-4 px-4"
                      >
                        {/* Timeline dot + icon */}
                        <div className="absolute left-[-24px] top-[10px] flex items-center justify-center">
                          <div
                            className="w-4 h-4 border-2 border-[var(--theme-background)] flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${config.color} 20%, transparent)`,
                              outline: `1px solid ${config.color}`,
                            }}
                          >
                            <Icon
                              className="w-[8px] h-[8px]"
                              style={{ color: config.color }}
                            />
                          </div>
                        </div>

                        {/* Actor avatar */}
                        {activity.actor && (
                          <div className="shrink-0 mt-0.5">
                            <UserDisplay
                              userId={activity.actorId || activity.actor._id}
                              size="xs"
                              showName={false}
                              showStatus={false}
                              compact
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-[var(--theme-foreground)]">
                              {activity.actor?.name ||
                                activity.actorName ||
                                "UNKNOWN"}
                            </span>
                            <span
                              className="font-mono text-[10px] font-bold uppercase"
                              style={{ color: config.color }}
                            >
                              {config.label}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--theme-foreground)]/50 truncate">
                              {formatDescription(activity)}
                            </span>
                          </div>

                          {/* Metadata arrow (e.g. status old → new) */}
                          {activity.metadata?.oldValue &&
                            activity.metadata?.newValue && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/30 uppercase">
                                  {activity.metadata.oldValue}
                                </span>
                                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/20">
                                  →
                                </span>
                                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/50 uppercase">
                                  {activity.metadata.newValue}
                                </span>
                              </div>
                            )}
                        </div>

                        {/* Timestamp */}
                        <span className="font-mono text-[9px] text-[var(--theme-foreground)]/30 shrink-0 mt-1 tabular-nums">
                          {formatTime(activity.timestamp || Date.now())}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
