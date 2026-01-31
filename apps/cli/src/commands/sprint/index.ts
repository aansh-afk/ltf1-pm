/**
 * Sprint commands for the LTF CLI
 * Manages sprint operations: list, status, create, add tasks
 */

import { Command } from 'commander';
import { listSprints } from './list.js';
import { sprintStatus } from './status.js';
import { createSprint } from './create.js';
import { addTaskToSprint } from './add.js';

export function registerSprintCommands(program: Command): void {
  const sprintCommand = program
    .command('sprint')
    .alias('s')
    .description('Sprint management commands');

  // ltf sprint list
  sprintCommand
    .command('list')
    .alias('ls')
    .description('List all sprints for the current project')
    .option('--status <status>', 'Filter by status (planning, active, completed)')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      await listSprints(options);
    });

  // ltf sprint status
  sprintCommand
    .command('status')
    .alias('st')
    .description('Show current sprint status with progress and burndown')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      await sprintStatus(options);
    });

  // ltf sprint create <name>
  sprintCommand
    .command('create <name>')
    .description('Create a new sprint')
    .option('--start <date>', 'Sprint start date (YYYY-MM-DD)')
    .option('--end <date>', 'Sprint end date (YYYY-MM-DD)')
    .option('--goal <goal>', 'Sprint goal description')
    .option('--json', 'Output in JSON format')
    .action(async (name, options) => {
      await createSprint(name, options);
    });

  // ltf sprint add <task>
  sprintCommand
    .command('add <task>')
    .description('Add a task to the current active sprint')
    .option('--sprint <sprintId>', 'Target sprint ID (defaults to current active sprint)')
    .option('--json', 'Output in JSON format')
    .action(async (task, options) => {
      await addTaskToSprint(task, options);
    });

  // ltf sprint (no subcommand) - show current sprint status or help
  sprintCommand.action(async () => {
    const { hasProjectContext } = await import('../../lib/config.js');

    if (hasProjectContext()) {
      // Show current sprint status
      await sprintStatus({});
    } else {
      // Show help
      sprintCommand.help();
    }
  });
}
