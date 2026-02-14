/**
 * Time tracking hook for TUI
 * Reads timer state from config and provides start/stop controls
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { config } from '../../lib/config.js';

interface ActiveTimer {
  taskId: string;
  taskTitle: string;
  startTime: number;
  description?: string;
}

interface TimeEntry {
  taskId: string;
  taskTitle: string;
  startTime: number;
  endTime: number;
  duration: number;
  description?: string;
}

interface TimeTrackingState {
  activeTimer: ActiveTimer | null;
  elapsed: string;
  startTimer: (taskId: string, taskTitle: string, description?: string) => void;
  stopTimer: () => { duration: number; taskId: string } | null;
}

const confAny = config as unknown as {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  delete(key: string): void;
};

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function useTimeTracking(): TimeTrackingState {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => {
    return (confAny.get('timer') as ActiveTimer | undefined) || null;
  });
  const [elapsed, setElapsed] = useState('00:00:00');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update elapsed every second
  useEffect(() => {
    if (!activeTimer) {
      setElapsed('00:00:00');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tick = () => {
      const ms = Date.now() - activeTimer.startTime;
      setElapsed(formatElapsed(ms));
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeTimer]);

  const startTimer = useCallback((taskId: string, taskTitle: string, description?: string) => {
    const timer: ActiveTimer = {
      taskId,
      taskTitle,
      startTime: Date.now(),
      description,
    };
    confAny.set('timer', timer);
    setActiveTimer(timer);
  }, []);

  const stopTimer = useCallback((): { duration: number; taskId: string } | null => {
    const timer = activeTimer;
    if (!timer) return null;

    const endTime = Date.now();
    const duration = endTime - timer.startTime;

    // Save time entry
    const entries = (confAny.get('timeEntries') as TimeEntry[] | undefined) || [];
    entries.push({
      taskId: timer.taskId,
      taskTitle: timer.taskTitle,
      startTime: timer.startTime,
      endTime,
      duration,
      description: timer.description,
    });
    confAny.set('timeEntries', entries);

    // Clear active timer
    confAny.delete('timer');
    setActiveTimer(null);

    return { duration, taskId: timer.taskId };
  }, [activeTimer]);

  return { activeTimer, elapsed, startTimer, stopTimer };
}
