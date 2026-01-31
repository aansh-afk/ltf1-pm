/**
 * Daemon commands for the LTF CLI
 * Manages the background file watcher daemon that monitors git events
 */

import { Command } from 'commander';
import { startDaemon } from './start.js';
import { stopDaemon } from './stop.js';
import { showDaemonStatus } from './status.js';
import { showDaemonLogs } from './logs.js';

/**
 * Register daemon commands with the CLI
 */
export function registerDaemonCommands(program: Command): void {
  const daemon = program
    .command('daemon')
    .description('Manage the LTF background daemon that watches for git events');

  // Start daemon
  daemon
    .command('start')
    .description('Start the background daemon to watch for git events')
    .option('-f, --foreground', 'Run in foreground instead of background')
    .option('-v, --verbose', 'Enable verbose logging')
    .action(async (options) => {
      await startDaemon({
        foreground: options.foreground ?? false,
        verbose: options.verbose ?? false,
      });
    });


  // Stop daemon
  daemon
    .command('stop')
    .description('Stop the running daemon')
    .option('-f, --force', 'Force kill the daemon process')
    .action(async (options) => {
      await stopDaemon({
        force: options.force ?? false,
      });
    });

  // Daemon status
  daemon
    .command('status')
    .description('Show the current daemon status')
    .action(async () => {
      await showDaemonStatus();
    });

  // View logs
  daemon
    .command('logs')
    .description('View daemon logs')
    .option('-f, --follow', 'Follow log output (like tail -f)')
    .option('-n, --lines <number>', 'Number of lines to show', '50')
    .option('--clear', 'Clear the log file')
    .action(async (options) => {
      await showDaemonLogs({
        follow: options.follow ?? false,
        lines: parseInt(options.lines, 10) || 50,
        clear: options.clear ?? false,
      });
    });
}

export { startDaemon } from './start.js';
export { stopDaemon } from './stop.js';
export { showDaemonStatus } from './status.js';
export { showDaemonLogs } from './logs.js';
