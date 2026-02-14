/**
 * Notifications hook - placeholder until backend notifications queries exist
 * Returns empty state for now; will wire to Convex when available
 */

import { useCallback } from 'react';

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: number;
}

export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export function useNotifications(): NotificationsState {
  const markRead = useCallback((_id: string) => {
    // TODO: Wire to backend when notifications queries are available
  }, []);

  const markAllRead = useCallback(() => {
    // TODO: Wire to backend when notifications queries are available
  }, []);

  return {
    notifications: [],
    unreadCount: 0,
    markRead,
    markAllRead,
  };
}
