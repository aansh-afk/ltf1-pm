/**
 * Time stop command
 * Stops the active timer and records the time entry
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { config } from '../../lib/config.js';
import output from '../../lib/output.js';

interface StopOptions {
  description?: string;
}

interface TimerState {
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

export function registerStopCommand(parent: Command): void {
  parent
    .command('stop')
    .description('Stop the active timer')
    .option('-d, --description <text>', 'Override or add description')
    .action(async (options: StopOptions) => {
      requireAuth();

      const confAny = config as unknown as {
        get(key: string): unknown;
        set(key: string, value: unknown): void;
        delete(key: string): void;
      };

      const timer = confAny.get('timer') as TimerState | undefined;
      if (!timer) {
        output.warning('No active timer');
        output.log(output.colors.muted('Start one with `ltf time start <taskId>`'));
        return;
      }

      const endTime = Date.now();
      const duration = endTime - timer.startTime;
      const description = options.description || timer.description;

      // Save time entry
      const entries = (confAny.get('timeEntries') as TimeEntry[] | undefined) || [];
      const entry: TimeEntry = {
        taskId: timer.taskId,
        taskTitle: timer.taskTitle,
        startTime: timer.startTime,
        endTime,
        duration,
        description,
      };
      entries.push(entry);
      confAny.set('timeEntries', entries);

      // Clear active timer
      confAny.delete('timer');

      output.success(`Timer stopped. Duration: ${formatDuration(duration)}`);
      output.keyValue([
        ['Task', `${timer.taskId}: ${timer.taskTitle}`],
        ['Duration', formatDuration(duration)],
        ['Description', description || output.colors.muted('none')],
      ]);
    });
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
