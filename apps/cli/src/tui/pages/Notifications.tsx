/**
 * Notifications Page - Placeholder until backend notifications are available
 * Shows notification list with j/k navigation and read/clear actions
 */

import { useState } from 'react';
import { useInput } from 'ink';
import { useNotifications } from '../hooks/useNotifications.js';
import type { Row } from '../types.js';
import { WHITE, LIGHT, GRAY, DIM } from '../theme.js';
import {
  segRow, blank, padSegs, fillTo,
  pageHeader, pageFooter,
} from '../helpers.js';

export interface NotificationsPageProps {
  width: number;
  height: number;
  isActive: boolean;
}

export function useNotificationsPage({ width: W, height: H, isActive }: NotificationsPageProps): Row[] {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (!isActive) return;

    // Navigation
    if (input === 'j' || key.downArrow) {
      setSelectedIndex(prev => Math.min(notifications.length - 1, prev + 1));
    }
    if (input === 'k' || key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }

    // Mark selected as read
    if (input === 'r' && notifications[selectedIndex]) {
      markRead(notifications[selectedIndex].id);
    }

    // Mark all as read
    if (input === 'R') {
      markAllRead();
    }
  }, { isActive });

  // ── Render ──
  const rows: Row[] = [];
  rows.push(...pageHeader('Notifications', '', W));
  rows.push(blank(W));

  if (notifications.length === 0) {
    rows.push(segRow(padSegs([
      { text: '  No notifications yet', color: GRAY },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  Notifications will appear here when team activity occurs.', color: DIM },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W, 'ESC Back'));
    return rows;
  }

  // Unread count badge
  rows.push(segRow(padSegs([
    { text: `  ${unreadCount} unread`, color: unreadCount > 0 ? WHITE : DIM },
    { text: `  |  ${notifications.length} total`, color: DIM },
  ], W)));
  rows.push(blank(W));

  // Notification list
  const visibleRows = H - 10;
  const visible = notifications.slice(0, visibleRows);

  for (let i = 0; i < visible.length; i++) {
    const n = visible[i];
    const isSelected = i === selectedIndex;
    const dot = n.read ? ' ' : '\u25CF';
    const dotColor = n.read ? DIM : LIGHT;

    if (isSelected) {
      rows.push({
        segments: padSegs([
          { text: `  \u25B8 ${dot} ${n.message}`, color: '#000000' },
        ], W),
        bgColor: WHITE,
      });
    } else {
      rows.push(segRow(padSegs([
        { text: '    ', color: WHITE },
        { text: dot + ' ', color: dotColor },
        { text: n.message, color: n.read ? DIM : LIGHT },
      ], W)));
    }
  }

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W, 'J/K Nav  R Read  Shift+R All Read  ESC Back'));
  return rows;
}
