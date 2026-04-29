import { formatDistanceToNow, format, intervalToDuration } from "date-fns";

/**
 * Format a timestamp as a relative time string (e.g., "2 minutes ago", "3 hours ago").
 * Returns "just now" for timestamps less than 30 seconds ago.
 */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 30_000) return "just now";
  return formatDistanceToNow(timestamp, { addSuffix: true });
}

/**
 * Format a timestamp to a readable date string.
 * If the timestamp is in the current year, omits the year (e.g., "Apr 20").
 * Otherwise includes the year (e.g., "Apr 20, 2025").
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.getFullYear() === now.getFullYear()) {
    return format(date, "MMM d");
  }
  return format(date, "MMM d, yyyy");
}

/**
 * Format a duration in milliseconds to a human-readable string (e.g., "2h 15m").
 * Returns "0m" for durations under a minute.
 */
export function formatDuration(ms: number): string {
  if (ms < 60_000) return "0m";
  const duration = intervalToDuration({ start: 0, end: ms });
  const parts: Array<string> = [];
  if (duration.hours && duration.hours > 0) parts.push(`${duration.hours}h`);
  if (duration.minutes && duration.minutes > 0) parts.push(`${duration.minutes}m`);
  return parts.join(" ") || "0m";
}

/**
 * Check if a due date timestamp is overdue (in the past).
 */
export function isOverdue(dueDate: number): boolean {
  return dueDate < Date.now();
}

/**
 * Truncate a string to a max length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "\u2026";
}
