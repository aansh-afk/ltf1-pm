/**
 * Time log command
 * Manually log time to a task without using the timer
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { config } from '../../lib/config.js';
import output from '../../lib/output.js';

interface LogOptions {
  duration: string;
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

export function registerLogCommand(parent: Command): void {
  parent
    .command('log <taskId>')
    .description('Log time to a task manually')
    .requiredOption('--duration <minutes>', 'Duration in minutes')
    .option('-d, --description <text>', 'Description of work done')
    .action(async (taskId: string, options: LogOptions) => {
      requireAuth();

      const minutes = parseInt(options.duration, 10);
      if (isNaN(minutes) || minutes <= 0) {
        output.error('Invalid duration', 'Duration must be a positive number of minutes');
        process.exit(1);
      }

      const durationMs = minutes * 60 * 1000;
      const now = Date.now();
      const taskTitle = `Task ${taskId}`;

      const confAny = config as unknown as {
        get(key: string): unknown;
        set(key: string, value: unknown): void;
      };

      const entries = (confAny.get('timeEntries') as TimeEntry[] | undefined) || [];
      const entry: TimeEntry = {
        taskId,
        taskTitle,
        startTime: now - durationMs,
        endTime: now,
        duration: durationMs,
        description: options.description,
      };
      entries.push(entry);
      confAny.set('timeEntries', entries);

      output.success(`Logged ${formatMinutes(minutes)} to ${taskId}`);
      if (options.description) {
        output.log(output.colors.muted(`  Description: ${options.description}`));
      }
    });
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  return `${hours}h ${remaining}m`;
}
