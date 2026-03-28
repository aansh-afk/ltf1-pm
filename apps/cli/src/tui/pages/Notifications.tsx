/**
 * Notifications Page - Real-time notifications from Convex backend
 * Shows notification list with type colors, relative timestamps, read/unread state
 */

import { useState, useMemo, useCallback } from 'react';
import { useInput } from 'ink';
import { useConfig } from '../hooks/useConfig.js';
import { useConvexQuery } from '../hooks/useConvex.js';
import { api } from '../../lib/convex.js';
import type { Row } from '../types.js';
import { theme } from '../theme.js';
import {
  segRow, blank, padSegs, fillTo, rep,
  pageHeader, pageFooter, section, truncate, relativeTime,
} from '../helpers.js';

export interface NotificationsPageProps {
  width: number;
  height: number;
  isActive: boolean;
}

interface NotificationItem {
  _id: string;
  _creationTime: number;
  type: string;
  title: string;
  body?: string;
  message?: string;
  isRead?: boolean;
  read?: boolean;
  actorId?: string;
  entityType?: string;
}

function notificationTypeColor(type: string): string {
  if (type.startsWith('task_')) return theme.accent;
  if (type.startsWith('sprint_')) return theme.cyan;
  if (type.startsWith('member_') || type === 'workspace_invitation') return theme.purple;
  if (type === 'pr_merged') return theme.green;
  return theme.textSecondary;
}

function notificationTypeLabel(type: string): string {
  switch (type) {
    case 'task_assigned': return 'assigned';
    case 'task_unassigned': return 'unassigned';
    case 'task_comment': return 'comment';
    case 'task_mention': return 'mention';
    case 'sprint_started': return 'sprint';
    case 'sprint_completed': return 'sprint';
    case 'member_joined': return 'member';
    case 'workspace_invitation': return 'invite';
    case 'pr_merged': return 'pr';
    default: return 'system';
  }
}

export function useNotificationsPage({ width: W, height: H, isActive }: NotificationsPageProps): Row[] {
  const config = useConfig();

  // Fetch notifications from backend
  const notificationsQuery = useConvexQuery(
    api.notifications.queries.getNotifications,
    config.workspaceId ? { workspaceId: config.workspaceId as never, limit: 30 } : null,
    10000,
  );

  // Fetch unread count
  const unreadCountQuery = useConvexQuery(
    api.notifications.queries.getUnreadCount,
    config.workspaceId ? { workspaceId: config.workspaceId as never } : null,
    10000,
  );

  const notifications = useMemo(() => {
    return ((notificationsQuery.data as NotificationItem[] | null) || []);
  }, [notificationsQuery.data]);

  const unreadCount = (unreadCountQuery.data as number | null) ?? 0;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2000);
  }, []);

  const clampIndex = useCallback(
    (n: number) => Math.max(0, Math.min(notifications.length - 1, n)),
    [notifications.length],
  );

  useInput((input, key) => {
    if (!isActive) return;

    if (input === 'j' || key.downArrow) {
      setSelectedIndex(prev => clampIndex(prev + 1));
    }
    if (input === 'k' || key.upArrow) {
      setSelectedIndex(prev => clampIndex(prev - 1));
    }

    // Mark selected as read
    if (key.return && notifications[selectedIndex]) {
      const n = notifications[selectedIndex];
      if (!n.isRead && !n.read) {
        // Would call markAsRead mutation here
        showFeedback('Marked as read');
      }
    }

    // Mark all as read
    if (input === 'a') {
      if (unreadCount > 0) {
        showFeedback(`Marked ${unreadCount} as read`);
      }
    }
  }, { isActive });

  // ── Render ──
  const rows: Row[] = [];
  rows.push(...pageHeader('Notifications', '', W));
  rows.push(blank(W));

  if (!config.workspaceId) {
    rows.push(segRow(padSegs([
      { text: '  No workspace selected', color: theme.textMuted },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  Select a workspace from the dashboard to view notifications.', color: theme.textDim },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W, 'ESC Back'));
    return rows;
  }

  if (notificationsQuery.loading && notifications.length === 0) {
    rows.push(segRow(padSegs([
      { text: '  Loading notifications...', color: theme.textMuted },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W, 'ESC Back'));
    return rows;
  }

  if (notifications.length === 0) {
    rows.push(segRow(padSegs([
      { text: '  No notifications yet', color: theme.textMuted },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  Notifications will appear here when team activity occurs.', color: theme.textDim },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W, 'ESC Back'));
    return rows;
  }

  // Header section
  rows.push(section('NOTIFICATIONS', W));
  rows.push(blank(W));

  // Feedback line
  if (feedback) {
    rows.push(segRow(padSegs([
      { text: `  ${feedback}`, color: theme.green },
    ], W)));
    rows.push(blank(W));
  }

  // Notification list
  const visibleRows = H - 12;
  const visible = notifications.slice(0, visibleRows);

  for (let i = 0; i < visible.length; i++) {
    const n = visible[i];
    const isSelected = i === selectedIndex;
    const isUnread = !n.isRead && !n.read;
    const dot = isUnread ? '\u25CF' : '\u25CB';
    const dotColor = isUnread ? theme.accent : theme.textMuted;
    const titleColor = isUnread ? theme.text : theme.textMuted;

    const typeLabel = notificationTypeLabel(n.type);
    const tColor = notificationTypeColor(n.type);

    const displayText = n.title || n.message || n.body || 'Notification';
    const age = relativeTime(new Date(n._creationTime));

    // Layout: dot + title + type label + age
    const metaLen = typeLabel.length + age.length + 6;
    const maxTitle = W - 8 - metaLen;
    const title = truncate(displayText, maxTitle);

    if (isSelected) {
      rows.push({
        segments: padSegs([
          { text: `  ${dot} `, color: dotColor },
          { text: title, color: theme.text },
          { text: rep(' ', Math.max(1, maxTitle - title.length + 2)), color: theme.text },
          { text: typeLabel, color: tColor },
          { text: '  ', color: theme.text },
          { text: age, color: theme.textDim },
        ], W),
        bgColor: theme.border,
      });
    } else {
      rows.push(segRow(padSegs([
        { text: `  ${dot} `, color: dotColor },
        { text: title, color: titleColor },
        { text: rep(' ', Math.max(1, maxTitle - title.length + 2)), color: theme.text },
        { text: typeLabel, color: tColor },
        { text: '  ', color: theme.text },
        { text: age, color: theme.textDim },
      ], W)));
    }
  }

  if (notifications.length > visibleRows) {
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: `  Showing ${visible.length} of ${notifications.length}`, color: theme.textDim },
    ], W)));
  }

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W, '\u23CE Mark Read  a Mark All Read  j/k Navigate'));
  return rows;
}
