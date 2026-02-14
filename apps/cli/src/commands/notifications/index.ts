/**
 * Notifications commands for the LTF CLI
 * Placeholder structure until backend notifications support is added
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import output from '../../lib/output.js';

export function registerNotificationsCommands(program: Command): void {
  const notifCommand = program
    .command('notifications')
    .alias('notif')
    .description('Notification management commands');

  notifCommand
    .command('list')
    .alias('ls')
    .description('List notifications')
    .option('-u, --unread', 'Show only unread notifications')
    .option('--json', 'Output as JSON')
    .action(async (options: { unread?: boolean; json?: boolean }) => {
      requireAuth();

      if (options.json) {
        output.json([]);
        return;
      }

      output.info('Notifications will be available when backend support is added');
    });

  notifCommand
    .command('read <id>')
    .description('Mark a notification as read')
    .action(async (_id: string) => {
      requireAuth();
      output.info('Notifications will be available when backend support is added');
    });

  notifCommand
    .command('clear')
    .description('Clear all notifications')
    .action(async () => {
      requireAuth();
      output.info('Notifications will be available when backend support is added');
    });

  // Default action
  notifCommand.action(async () => {
    requireAuth();
    output.info('Notifications will be available when backend support is added');
    output.newline();
    output.log(output.colors.muted('Available subcommands: list, read <id>, clear'));
  });
}
