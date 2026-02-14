/**
 * Time tracking commands for the LTF CLI
 * Provides timer and time logging functionality
 */

import { Command } from 'commander';
import { registerStartCommand } from './start.js';
import { registerStopCommand } from './stop.js';
import { registerLogCommand } from './log.js';
import { registerStatusCommand } from './status.js';
import { registerReportCommand } from './report.js';

export function registerTimeCommands(program: Command): void {
  const timeCommand = program
    .command('time')
    .alias('tm')
    .description('Time tracking commands');

  registerStartCommand(timeCommand);
  registerStopCommand(timeCommand);
  registerLogCommand(timeCommand);
  registerStatusCommand(timeCommand);
  registerReportCommand(timeCommand);

  // Default: show status
  timeCommand.action(async () => {
    const { showTimeStatus } = await import('./status.js');
    await showTimeStatus({});
  });
}
