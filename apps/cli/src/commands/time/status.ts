/**
 * Time status command
 * Shows the current timer status
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { config } from '../../lib/config.js';
import output from '../../lib/output.js';

interface TimerState {
  taskId: string;
  taskTitle: string;
  startTime: number;
  description?: string;
}

interface StatusOptions {
  json?: boolean;
}

export async function showTimeStatus(_options: StatusOptions): Promise<void> {
  requireAuth();

  const confAny = config as unknown as { get(key: string): unknown };
  const timer = confAny.get('timer') as TimerState | undefined;

  if (!timer) {
    output.info('No active timer');
    output.log(output.colors.muted('Start one with `ltf time start <taskId>`'));
    return;
  }

  const elapsed = Date.now() - timer.startTime;

  output.header('Active Timer');
  output.keyValue([
    ['Task', `${timer.taskId}: ${timer.taskTitle}`],
    ['Elapsed', formatElapsed(elapsed)],
    ['Started', new Date(timer.startTime).toLocaleTimeString()],
    ['Description', timer.description || output.colors.muted('none')],
  ]);
  output.newline();
  output.log(output.colors.muted('Stop with `ltf time stop`'));
}

export function registerStatusCommand(parent: Command): void {
  parent
    .command('status')
    .description('Show active timer status')
    .option('--json', 'Output as JSON')
    .action(async (options: StatusOptions) => {
      if (options.json) {
        requireAuth();
        const confAny = config as unknown as { get(key: string): unknown };
        const timer = confAny.get('timer') as TimerState | undefined;
        if (timer) {
          output.json({
            ...timer,
            elapsed: Date.now() - timer.startTime,
          });
        } else {
          output.json({ active: false });
        }
        return;
      }

      await showTimeStatus(options);
    });
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
