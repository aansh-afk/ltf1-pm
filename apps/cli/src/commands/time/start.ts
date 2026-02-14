/**
 * Time start command
 * Starts a timer for a given task
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { config } from '../../lib/config.js';
import output from '../../lib/output.js';

interface StartOptions {
  description?: string;
}

interface TimerState {
  taskId: string;
  taskTitle: string;
  startTime: number;
  description?: string;
}

export function registerStartCommand(parent: Command): void {
  parent
    .command('start <taskId>')
    .description('Start a timer for a task')
    .option('-d, --description <text>', 'Timer description')
    .action(async (taskId: string, options: StartOptions) => {
      requireAuth();

      // Check if a timer is already running
      const existing = (config as unknown as { get(key: string): unknown }).get('timer') as TimerState | undefined;
      if (existing) {
        const elapsed = formatElapsed(Date.now() - existing.startTime);
        output.warning(`Timer already running for ${existing.taskId}: ${existing.taskTitle} (${elapsed})`);
        output.log(output.colors.muted('Stop it first with `ltf time stop`'));
        return;
      }

      // Use taskId as title placeholder (backend task lookup can be added later)
      const taskTitle = `Task ${taskId}`;

      const timer: TimerState = {
        taskId,
        taskTitle,
        startTime: Date.now(),
        description: options.description,
      };

      (config as unknown as { set(key: string, value: unknown): void }).set('timer', timer);

      output.success(`Timer started for ${taskId}: ${taskTitle}`);
      if (options.description) {
        output.log(output.colors.muted(`  Description: ${options.description}`));
      }
      output.log(output.colors.muted('Stop with `ltf time stop`'));
    });
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
